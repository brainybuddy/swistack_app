import { db } from '../config/database';
import { storageService } from './StorageService';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  responseTime: number;
  details?: any;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealth[];
  uptime: number;
  timestamp: Date;
}

export class HealthCheckService {
  private static serviceChecks = new Map<string, () => Promise<ServiceHealth>>();

  static {
    // Register all service health checks
    this.registerHealthCheck('database', this.checkDatabase.bind(this));
    this.registerHealthCheck('storage', this.checkStorage.bind(this));
    this.registerHealthCheck('redis', this.checkRedis.bind(this));
  }

  static registerHealthCheck(name: string, checkFn: () => Promise<ServiceHealth>) {
    this.serviceChecks.set(name, checkFn);
  }

  static async checkAllServices(): Promise<SystemHealth> {
    const startTime = Date.now();
    const services: ServiceHealth[] = [];

    // Run all health checks in parallel
    const healthCheckPromises = Array.from(this.serviceChecks.entries()).map(
      async ([name, checkFn]) => {
        try {
          const result = await Promise.race([
            checkFn(),
            this.timeoutPromise(10000, name) // 10 second timeout
          ]);
          return result;
        } catch (error) {
          return {
            name,
            status: 'unhealthy' as const,
            message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            responseTime: Date.now() - startTime,
            details: { error: error instanceof Error ? error.message : error }
          };
        }
      }
    );

    const results = await Promise.allSettled(healthCheckPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        services.push(result.value);
      } else {
        const name = Array.from(this.serviceChecks.keys())[index];
        services.push({
          name,
          status: 'unhealthy',
          message: 'Health check timed out or failed',
          responseTime: Date.now() - startTime,
          details: { error: result.reason }
        });
      }
    });

    // Determine overall system health
    const hasUnhealthy = services.some(s => s.status === 'unhealthy');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      services,
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  private static async timeoutPromise(ms: number, serviceName: string): Promise<ServiceHealth> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout for ${serviceName}`));
      }, ms);
    });
  }

  private static async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Test database connectivity with a simple query
      await db.raw('SELECT 1');
      
      // Check if critical tables exist
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'projects', 'project_files', 'project_templates')
      `);
      
      const existingTables = tables.rows.map((row: any) => row.table_name);
      const requiredTables = ['users', 'projects', 'project_files', 'project_templates'];
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      const responseTime = Date.now() - startTime;
      
      if (missingTables.length > 0) {
        return {
          name: 'database',
          status: 'degraded',
          message: `Database connected but missing tables: ${missingTables.join(', ')}`,
          responseTime,
          details: { missingTables, existingTables }
        };
      }
      
      return {
        name: 'database',
        status: 'healthy',
        message: 'Database connection successful, all tables present',
        responseTime,
        details: { tables: existingTables }
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  }

  private static async checkStorage(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // First, check if the bucket exists
      const bucketExists = await storageService.client.bucketExists(storageService.bucketName);
      
      if (!bucketExists) {
        // If bucket doesn't exist, try to create it (initialization might not have run yet)
        try {
          await storageService.client.makeBucket(storageService.bucketName, 'us-east-1');
        } catch (createError) {
          // Ignore if bucket already exists (race condition)
          if (createError instanceof Error && !createError.message.includes('already exists')) {
            throw createError;
          }
        }
      }
      
      // Test MinIO connectivity by trying basic operations
      const testKey = `health-check-${Date.now()}.txt`;
      const testContent = Buffer.from('health-check');
      
      // Try to upload a small test file directly without quota checks
      await storageService.client.putObject(
        storageService.bucketName,
        `health-checks/${testKey}`,
        testContent,
        testContent.length,
        { 'Content-Type': 'text/plain' }
      );
      
      // Try to download it back
      const stream = await storageService.client.getObject(
        storageService.bucketName,
        `health-checks/${testKey}`
      );
      
      // Collect stream data
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const downloaded = Buffer.concat(chunks);
      
      // Clean up test file
      await storageService.client.removeObject(
        storageService.bucketName,
        `health-checks/${testKey}`
      );
      
      const responseTime = Date.now() - startTime;
      
      if (downloaded.toString() !== testContent.toString()) {
        return {
          name: 'storage',
          status: 'degraded',
          message: 'Storage accessible but data integrity issue',
          responseTime,
          details: { expected: testContent.toString(), received: downloaded.toString() }
        };
      }
      
      return {
        name: 'storage',
        status: 'healthy',
        message: 'Storage service operational',
        responseTime,
        details: { endpoint: process.env.MINIO_ENDPOINT }
      };
    } catch (error) {
      return {
        name: 'storage',
        status: 'unhealthy',
        message: `Storage service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
        details: { 
          error: error instanceof Error ? error.message : error,
          endpoint: process.env.MINIO_ENDPOINT 
        }
      };
    }
  }

  private static async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // For now, we'll just return a healthy status since Redis is optional
      // In a full implementation, you would test Redis connectivity here
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'redis',
        status: 'healthy',
        message: 'Redis service check not implemented - assuming healthy',
        responseTime,
        details: { 
          note: 'Redis health check needs implementation',
          url: process.env.REDIS_URL 
        }
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'degraded',
        message: `Redis service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  }

  static async waitForServices(timeoutMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    
    console.log('⏳ Waiting for services to become healthy...');
    
    while (Date.now() - startTime < timeoutMs) {
      const health = await this.checkAllServices();
      
      if (health.status === 'healthy') {
        console.log('✅ All services are healthy');
        return true;
      }
      
      const unhealthyServices = health.services
        .filter(s => s.status === 'unhealthy')
        .map(s => s.name);
      
      if (unhealthyServices.length > 0) {
        console.log(`⚠️  Waiting for services: ${unhealthyServices.join(', ')}`);
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('❌ Timeout waiting for services to become healthy');
    return false;
  }
}