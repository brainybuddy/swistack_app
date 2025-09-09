import Docker from 'dockerode';
import { promises as fs } from 'fs';
import path from 'path';
import { LivePreviewService, PreviewableProject } from './LivePreviewService';
import { portAllocationManager } from './PortAllocationManager';

interface ProjectContainer {
  projectId: string;
  projectName: string;
  containerId: string;
  containerName: string;
  port: number;
  internalPort: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  lastStarted: Date;
  workspaceDir: string;
  resourceLimits: {
    memory: string; // e.g., '512m'
    cpus: string;   // e.g., '0.5'
  };
}

export class ContainerManager {
  private static instance: ContainerManager;
  private docker: Docker;
  private containers: Map<string, ProjectContainer> = new Map();
  private readonly workspaceRoot = '/tmp/swistack-containers';
  private readonly networkName = 'swistack-network';

  public static getInstance(): ContainerManager {
    if (!ContainerManager.instance) {
      ContainerManager.instance = new ContainerManager();
    }
    return ContainerManager.instance;
  }

  private constructor() {
    this.docker = new Docker();
    this.initializeDockerEnvironment();
  }

  private async initializeDockerEnvironment() {
    try {
      await fs.mkdir(this.workspaceRoot, { recursive: true });
      await this.ensureNetwork();
      await this.ensureBaseImages();
    } catch (error) {
      console.error('Failed to initialize Docker environment:', error);
    }
  }

  private async ensureNetwork() {
    try {
      const networks = await this.docker.listNetworks();
      const existingNetwork = networks.find(net => net.Name === this.networkName);
      
      if (!existingNetwork) {
        await this.docker.createNetwork({
          Name: this.networkName,
          Driver: 'bridge',
          Options: {
            'com.docker.network.bridge.name': this.networkName
          }
        });
        console.log(`✅ Created Docker network: ${this.networkName}`);
      }
    } catch (error) {
      console.error('Failed to ensure Docker network:', error);
    }
  }

  private async ensureBaseImages() {
    const images = [
      'node:18-alpine',
      'nginx:alpine'
    ];

    for (const image of images) {
      try {
        await this.docker.getImage(image).inspect();
      } catch {
        console.log(`📥 Pulling Docker image: ${image}`);
        await this.docker.pull(image);
      }
    }
  }

