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
  status: 'starting' | 'running' | 'stopped' | 'error';
  lastStarted: Date;
  repoDir: string;
}

export class NixDevServerManager {
  private static instance: NixDevServerManager;
  private servers: Map<string, NixDevServer> = new Map();
  private readonly workspaceBase = process.env.WORKSPACE_BASE_PATH || '/Applications/swistack_app';
  private logs: Map<string, string[]> = new Map();
  private readonly LOG_LIMIT = 1000;

  public static getInstance(): NixDevServerManager {
    if (!NixDevServerManager.instance) {
      NixDevServerManager.instance = new NixDevServerManager();
    }
    return NixDevServerManager.instance;
  }

  /**
   * Start a Next.js dev server using Nix in repositories/<projectId>
   */
  async start(projectId: string, userId: string): Promise<{ success: boolean; port?: number; url?: string; error?: string; }>{
    try {
      const existing = this.servers.get(projectId);
      if (existing && existing.status === 'running') {
        return { success: true, port: existing.port, url: `http://localhost:${existing.port}` };
      }

      const project = await LivePreviewService.getProjectForPreview(projectId, userId);
      if (!project) return { success: false, error: 'Project not found' };

      const repoDir = path.join(this.workspaceBase, 'repositories', projectId);
      await fs.mkdir(repoDir, { recursive: true });

      // Materialize project files to repositories folder (clone from DB)
      await this.writeProjectFiles(project, repoDir);

      // Ensure package.json dev script binds to allocated port
      await this.ensurePackageJson(project, repoDir);

      // Ensure flake.nix exists (minimal dev shell for Node 18)
      await this.ensureFlake(repoDir);

      // Ensure repoDir is an isolated Git repo so Nix flakes don't complain about untracked parent paths
      await this.ensureGitRepo(repoDir);

      // Run nix develop (provision tools) and start dev server
      const port = project.ports.frontend;
      const server = await this.spawnNixDev(project, repoDir, port);
      if (!server) return { success: false, error: 'Failed to start Nix dev server' };
      this.servers.set(projectId, server);

      return { success: true, port, url: `http://localhost:${port}` };
    } catch (err) {
      console.error('[NixDev] Start error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  isRunning(projectId: string): boolean {
    return this.servers.get(projectId)?.status === 'running' || false;
  }

  getUrl(projectId: string): string | null {
    const s = this.servers.get(projectId);
    return s?.status === 'running' ? `http://localhost:${s.port}` : null;
  }

  /** Get raw status for a project's Nix dev server */
  getStatus(projectId: string): 'starting' | 'running' | 'stopped' | 'error' | null {
    const s = this.servers.get(projectId);
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

  private async ensurePackageJson(project: any, repoDir: string) {
    const pkgPath = path.join(repoDir, 'package.json');
    let pkg: any = { name: project.name.toLowerCase().replace(/\s+/g, '-'), version: '1.0.0', scripts: {} };
    try { pkg = { ...pkg, ...JSON.parse(await fs.readFile(pkgPath, 'utf8')) }; } catch {}
    const alloc = portAllocationManager.getProjectAllocation(project.id);
    if (alloc) {
      // Prefer script that respects PORT env; fallback to explicit port
      const devScript = pkg.scripts?.dev || '';
      if (!/next\s+dev/.test(devScript)) {
        pkg.scripts = { ...pkg.scripts, dev: `next dev -p ${alloc.frontendPort}` };
      }
    }
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  }

  private async ensureFlake(repoDir: string) {
    const flakePath = path.join(repoDir, 'flake.nix');
    try { await fs.access(flakePath); return; } catch {}
    const flake = `{
  description = "Next.js dev shell";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs";
  outputs = { self, nixpkgs }: let
    system = builtins.currentSystem;
    pkgs = import nixpkgs { inherit system; };
  in {
    devShells.${'${system}'} = {
      default = pkgs.mkShell {
        buildInputs = [ pkgs.nodejs_18 pkgs.git pkgs.bashInteractive pkgs.watchman ];
        shellHook = ''
          corepack enable || true
        '';
      };
    };
  };
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

  private async spawnNixDev(project: any, repoDir: string, port: number): Promise<NixDevServer | null> {
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

      // Provision env first
      const nixEnv = { ...process.env, NIX_CONFIG: `${process.env.NIX_CONFIG || ''}\nexperimental-features = nix-command flakes`.trim() };
      const provision = spawn('nix', ['--extra-experimental-features', 'nix-command flakes', 'develop'], { cwd: repoDir, stdio: 'pipe', env: nixEnv });
      provision.stdout?.on('data', d => this.appendLog(project.id, `[nix develop] ${d.toString().trim()}`));
      provision.stderr?.on('data', d => this.appendLog(project.id, `[nix develop] ${d.toString().trim()}`));
      provision.on('close', () => {
        const cmd = process.platform === 'darwin' ? 'bash' : 'bash';
        const args = ['-lc', `PORT=${port} npm run dev`];
        const dev = spawn('nix', ['--extra-experimental-features', 'nix-command flakes', 'develop', '-c', cmd, ...args], { cwd: repoDir, stdio: 'pipe', env: nixEnv });
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
        dev.stderr?.on('data', (d) => { const m = d.toString().trim(); console.error('[NixDev]', m); this.appendLog(project.id, `[stderr] ${m}`); });
        dev.on('error', (e) => { console.error('[NixDev] spawn error', e); if (!ready) resolve(null); });
        setTimeout(() => { if (!ready) { /* still starting; reachability checked elsewhere */ resolve(server);} }, 40000);
      });
      provision.on('error', (e) => { console.error('[NixDev] provision error', e); resolve(null); });
    });
  }
}

export const nixDevServerManager = NixDevServerManager.getInstance();
