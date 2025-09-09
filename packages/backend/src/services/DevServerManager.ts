import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { LivePreviewService, PreviewableProject } from './LivePreviewService';
import { portAllocationManager } from './PortAllocationManager';

interface DevServer {
  projectId: string;
  projectName: string;
  port: number;
  process: ChildProcess | null;
  status: 'starting' | 'running' | 'stopped' | 'error';
  lastStarted: Date;
  workspaceDir: string;
}

export class DevServerManager {
  private static instance: DevServerManager;
  private servers: Map<string, DevServer> = new Map();
  private readonly workspaceRoot = '/tmp/swistack-dev-servers';
  private logs: Map<string, string[]> = new Map();
  private readonly LOG_LIMIT = 1000;

  public static getInstance(): DevServerManager {
    if (!DevServerManager.instance) {
      DevServerManager.instance = new DevServerManager();
    }
    return DevServerManager.instance;
  }

  private constructor() {
    this.ensureWorkspaceDir();
  }

  private async ensureWorkspaceDir() {
    try {
      await fs.mkdir(this.workspaceRoot, { recursive: true });
    } catch (error) {
      console.error('Failed to create workspace directory:', error);
    }
  }

  private appendLog(projectId: string, line: string) {
    const ts = new Date().toISOString();
    const entry = `[${ts}] ${line}`;
    const arr = this.logs.get(projectId) || [];
    arr.push(entry);
    if (arr.length > this.LOG_LIMIT) arr.splice(0, arr.length - this.LOG_LIMIT);
    this.logs.set(projectId, arr);
  }

  public getLogs(projectId: string): string[] {
    return this.logs.get(projectId) || [];
  }

