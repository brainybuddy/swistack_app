import { ContainerManager, containerManager } from './ContainerManager';
import { ProxyManager, proxyManager } from './ProxyManager';
import { LivePreviewService } from './LivePreviewService';

interface ProductionDevServer {
  projectId: string;
  projectName: string;
  userId: string;
  username: string;
  containerId: string;
  port: number;
  customDomain: string;
  publicUrl: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  lastStarted: Date;
  resourceUsage: {
    memory: string;
    cpu: string;
  };
}

export class ProductionDevServerManager {
  private static instance: ProductionDevServerManager;
  private servers: Map<string, ProductionDevServer> = new Map();

  public static getInstance(): ProductionDevServerManager {
    if (!ProductionDevServerManager.instance) {
      ProductionDevServerManager.instance = new ProductionDevServerManager();
    }
    return ProductionDevServerManager.instance;
  }

  /**
   * Start a production development server for a project
   * This combines containerization with custom domain routing
   */
  async startProductionDevServer(
    projectId: string,
    userId: string,
    username: string
  ): Promise<{
    success: boolean;
    port?: number;
    url?: string;
    customDomain?: string;
    containerId?: string;
    error?: string;
  }> {
    try {
      // Check if server is already running
      const existing = this.servers.get(projectId);
      if (existing && existing.status === 'running') {
        return {
          success: true,
          port: existing.port,
          url: existing.publicUrl,
          customDomain: existing.customDomain,
          containerId: existing.containerId
        };
      }

      // Get project data
      const project = await LivePreviewService.getProjectForPreview(projectId, userId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Start containerized development server
      console.log(`🚀 Starting containerized server for ${project.name}...`);
      const containerResult = await containerManager.startProjectContainer(projectId, userId);
      
      if (!containerResult.success) {
        return { success: false, error: containerResult.error };
      }

      // Create custom domain proxy
      console.log(`🌍 Creating custom domain for ${project.name}...`);
      const proxyConfig = await proxyManager.createProjectProxy(
        projectId,
        project.name,
        userId,
        username,
        containerResult.port!
      );

      if (!proxyConfig) {
        // Rollback container if proxy creation fails
        await containerManager.stopProjectContainer(projectId);
        return { success: false, error: 'Failed to create custom domain' };
      }

      // Store server information
      const devServer: ProductionDevServer = {
        projectId,
        projectName: project.name,
        userId,
        username,
        containerId: containerResult.containerId!,
        port: containerResult.port!,
        customDomain: proxyConfig.fullDomain,
        publicUrl: proxyConfig.sslEnabled ? 
          `https://${proxyConfig.fullDomain}` : 
          `http://${proxyConfig.fullDomain}`,
        status: 'starting',
        lastStarted: new Date(),
        resourceUsage: {
          memory: '0MB',
          cpu: '0%'
        }
      };

      this.servers.set(projectId, devServer);

      // Wait a moment for container to fully start
      setTimeout(async () => {
        const serverInfo = this.servers.get(projectId);
        if (serverInfo) {
          serverInfo.status = 'running';
          await this.updateResourceUsage(projectId);
        }
      }, 10000);

      console.log(`✅ Production dev server started: ${devServer.publicUrl}`);

      return {
        success: true,
        port: devServer.port,
        url: devServer.publicUrl,
        customDomain: devServer.customDomain,
        containerId: devServer.containerId
      };

    } catch (error) {
      console.error('Error starting production dev server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Stop a production development server
   */
  async stopProductionDevServer(projectId: string): Promise<boolean> {
    const server = this.servers.get(projectId);
    if (!server) {
      return false;
    }

    try {
      console.log(`🛑 Stopping production dev server for ${server.projectName}...`);

      // Stop container
      const containerStopped = await containerManager.stopProjectContainer(projectId);
      
      // Remove proxy configuration
      const proxyStopped = await proxyManager.removeProjectProxy(projectId);

      if (containerStopped || proxyStopped) {
        server.status = 'stopped';
        this.servers.delete(projectId);
        console.log(`✅ Production dev server stopped: ${server.customDomain}`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error stopping production dev server:', error);
      return false;
    }
  }

  /**
   * Get server information
   */
  getServerInfo(projectId: string): ProductionDevServer | null {
    return this.servers.get(projectId) || null;
  }

  /**
   * Get all running servers
   */
  getRunningServers(): ProductionDevServer[] {
    return Array.from(this.servers.values())
      .filter(server => server.status === 'running');
  }

  /**
   * Get servers for a specific user
   */
  getUserServers(userId: string): ProductionDevServer[] {
    return Array.from(this.servers.values())
      .filter(server => server.userId === userId);
  }

  /**
   * Update resource usage for a server
   */
  async updateResourceUsage(projectId: string): Promise<void> {
    const server = this.servers.get(projectId);
    if (!server) return;

    try {
      const stats = await containerManager.getContainerStats(projectId);
      if (stats) {
        server.resourceUsage = {
          memory: `${Math.round(stats.memory.usage / 1024 / 1024)}MB`,
          cpu: `${Math.round(this.calculateCpuUsage(stats.cpu))}%`
        };
      }
    } catch (error) {
      console.error('Error updating resource usage:', error);
    }
  }

  /**
   * Calculate CPU usage percentage
   */
  private calculateCpuUsage(cpuStats: any): number {
    try {
      const cpuDelta = cpuStats.cpu_usage.total_usage - cpuStats.precpu_stats?.cpu_usage?.total_usage || 0;
      const systemDelta = cpuStats.system_cpu_usage - cpuStats.precpu_stats?.system_cpu_usage || 0;
      const numberCpus = cpuStats.online_cpus || 1;
      
      if (systemDelta > 0 && cpuDelta > 0) {
        return (cpuDelta / systemDelta) * numberCpus * 100;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get server status and health
   */
  async getServerStatus(projectId: string): Promise<{
    isRunning: boolean;
    url: string | null;
    customDomain: string | null;
    health: 'healthy' | 'unhealthy' | 'unknown';
    resourceUsage: object;
  }> {
    const server = this.servers.get(projectId);
    
    if (!server) {
      return {
        isRunning: false,
        url: null,
        customDomain: null,
        health: 'unknown',
        resourceUsage: {}
      };
    }

    // Update resource usage
    await this.updateResourceUsage(projectId);

    // Check container health
    const containerRunning = containerManager.isContainerRunning(projectId);
    const proxyConfig = proxyManager.getProxyConfig(projectId);

    return {
      isRunning: server.status === 'running' && containerRunning,
      url: server.publicUrl,
      customDomain: server.customDomain,
      health: containerRunning ? 'healthy' : 'unhealthy',
      resourceUsage: server.resourceUsage
    };
  }

  /**
   * Scale user containers based on usage
   */
  async scaleUserContainers(userId: string): Promise<void> {
    const userServers = this.getUserServers(userId);
    console.log(`🔄 Scaling containers for user ${userId} (${userServers.length} servers)`);

    for (const server of userServers) {
      await this.updateResourceUsage(server.projectId);
      
      // Could implement auto-scaling logic here
      // e.g., stop idle containers, allocate more resources to busy ones
    }
  }

  /**
   * Clean up idle servers
   */
  async cleanupIdleServers(maxIdleTime: number = 3600000): Promise<void> {
    const now = Date.now();
    const serversToCleanup: string[] = [];

    for (const [projectId, server] of this.servers.entries()) {
      const idleTime = now - server.lastStarted.getTime();
      
      if (idleTime > maxIdleTime && server.status === 'running') {
        console.log(`🧹 Marking idle server for cleanup: ${server.customDomain} (idle for ${Math.round(idleTime/1000/60)} minutes)`);
        serversToCleanup.push(projectId);
      }
    }

    // Cleanup idle servers
    for (const projectId of serversToCleanup) {
      await this.stopProductionDevServer(projectId);
    }

    if (serversToCleanup.length > 0) {
      console.log(`✅ Cleaned up ${serversToCleanup.length} idle servers`);
    }
  }

  /**
   * Get production metrics
   */
  getMetrics(): {
    totalServers: number;
    runningServers: number;
    totalMemoryUsage: number;
    averageCpuUsage: number;
    customDomains: number;
    containers: number;
  } {
    const servers = Array.from(this.servers.values());
    const runningServers = servers.filter(s => s.status === 'running');

    return {
      totalServers: servers.length,
      runningServers: runningServers.length,
      totalMemoryUsage: runningServers.reduce((sum, server) => {
        return sum + parseInt(server.resourceUsage.memory.replace('MB', '') || '0');
      }, 0),
      averageCpuUsage: runningServers.length > 0 ? 
        runningServers.reduce((sum, server) => {
          return sum + parseInt(server.resourceUsage.cpu.replace('%', '') || '0');
        }, 0) / runningServers.length : 0,
      customDomains: proxyManager.getActiveProxies().length,
      containers: containerManager.getRunningContainers().length
    };
  }

  /**
   * Stop all servers (for shutdown)
   */
  async stopAllServers(): Promise<void> {
    const projectIds = Array.from(this.servers.keys());
    console.log(`🛑 Stopping all production dev servers (${projectIds.length} servers)...`);
    
    await Promise.all(
      projectIds.map(id => this.stopProductionDevServer(id))
    );

    console.log('✅ All production dev servers stopped');
  }
}

export const productionDevServerManager = ProductionDevServerManager.getInstance();