import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { LivePreviewService } from './LivePreviewService';
import { portAllocationManager } from './PortAllocationManager';

interface NixDevServer {
  projectId: string;
  projectName: string;
  port: number;
  process: ChildProcess | null;
  status: 'starting' | 'running' | 'stopped' | 'error' | 'installing';
  lastStarted: Date;
  repoDir: string;
  installProgress?: string;
}

export class NixDevServerManager {
  private static instance: NixDevServerManager;
  private servers: Map<string, NixDevServer> = new Map();
  private readonly workspaceBase = process.env.WORKSPACE_BASE_PATH || '/Applications/swistack_app';
  private logs: Map<string, string[]> = new Map();
  private readonly LOG_LIMIT = 1000;
  private installStatus: Map<string, { status: string; message: string; timestamp: Date }> = new Map();
  private installLocks: Map<string, Promise<void>> = new Map();

  public static getInstance(): NixDevServerManager {
    if (!NixDevServerManager.instance) {
      NixDevServerManager.instance = new NixDevServerManager();
    }
    return NixDevServerManager.instance;
  }

  /**
   * Prepare a project by writing files and installing dependencies
   * This can be called right after project creation
   */
  async prepareProject(projectId: string, userId: string): Promise<{ success: boolean; error?: string; }> {
    console.log(`[NixDevServerManager] Preparing project ${projectId}`);
    
    // Set initial install status
    this.installStatus.set(projectId, {
      status: 'preparing',
      message: 'Preparing project files...',
      timestamp: new Date()
    });
    
    try {
      const project = await LivePreviewService.getProjectForPreview(projectId, userId);
      if (!project) {
        console.log(`[NixDevServerManager] Project ${projectId} not found`);
        return { success: false, error: 'Project not found' };
      }

      const repoDir = path.join(this.workspaceBase, 'repositories', projectId);
      await fs.mkdir(repoDir, { recursive: true });

      // Materialize project files to repositories folder
      await this.writeProjectFiles(project, repoDir);

      // Get port from project database
      const { ProjectModel } = await import('../models/Project');
      const projectData = await ProjectModel.findById(projectId);
      const port = projectData?.frontendPort || project.ports?.frontend || 5200;

      // Ensure package.json dev script binds to allocated port
      await this.ensurePackageJson(project, repoDir, port);

      // Ensure flake.nix exists
      await this.ensureFlake(repoDir);

      // Ensure repoDir is an isolated Git repo
      await this.ensureGitRepo(repoDir);

      // Run npm install immediately
      console.log(`[NixDevServerManager] Running npm install for project ${projectId}`);
      await this.runNpmInstall(repoDir, projectId);

      console.log(`[NixDevServerManager] Project ${projectId} prepared successfully`);
      return { success: true };
    } catch (err) {
      console.error('[NixDevServerManager] Prepare error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  /**
   * Start a Next.js dev server using Nix in repositories/<projectId>
   */
  async start(projectId: string, userId: string): Promise<{ success: boolean; port?: number; url?: string; error?: string; }>{
    console.log(`[NixDevServerManager] Starting server for project ${projectId}`);
    try {
      const existing = this.servers.get(projectId);
      if (existing && existing.status === 'running') {
        console.log(`[NixDevServerManager] Server already running for ${projectId}`);
        return { success: true, port: existing.port, url: `http://localhost:${existing.port}` };
      }

      const project = await LivePreviewService.getProjectForPreview(projectId, userId);
      if (!project) {
        console.log(`[NixDevServerManager] Project ${projectId} not found`);
        return { success: false, error: 'Project not found' };
      }
      console.log(`[NixDevServerManager] Found project: ${project.name}`);

      // Get port from project database
      const { ProjectModel } = await import('../models/Project');
      const projectData = await ProjectModel.findById(projectId);
      const port = projectData?.frontendPort || project.ports?.frontend || 5200;
      console.log(`[NixDevServerManager] Using port ${port} for project ${project.name}`);
      
      if (!port) {
        console.log(`[NixDevServerManager] No port allocated for project ${projectId}`);
        return { success: false, error: 'Project does not have allocated ports' };
      }

      const repoDir = path.join(this.workspaceBase, 'repositories', projectId);
      
      // Check if project is already prepared (files exist)
      const packageJsonExists = await fs.access(path.join(repoDir, 'package.json')).then(() => true).catch(() => false);
      const nodeModulesExists = await fs.access(path.join(repoDir, 'node_modules')).then(() => true).catch(() => false);
      
      if (!packageJsonExists) {
        console.log(`[NixDevServerManager] Project not prepared, setting up files...`);
        await fs.mkdir(repoDir, { recursive: true });

        // Materialize project files to repositories folder (clone from DB)
        await this.writeProjectFiles(project, repoDir);

        // Ensure package.json dev script binds to allocated port
        await this.ensurePackageJson(project, repoDir, port);

        // Ensure flake.nix exists (minimal dev shell for Node 18)
        await this.ensureFlake(repoDir);

        // Ensure repoDir is an isolated Git repo so Nix flakes don't complain about untracked parent paths
        await this.ensureGitRepo(repoDir);
      }

      // Run npm install if node_modules doesn't exist
      if (!nodeModulesExists) {
        console.log(`[NixDevServerManager] Running npm install for project ${projectId}`);
        await this.runNpmInstall(repoDir, projectId);
      } else {
        console.log(`[NixDevServerManager] Dependencies already installed, skipping npm install`);
      }

      // Run nix develop (provision tools) and start dev server
      console.log(`[NixDevServerManager] About to spawn dev server for project ${projectId} on port ${port}`);
      const server = await this.spawnNixDev(project, repoDir, port);
      if (!server) {
        console.error(`[NixDevServerManager] spawnNixDev returned null for project ${projectId}`);
        return { success: false, error: 'Failed to start Nix dev server' };
      }
      console.log(`[NixDevServerManager] Dev server spawned successfully, status: ${server.status}`);
      this.servers.set(projectId, server);

      console.log(`[NixDevServerManager] Server started successfully on port ${port}`);
      return { success: true, port, url: `http://localhost:${port}` };
    } catch (err) {
      console.error('[NixDevServerManager] Start error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  isRunning(projectId: string): boolean {
    return this.servers.get(projectId)?.status === 'running' || false;
  }

  /** Get installation status for a project */
  getInstallStatus(projectId: string): { status: string; message: string; timestamp: Date } | null {
    return this.installStatus.get(projectId) || null;
  }

  getUrl(projectId: string): string | null {
    const s = this.servers.get(projectId);
    // Return URL if server is starting or running (port is already allocated)
    return (s?.status === 'running' || s?.status === 'starting') && s?.port 
      ? `http://localhost:${s.port}` 
      : null;
  }

  /** Get raw status for a project's Nix dev server */
  async getStatus(projectId: string): Promise<'starting' | 'running' | 'stopped' | 'error' | 'installing' | null> {
    const s = this.servers.get(projectId);
    
    // If not in memory, check if server is running externally
    if (!s || s.status === 'stopped') {
      try {
        // Get the project's allocated port from database
        const { ProjectModel } = await import('../models/Project');
        const project = await ProjectModel.findById(projectId);
        console.log(`[NixDevServerManager] Checking external server for ${projectId}, project:`, project ? 'found' : 'not found', 'port:', project?.frontendPort);
        
        // Try to get port from project or use default port allocation
        let port = project?.frontendPort;
        
        // If no port in database, check if the repository exists and has a known port
        if (!port) {
          const repoDir = path.join(this.workspaceBase, 'repositories', projectId);
          try {
            await fs.access(repoDir);
            // Repository exists, check package.json for port configuration
            const packageJsonPath = path.join(repoDir, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const devScript = packageJson?.scripts?.dev;
            if (devScript && devScript.includes('-p ')) {
              const portMatch = devScript.match(/-p\s+(\d+)/);
              if (portMatch) {
                port = parseInt(portMatch[1]);
                console.log(`[NixDevServerManager] Found port ${port} in package.json for ${projectId}`);
              }
            }
          } catch {
            // Repository doesn't exist or can't read package.json
          }
        }
        
        if (port) {
          // Check if something is listening on this port
          const { execSync } = require('child_process');
          try {
            const result = execSync(`lsof -i :${port} | grep LISTEN`, { encoding: 'utf8' });
            if (result && result.includes('node')) {
              // Server is running externally, register it
              this.servers.set(projectId, {
                projectId,
                projectName: project?.name || projectId,
                status: 'running',
                port,
                process: null,
                lastStarted: new Date(),
                repoDir: path.join(this.workspaceBase, 'repositories', projectId)
              });
              return 'running';
            }
          } catch {
            // No server on this port
          }
        }
      } catch (error) {
        console.error('[NixDevServerManager] Error checking external server:', error);
      }
    }
    
    return s?.status || null;
  }

  async stop(projectId: string): Promise<boolean> {
    const s = this.servers.get(projectId);
    if (!s) return false;
    try {
      s.process?.kill('SIGTERM');
      s.status = 'stopped';
      this.servers.delete(projectId);
      this.appendLog(projectId, '⏹️ Nix dev server stopped');
      return true;
    } catch (e) {
      console.error('[NixDev] Stop error:', e);
      return false;
    }
  }

  async stopAll(): Promise<void> {
    const ids = Array.from(this.servers.keys());
    for (const id of ids) {
      try { await this.stop(id); } catch (e) { console.warn('[NixDev] stopAll warn:', e); }
    }
  }

  private async writeProjectFiles(project: any, repoDir: string) {
    for (const file of project.files) {
      const dest = path.join(repoDir, file.path);
      if (file.type === 'directory') {
        await fs.mkdir(dest, { recursive: true });
      } else {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, file.content || '', 'utf8');
      }
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

  public clearLogs(projectId: string): void {
    this.logs.set(projectId, []);
    this.appendLog(projectId, '🗑️ Logs cleared');
  }

  private async ensurePackageJson(project: any, repoDir: string, port: number) {
    const pkgPath = path.join(repoDir, 'package.json');
    let pkg: any = { name: project.name.toLowerCase().replace(/\s+/g, '-'), version: '1.0.0', scripts: {} };
    try { pkg = { ...pkg, ...JSON.parse(await fs.readFile(pkgPath, 'utf8')) }; } catch {}
    
    // Use the provided port directly
    const devScript = pkg.scripts?.dev || '';
    if (!/next\s+dev/.test(devScript)) {
      pkg.scripts = { ...pkg.scripts, dev: `next dev -p ${port}` };
    }
    
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  }

  private async ensureFlake(repoDir: string) {
    const flakePath = path.join(repoDir, 'flake.nix');
    try { await fs.access(flakePath); return; } catch {}
    const flake = `{
  description = "Next.js dev shell";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };
  
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [ pkgs.nodejs_20 pkgs.git pkgs.bashInteractive pkgs.watchman ];
          shellHook = ''
            echo "Node.js development environment ready"
          '';
        };
      });
}
`;
    await fs.writeFile(flakePath, flake, 'utf8');
  }

  private async ensureGitRepo(repoDir: string) {
    try {
      // If already a git repo, return
      const gitDir = path.join(repoDir, '.git');
      try { await fs.access(gitDir); return; } catch {}
      const { spawn } = await import('child_process');
      const env = { ...process.env, GIT_AUTHOR_NAME: 'swistack', GIT_AUTHOR_EMAIL: 'swistack@example.local', GIT_COMMITTER_NAME: 'swistack', GIT_COMMITTER_EMAIL: 'swistack@example.local' };
      await new Promise<void>((resolve) => {
        const init = spawn('git', ['init'], { cwd: repoDir, stdio: 'pipe', env });
        init.on('close', () => resolve());
        init.on('error', () => resolve());
      });
      await new Promise<void>((resolve) => {
        const add = spawn('git', ['add', '-A'], { cwd: repoDir, stdio: 'pipe', env });
        add.on('close', () => resolve());
        add.on('error', () => resolve());
      });
      await new Promise<void>((resolve) => {
        const commit = spawn('git', ['commit', '-m', 'init flake for nix develop'], { cwd: repoDir, stdio: 'pipe', env });
        commit.on('close', () => resolve());
        commit.on('error', () => resolve());
      });
      this.appendLog(path.basename(repoDir), 'Initialized local Git repo for Nix flake');
    } catch (e) {
      console.warn('[NixDev] ensureGitRepo warning:', e);
    }
  }

  private async runNpmInstall(repoDir: string, projectId?: string): Promise<void> {
    // Check if there's already an install running for this project
    if (projectId && this.installLocks.has(projectId)) {
      console.log(`[NixDevServerManager] Waiting for existing npm install to complete for project ${projectId}`);
      if (projectId) {
        this.installStatus.set(projectId, {
          status: 'waiting',
          message: 'Waiting for another install process to complete...',
          timestamp: new Date()
        });
      }
      await this.installLocks.get(projectId);
      return;
    }

    // Create the install promise and store it in the lock map
    const installPromise = new Promise<void>((resolve, reject) => {
      console.log(`[NixDevServerManager] Installing dependencies in ${repoDir}`);
      
      // Update status to installing
      if (projectId) {
        this.installStatus.set(projectId, {
          status: 'installing',
          message: 'Installing dependencies with npm install...',
          timestamp: new Date()
        });
      }
      
      const nixEnv = { ...process.env, NIX_CONFIG: `${process.env.NIX_CONFIG || ''}\nexperimental-features = nix-command flakes`.trim() };
      
      const installProcess = spawn('nix', [
        '--extra-experimental-features', 'nix-command flakes',
        'develop', '-c',
        'bash', '-c',
        'npm install'
      ], { cwd: repoDir, stdio: 'pipe', env: nixEnv });

      installProcess.stdout?.on('data', (d) => {
        const msg = d.toString().trim();
        console.log(`[npm install] ${msg}`);
        
        // Update status with progress
        if (projectId) {
          if (msg.includes('added') && msg.includes('packages')) {
            this.installStatus.set(projectId, {
              status: 'installing',
              message: msg,
              timestamp: new Date()
            });
          } else if (msg.includes('npm install')) {
            this.installStatus.set(projectId, {
              status: 'installing',
              message: 'Running npm install...',
              timestamp: new Date()
            });
          }
        }
      });

      installProcess.stderr?.on('data', (d) => {
        const msg = d.toString().trim();
        if (!msg.includes('warning') && !msg.includes('deprecated')) {
          console.error(`[npm install] ${msg}`);
        }
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`[NixDevServerManager] npm install completed successfully`);
          if (projectId) {
            this.installStatus.set(projectId, {
              status: 'completed',
              message: 'Dependencies installed successfully!',
              timestamp: new Date()
            });
          }
          resolve();
        } else {
          console.error(`[NixDevServerManager] npm install failed with code ${code}`);
          if (projectId) {
            this.installStatus.set(projectId, {
              status: 'error',
              message: `npm install failed with code ${code}`,
              timestamp: new Date()
            });
          }
          // Don't reject, allow server to continue
          resolve();
        }
      });

      installProcess.on('error', (err) => {
        console.error(`[NixDevServerManager] npm install error:`, err);
        // Don't reject, allow server to continue
        resolve();
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        console.log(`[NixDevServerManager] npm install timeout, continuing...`);
        installProcess.kill();
        resolve();
      }, 300000);
    });

    // Store the promise in the lock map
    if (projectId) {
      this.installLocks.set(projectId, installPromise);
    }

    // Wait for the install to complete and clean up the lock
    try {
      await installPromise;
      
      // Commit the lock files to avoid "dirty" git warnings
      await this.commitLockFiles(repoDir);
    } finally {
      if (projectId) {
        this.installLocks.delete(projectId);
      }
    }
  }

  private async commitLockFiles(repoDir: string): Promise<void> {
    try {
      const { spawn } = await import('child_process');
      const env = { 
        ...process.env, 
        GIT_AUTHOR_NAME: 'swistack', 
        GIT_AUTHOR_EMAIL: 'swistack@example.local', 
        GIT_COMMITTER_NAME: 'swistack', 
        GIT_COMMITTER_EMAIL: 'swistack@example.local' 
      };
      
      // Add lock files if they exist
      await new Promise<void>((resolve) => {
        const add = spawn('git', ['add', 'package-lock.json', 'flake.lock'], { 
          cwd: repoDir, 
          stdio: 'pipe', 
          env 
        });
        add.on('close', () => resolve());
        add.on('error', () => resolve());
      });
      
      // Commit if there are changes
      await new Promise<void>((resolve) => {
        const commit = spawn('git', ['commit', '-m', 'Add lock files'], { 
          cwd: repoDir, 
          stdio: 'pipe', 
          env 
        });
        commit.on('close', () => resolve());
        commit.on('error', () => resolve());
      });
    } catch (e) {
      // Ignore errors - this is just to clean up the warning
      console.log('[NixDevServerManager] Could not commit lock files (non-critical):', e);
    }
  }

  private async checkPortAndUpdateStatus(server: NixDevServer, port: number): Promise<void> {
    // Periodically check if the port becomes available
    const checkInterval = setInterval(async () => {
      try {
        const http = await import('http');
        const isAvailable = await new Promise<boolean>((resolve) => {
          const req = http.get(`http://localhost:${port}`, { timeout: 1000 }, (res) => {
            resolve(true);
            res.resume();
          });
          req.on('timeout', () => { req.destroy(); resolve(false); });
          req.on('error', () => resolve(false));
        });
        
        if (isAvailable) {
          server.status = 'running';
          clearInterval(checkInterval);
          this.appendLog(server.projectId, `✅ Dev server is now accessible at http://localhost:${port}`);
        }
      } catch (e) {
        // Continue checking
      }
    }, 3000); // Check every 3 seconds
    
    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 300000);
  }

  private async spawnNixDev(project: any, repoDir: string, port: number): Promise<NixDevServer | null> {
    console.log(`[NixDevServerManager] spawnNixDev called for ${project.name} (${project.id}) on port ${port}`);
    return new Promise((resolve) => {
      const server: NixDevServer = {
        projectId: project.id,
        projectName: project.name,
        port,
        process: null,
        status: 'starting',
        lastStarted: new Date(),
        repoDir
      };

      // Skip separate provision step - directly run dev server in Nix shell
      console.log(`[NixDevServerManager] Starting dev server in Nix shell for ${project.id}`);
      const nixEnv = { ...process.env, NIX_CONFIG: `${process.env.NIX_CONFIG || ''}\nexperimental-features = nix-command flakes`.trim() };
      
      // Directly start dev server in Nix environment (npm install already done)
      const installAndRun = spawn('nix', [
        '--extra-experimental-features', 'nix-command flakes', 
        'develop', '-c', 
        'bash', '-c', 
        `PORT=${port} npm run dev`
      ], { cwd: repoDir, stdio: 'pipe', env: nixEnv });
      const dev = installAndRun;
      server.process = dev;

      let ready = false;
      dev.stdout?.on('data', (d) => {
        const s = d.toString();
        this.appendLog(project.id, s.trim());
        
        if (!ready && (s.includes(`http://localhost:${port}`) || s.toLowerCase().includes('ready'))) {
          ready = true;
          server.status = 'running';
          resolve(server);
        }
      });
      dev.stderr?.on('data', (d) => { 
        const m = d.toString().trim(); 
        console.error('[NixDev stderr]', m); 
        this.appendLog(project.id, `[stderr] ${m}`);
        
        // Check for common error patterns
        if (m.includes('EADDRINUSE')) {
          console.error(`[NixDevServerManager] Port ${port} is already in use`);
          server.status = 'error';
          if (!ready) resolve(null);
        } else if (m.includes('npm ERR!')) {
          console.error(`[NixDevServerManager] npm error detected: ${m}`);
          server.status = 'error';
        }
      });
      dev.on('error', (e) => { 
        console.error('[NixDev] spawn error', e); 
        server.status = 'error';
        if (!ready) resolve(null); 
      });
      dev.on('exit', (code, signal) => {
        console.log(`[NixDevServerManager] Dev server exited with code ${code}, signal ${signal}`);
        server.status = 'stopped';
        if (!ready && code !== 0) {
          resolve(null);
        }
      });
      setTimeout(() => { 
        if (!ready) { 
          console.log(`[NixDevServerManager] Server didn't report ready after 60s, checking port accessibility...`);
          // Server is taking time to start, but mark it as running if port is accessible
          server.status = 'starting';
          this.checkPortAndUpdateStatus(server, port);
          resolve(server);
        } 
      }, 60000); // Wait 60 seconds for server to start
    });
  }
}

export const nixDevServerManager = NixDevServerManager.getInstance();