  /**
   * Start a development server for a project
   */
  async startDevServer(projectId: string, userId: string): Promise<{
    success: boolean;
    port?: number;
    url?: string;
    error?: string;
  }> {
    try {
      // Check if server is already running
      const existing = this.servers.get(projectId);
      if (existing && existing.status === 'running') {
        return {
          success: true,
          port: existing.port,
          url: `http://localhost:${existing.port}`
        };
      }

      // Get project data
      const project = await LivePreviewService.getProjectForPreview(projectId, userId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Create workspace directory for this project
      const workspaceDir = path.join(this.workspaceRoot, projectId);
      await fs.mkdir(workspaceDir, { recursive: true });

      // Write project files to workspace
      await this.writeProjectFiles(project, workspaceDir);

      // Generate package.json with correct port
      await this.generatePackageJson(project, workspaceDir);

      // Start the development server
      this.appendLog(project.id, `Starting dev server for ${project.name} on port ${project.ports.frontend}`);
      const devServer = await this.spawnDevServer(project, workspaceDir);
      
      if (!devServer) {
        return { success: false, error: 'Failed to start development server' };
      }

      // Store server info
      this.servers.set(projectId, devServer);

      return {
        success: true,
        port: devServer.port,
        url: `http://localhost:${devServer.port}`
      };

    } catch (error) {
      console.error('Error starting dev server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Stop a development server
   */
  async stopDevServer(projectId: string): Promise<boolean> {
    const server = this.servers.get(projectId);
    if (!server) {
      return false;
    }

    if (server.process) {
      server.process.kill('SIGTERM');
      server.process = null;
    }

    server.status = 'stopped';
    this.appendLog(projectId, '⏹️ Dev server stopped');
    
    // Clean up workspace directory
    try {
      await fs.rm(server.workspaceDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up workspace:', error);
    }

    this.servers.delete(projectId);
    return true;
  }

  /**
   * Get status of all running servers
   */
  getRunningServers(): Array<{
    projectId: string;
    projectName: string;
    port: number;
    status: string;
    url: string;
  }> {
    return Array.from(this.servers.values()).map(server => ({
      projectId: server.projectId,
      projectName: server.projectName,
      port: server.port,
      status: server.status,
      url: `http://localhost:${server.port}`
    }));
  }

  /**
   * Check if a server is running for a project
   */
  isServerRunning(projectId: string): boolean {
    const server = this.servers.get(projectId);
    return server?.status === 'running' || false;
  }

  /**
   * Get raw status for a project's dev server
   */
  getStatus(projectId: string): 'starting' | 'running' | 'stopped' | 'error' | null {
    const server = this.servers.get(projectId);
    return server?.status || null;
  }

  /**
   * Get server URL for a project
   */
  getServerUrl(projectId: string): string | null {
    const server = this.servers.get(projectId);
    return server?.status === 'running' ? `http://localhost:${server.port}` : null;
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
   * Generate package.json with correct port configuration
   */
  private async generatePackageJson(project: PreviewableProject, workspaceDir: string) {
    const packageJsonPath = path.join(workspaceDir, 'package.json');
    
    // Check if package.json already exists from project files
    let packageJson: any = {
      name: project.name.toLowerCase().replace(/\s+/g, '-'),
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
    const isNextJs = project.template.includes('next') || 
                    project.files.some(f => (
                      f.path === 'next.config.js' ||
                      f.path === 'src/app/page.tsx' ||
                      f.path === 'app/page.tsx' ||
                      f.path === 'src/pages/index.tsx' ||
                      f.path === 'pages/index.tsx'
                    ));
    
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
        'dev': `next dev -p ${project.ports.frontend}`,
        'build': 'next build',
        'start': `next start -p ${project.ports.frontend}`
      };
    } else {
      // Default to simple HTTP server
      packageJson.scripts = {
        ...packageJson.scripts,
        'dev': `npx serve -s . -p ${project.ports.frontend}`,
        'start': `npx serve -s . -p ${project.ports.frontend}`
      };
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
  }

  /**
   * Spawn the development server process
   */
  private async spawnDevServer(project: PreviewableProject, workspaceDir: string): Promise<DevServer | null> {
    return new Promise((resolve) => {
      const server: DevServer = {
        projectId: project.id,
        projectName: project.name,
        port: project.ports.frontend,
        process: null,
        status: 'starting',
        lastStarted: new Date(),
        workspaceDir
      };

      // Try to install dependencies first (in background)
      const installProcess = spawn('npm', ['install'], {
        cwd: workspaceDir,
        stdio: 'pipe'
      });
      installProcess.stdout?.on('data', d => this.appendLog(project.id, `[npm install] ${d.toString().trim()}`));
      installProcess.stderr?.on('data', d => this.appendLog(project.id, `[npm install] ${d.toString().trim()}`));

      installProcess.on('close', (code) => {
        // Start dev server after install (or even if install fails)
        const devProcess = spawn('npm', ['run', 'dev'], {
          cwd: workspaceDir,
          stdio: 'pipe',
          env: { ...process.env, PORT: project.ports.frontend.toString() }
        });

        server.process = devProcess;

        let serverReady = false;

        devProcess.stdout?.on('data', (data) => {
          const output = data.toString();
          console.log(`[DevServer:${project.ports.frontend}]`, output.trim());
          this.appendLog(project.id, output.trim());
          
          // Check for server ready indicators
          if (!serverReady && (
            output.includes('Ready in') || 
            output.includes('started server on') ||
            output.includes(`http://localhost:${project.ports.frontend}`)
          )) {
            serverReady = true;
            server.status = 'running';
            console.log(`✅ Dev server started for ${project.name} on port ${project.ports.frontend}`);
            resolve(server);
          }
        });

        devProcess.stderr?.on('data', (data) => {
          const error = data.toString();
          console.error(`[DevServer:${project.ports.frontend}] Error:`, error.trim());
          this.appendLog(project.id, `[stderr] ${error.trim()}`);
        });

        devProcess.on('close', (code) => {
          console.log(`Dev server for ${project.name} exited with code ${code}`);
          server.status = 'stopped';
          server.process = null;
        });

        devProcess.on('error', (error) => {
          console.error(`Failed to start dev server for ${project.name}:`, error);
          server.status = 'error';
          this.appendLog(project.id, `❌ Failed to start dev server: ${error.message}`);
          if (!serverReady) {
            resolve(null);
          }
        });

        // Timeout if server doesn't start within 30 seconds
        setTimeout(() => {
          if (!serverReady) {
            console.log(`⚠️ Dev server for ${project.name} taking longer than expected...`);
            // Keep status as 'starting' until reachability is confirmed by status route
            resolve(server);
          }
        }, 30000);
      });

      installProcess.on('error', (error) => {
        console.log(`npm install failed for ${project.name}, trying to start anyway:`, error.message);
        // Continue with dev server start even if install fails
      });
    });
  }

  /**
   * Stop all running servers (cleanup)
   */
  async stopAllServers(): Promise<void> {
    const projectIds = Array.from(this.servers.keys());
    await Promise.all(projectIds.map(id => this.stopDevServer(id)));
  }
}

export const devServerManager = DevServerManager.getInstance();
