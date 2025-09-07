const Docker = require('dockerode');
const express = require('express');

const docker = new Docker();
const app = express();

// Configuration from environment
const CONFIG = {
  CLEANUP_INTERVAL: parseInt(process.env.CLEANUP_INTERVAL || '300') * 1000, // 5 minutes
  MAX_CONTAINER_AGE: parseInt(process.env.MAX_CONTAINER_AGE || '3600') * 1000, // 1 hour
  MAX_MEMORY_USAGE: parseInt(process.env.MAX_MEMORY_USAGE || '512'), // MB
  MAX_CPU_USAGE: parseInt(process.env.MAX_CPU_USAGE || '50'), // percentage
  PORT: parseInt(process.env.PORT || '3002')
};

class ContainerMonitor {
  constructor() {
    this.metrics = {
      totalContainers: 0,
      runningContainers: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      lastCleanup: new Date(),
      containersTerminated: 0,
      errors: 0
    };

    this.startMonitoring();
  }

  async startMonitoring() {
    console.log('🔍 Starting container monitoring...');
    console.log('Configuration:', CONFIG);

    // Initial cleanup
    await this.performCleanup();

    // Schedule periodic cleanup
    setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
        this.metrics.errors++;
      }
    }, CONFIG.CLEANUP_INTERVAL);

    // Monitor container stats every 30 seconds
    setInterval(async () => {
      try {
        await this.updateMetrics();
      } catch (error) {
        console.error('Metrics update error:', error);
        this.metrics.errors++;
      }
    }, 30000);

    console.log('✅ Container monitoring started');
  }

  async performCleanup() {
    console.log('🧹 Performing container cleanup...');
    
    try {
      // Get all containers managed by SwiStack
      const containers = await docker.listContainers({ all: true });
      const swistackContainers = containers.filter(container => 
        container.Labels && container.Labels['swistack.managed'] === 'true'
      );

      console.log(`Found ${swistackContainers.length} SwiStack containers`);

      for (const containerInfo of swistackContainers) {
        await this.checkAndCleanupContainer(containerInfo);
      }

      this.metrics.lastCleanup = new Date();
      console.log(`✅ Cleanup completed. Terminated ${this.metrics.containersTerminated} containers.`);

    } catch (error) {
      console.error('Cleanup failed:', error);
      this.metrics.errors++;
    }
  }

  async checkAndCleanupContainer(containerInfo) {
    try {
      const container = docker.getContainer(containerInfo.Id);
      const inspect = await container.inspect();
      
      // Check container age
      const created = new Date(inspect.Created);
      const age = Date.now() - created.getTime();
      
      if (age > CONFIG.MAX_CONTAINER_AGE) {
        console.log(`🗑️ Container ${containerInfo.Names[0]} is too old (${Math.round(age/1000/60)} minutes), terminating...`);
        await this.terminateContainer(container, 'age_limit');
        return;
      }

      // Skip if container is not running
      if (inspect.State.Status !== 'running') {
        return;
      }

      // Check resource usage
      const stats = await container.stats({ stream: false });
      const memoryUsageMB = stats.memory_stats.usage / 1024 / 1024;
      const cpuUsage = this.calculateCpuUsage(stats);

      // Check memory limit
      if (memoryUsageMB > CONFIG.MAX_MEMORY_USAGE) {
        console.log(`🚨 Container ${containerInfo.Names[0]} exceeds memory limit (${Math.round(memoryUsageMB)}MB), terminating...`);
        await this.terminateContainer(container, 'memory_limit');
        return;
      }

      // Check CPU limit
      if (cpuUsage > CONFIG.MAX_CPU_USAGE) {
        console.log(`🚨 Container ${containerInfo.Names[0]} exceeds CPU limit (${Math.round(cpuUsage)}%), terminating...`);
        await this.terminateContainer(container, 'cpu_limit');
        return;
      }

      // Check if container is responsive
      const isHealthy = await this.checkContainerHealth(container);
      if (!isHealthy) {
        console.log(`🚨 Container ${containerInfo.Names[0]} is unresponsive, terminating...`);
        await this.terminateContainer(container, 'unresponsive');
        return;
      }

    } catch (error) {
      console.error(`Error checking container ${containerInfo.Names[0]}:`, error);
    }
  }

  async terminateContainer(container, reason) {
    try {
      // Try graceful stop first
      await container.stop({ t: 10 });
      
      // Wait a bit then remove
      setTimeout(async () => {
        try {
          await container.remove({ force: true });
          this.metrics.containersTerminated++;
          console.log(`✅ Container terminated (reason: ${reason})`);
        } catch (error) {
          console.error('Error removing container:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Error terminating container:', error);
      // Force remove if graceful stop fails
      try {
        await container.remove({ force: true });
        this.metrics.containersTerminated++;
      } catch (removeError) {
        console.error('Error force removing container:', removeError);
      }
    }
  }

  calculateCpuUsage(stats) {
    try {
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const numberCpus = stats.cpu_stats.online_cpus || 1;
      
      if (systemDelta > 0 && cpuDelta > 0) {
        return (cpuDelta / systemDelta) * numberCpus * 100;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async checkContainerHealth(container) {
    try {
      // Get container port mapping
      const inspect = await container.inspect();
      const ports = inspect.NetworkSettings.Ports;
      
      // Find the first HTTP port
      let port = null;
      for (const [containerPort, hostPorts] of Object.entries(ports)) {
        if (hostPorts && hostPorts.length > 0) {
          port = hostPorts[0].HostPort;
          break;
        }
      }

      if (!port) return true; // No port to check

      // Try to connect to the health endpoint
      const response = await fetch(`http://localhost:${port}/_health`, {
        timeout: 5000
      }).catch(() => null);

      return response && response.ok;
    } catch (error) {
      return false; // Assume unhealthy if we can't check
    }
  }

  async updateMetrics() {
    try {
      // Get all containers
      const allContainers = await docker.listContainers({ all: true });
      const runningContainers = await docker.listContainers();
      const swistackContainers = allContainers.filter(container => 
        container.Labels && container.Labels['swistack.managed'] === 'true'
      );

      this.metrics.totalContainers = swistackContainers.length;
      this.metrics.runningContainers = runningContainers.filter(container => 
        container.Labels && container.Labels['swistack.managed'] === 'true'
      ).length;

      // Calculate total resource usage
      let totalMemory = 0;
      let totalCpu = 0;
      let containerCount = 0;

      for (const containerInfo of runningContainers) {
        if (containerInfo.Labels && containerInfo.Labels['swistack.managed'] === 'true') {
          try {
            const container = docker.getContainer(containerInfo.Id);
            const stats = await container.stats({ stream: false });
            
            totalMemory += stats.memory_stats.usage / 1024 / 1024; // MB
            totalCpu += this.calculateCpuUsage(stats);
            containerCount++;
          } catch (error) {
            // Skip containers that can't provide stats
          }
        }
      }

      this.metrics.memoryUsage = Math.round(totalMemory);
      this.metrics.cpuUsage = containerCount > 0 ? Math.round(totalCpu / containerCount) : 0;

    } catch (error) {
      console.error('Error updating metrics:', error);
      this.metrics.errors++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}

// Initialize monitor
const monitor = new ContainerMonitor();

// Express endpoints
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'container-monitor',
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', (req, res) => {
  res.json(monitor.getMetrics());
});

app.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const swistackContainers = containers
      .filter(container => 
        container.Labels && container.Labels['swistack.managed'] === 'true'
      )
      .map(container => ({
        id: container.Id.substring(0, 12),
        name: container.Names[0],
        status: container.Status,
        created: container.Created,
        labels: container.Labels
      }));

    res.json({
      containers: swistackContainers,
      total: swistackContainers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual cleanup trigger
app.post('/cleanup', async (req, res) => {
  try {
    await monitor.performCleanup();
    res.json({ 
      success: true, 
      message: 'Cleanup completed',
      metrics: monitor.getMetrics()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(CONFIG.PORT, () => {
  console.log(`🔍 Container monitor listening on port ${CONFIG.PORT}`);
  console.log(`📊 Metrics: http://localhost:${CONFIG.PORT}/metrics`);
  console.log(`🏥 Health: http://localhost:${CONFIG.PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Container monitor shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Container monitor shutting down...');
  process.exit(0);
});