  /**
   * Start a containerized development server for a project
   */
  async startProjectContainer(projectId: string, userId: string): Promise<{
    success: boolean;
    port?: number;
    url?: string;
    containerId?: string;
    error?: string;
  }> {
    try {
      // Check if container is already running
      const existing = this.containers.get(projectId);
      if (existing && existing.status === 'running') {
        return {
          success: true,
          port: existing.port,
          url: `http://localhost:${existing.port}`,
          containerId: existing.containerId
        };
      }

      // Get project data
      const project = await LivePreviewService.getProjectForPreview(projectId, userId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Create workspace directory
      const workspaceDir = path.join(this.workspaceRoot, projectId);
      await fs.mkdir(workspaceDir, { recursive: true });

      // Write project files to workspace
      await this.writeProjectFiles(project, workspaceDir);

      // Generate Dockerfile and docker-compose files
      await this.generateContainerConfig(project, workspaceDir);

      // Start the container
      const container = await this.spawnProjectContainer(project, workspaceDir);
      
      if (!container) {
        return { success: false, error: 'Failed to start container' };
      }

      // Store container info
      this.containers.set(projectId, container);

      return {
        success: true,
        port: container.port,
        url: `http://localhost:${container.port}`,
        containerId: container.containerId
      };

    } catch (error) {
      console.error('Error starting project container:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Stop a project container
   */
  async stopProjectContainer(projectId: string): Promise<boolean> {
    const container = this.containers.get(projectId);
    if (!container) {
      return false;
    }

    try {
      const dockerContainer = this.docker.getContainer(container.containerId);
      await dockerContainer.stop();
      await dockerContainer.remove();

      container.status = 'stopped';
      
      // Clean up workspace directory
      try {
        await fs.rm(container.workspaceDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to clean up workspace:', error);
      }

      this.containers.delete(projectId);
      console.log(`✅ Stopped and removed container for project ${projectId}`);
      return true;
    } catch (error) {
      console.error('Failed to stop container:', error);
      return false;
    }
  }

  /**
   * Write project files to workspace directory
   */
  private async writeProjectFiles(project: PreviewableProject, workspaceDir: string) {
    for (const file of project.files) {
      if (file.type === 'directory') {
        const dirPath = path.join(workspaceDir, file.path);
        await fs.mkdir(dirPath, { recursive: true });
      } else if (file.type === 'file') {
        const filePath = path.join(workspaceDir, file.path);
        const fileDir = path.dirname(filePath);
        
        // Ensure directory exists
        await fs.mkdir(fileDir, { recursive: true });
        
        // Write file content
        await fs.writeFile(filePath, file.content, 'utf8');
      }
    }
  }

  /**
   * Generate Docker configuration files
   */
  private async generateContainerConfig(project: PreviewableProject, workspaceDir: string) {
    // Generate Dockerfile
    const dockerfile = this.generateDockerfile(project);
    await fs.writeFile(path.join(workspaceDir, 'Dockerfile'), dockerfile, 'utf8');

    // Generate .dockerignore
    const dockerignore = `
node_modules
.next
.git
*.log
.env.local
.DS_Store
`;
    await fs.writeFile(path.join(workspaceDir, '.dockerignore'), dockerignore.trim(), 'utf8');

    // Generate package.json with correct port
    await this.generatePackageJson(project, workspaceDir);
  }

  /**
   * Generate Dockerfile based on project type
   */
  private generateDockerfile(project: PreviewableProject): string {
    const isNextJs = project.template.includes('next') || 
                    project.files.some(f => (
                      f.path === 'next.config.js' ||
                      f.path === 'src/app/page.tsx' ||
                      f.path === 'app/page.tsx' ||
                      f.path === 'src/pages/index.tsx' ||
                      f.path === 'pages/index.tsx'
                    ));
    
    if (isNextJs) {
      return `
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"]
`.trim();
    } else {
      // Default to simple HTTP server
      return `
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy source code
COPY . .

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm ci --only=production; fi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["serve", "-s", ".", "-l", "3000"]
`.trim();
    }
  }

  /**
   * Generate package.json with correct configuration
   */
  private async generatePackageJson(project: PreviewableProject, workspaceDir: string) {
    const packageJsonPath = path.join(workspaceDir, 'package.json');
    
    let packageJson: any = {
      name: project.name.toLowerCase().replace(/\\s+/g, '-'),
      version: '1.0.0',
      scripts: {},
      dependencies: {},
      devDependencies: {}
    };

    try {
      // Try to read existing package.json from project files
      const existingContent = await fs.readFile(packageJsonPath, 'utf8');
      packageJson = { ...packageJson, ...JSON.parse(existingContent) };
    } catch {
      // Use default package.json
    }

    // Detect project type and set up appropriate scripts
    const isNextJs =
      project.template.includes('next') ||
      project.files.some(
        (f) =>
          f.path === 'next.config.js' ||
          f.path === 'src/app/page.tsx' ||
          f.path === 'app/page.tsx' ||
          f.path === 'src/pages/index.tsx' ||
          f.path === 'pages/index.tsx'
      );
    
    if (isNextJs) {
      packageJson.dependencies = {
        ...packageJson.dependencies,
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0'
      };
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'typescript': '^5.0.0'
      };
      packageJson.scripts = {
        ...packageJson.scripts,
        'dev': 'next dev -p 3000',
        'build': 'next build',
        'start': 'next start -p 3000'
      };
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
  }

  /**
   * Spawn the project container
   */
  private async spawnProjectContainer(project: PreviewableProject, workspaceDir: string): Promise<ProjectContainer | null> {
    try {
      const containerName = `swistack-${project.id}`;
      const externalPort = project.ports.frontend;
      const internalPort = 3000;

      // Build the Docker image
      console.log(`🔨 Building Docker image for ${project.name}...`);
      const stream = await this.docker.buildImage({
        context: workspaceDir,
        src: ['.']
      }, {
        t: containerName,
        dockerfile: 'Dockerfile'
      });

      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err: any) => {
          if (err) reject(err);
          else resolve(null);
        });
      });

      // Create and start the container
      console.log(`🚀 Starting container for ${project.name} on port ${externalPort}...`);
      const container = await this.docker.createContainer({
        Image: containerName,
        name: containerName,
        ExposedPorts: {
          [`${internalPort}/tcp`]: {}
        },
        PortBindings: {
          [`${internalPort}/tcp`]: [{ HostPort: externalPort.toString() }]
        },
        NetworkMode: this.networkName,
        RestartPolicy: { Name: 'unless-stopped' },
        HostConfig: {
          Memory: 512 * 1024 * 1024, // 512MB
          CpuShares: 512, // 0.5 CPU
          PortBindings: {
            [`${internalPort}/tcp`]: [{ HostPort: externalPort.toString() }]
          }
        },
        Labels: {
          'swistack.project.id': project.id,
          'swistack.project.name': project.name,
          'swistack.user.id': '', // Will be set by caller
          'swistack.managed': 'true'
        }
      });

      await container.start();

      const containerInfo: ProjectContainer = {
        projectId: project.id,
        projectName: project.name,
        containerId: container.id,
        containerName,
        port: externalPort,
        internalPort,
        status: 'starting',
        lastStarted: new Date(),
        workspaceDir,
        resourceLimits: {
          memory: '512m',
          cpus: '0.5'
        }
      };

      // Wait for container to be ready
      setTimeout(() => {
        containerInfo.status = 'running';
        console.log(`✅ Container started for ${project.name} on port ${externalPort}`);
      }, 10000); // Give it 10 seconds to start

      return containerInfo;

    } catch (error) {
      console.error('Failed to spawn project container:', error);
      return null;
    }
  }

  /**
   * Get status of all running containers
   */
  getRunningContainers(): Array<{
    projectId: string;
    projectName: string;
    containerId: string;
    port: number;
    status: string;
    url: string;
    resourceLimits: object;
  }> {
    return Array.from(this.containers.values()).map(container => ({
      projectId: container.projectId,
      projectName: container.projectName,
      containerId: container.containerId,
      port: container.port,
      status: container.status,
      url: `http://localhost:${container.port}`,
      resourceLimits: container.resourceLimits
    }));
  }

  /**
   * Check if a container is running for a project
   */
  isContainerRunning(projectId: string): boolean {
    const container = this.containers.get(projectId);
    return container?.status === 'running' || false;
  }

  /**
   * Get container URL for a project
   */
  getContainerUrl(projectId: string): string | null {
    const container = this.containers.get(projectId);
    return container?.status === 'running' ? `http://localhost:${container.port}` : null;
  }

  /**
   * Stop all running containers (cleanup)
   */
  async stopAllContainers(): Promise<void> {
    const projectIds = Array.from(this.containers.keys());
    await Promise.all(projectIds.map(id => this.stopProjectContainer(id)));
  }

  /**
   * Get container statistics
   */
  async getContainerStats(projectId: string): Promise<any> {
    const container = this.containers.get(projectId);
    if (!container || container.status !== 'running') {
      return null;
    }

    try {
      const dockerContainer = this.docker.getContainer(container.containerId);
      const stats = await dockerContainer.stats({ stream: false });
      return {
        memory: stats.memory_stats,
        cpu: stats.cpu_stats,
        network: stats.networks
      };
    } catch (error) {
      console.error('Failed to get container stats:', error);
      return null;
    }
  }
}

export const containerManager = ContainerManager.getInstance();
