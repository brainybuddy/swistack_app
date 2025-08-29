import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';

interface TerminalSession {
  id: string;
  projectId: string;
  userId: string;
  cwd: string;
  process?: ChildProcess;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

interface TerminalOutput {
  type: 'stdout' | 'stderr' | 'command' | 'system';
  content: string;
  timestamp: Date;
}

class TerminalService extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private readonly allowedCommands = [
    'ls', 'pwd', 'cd', 'cat', 'echo', 'mkdir', 'rmdir',
    'npm', 'node', 'git', 'clear', 'help', 'whoami',
    'grep', 'find', 'head', 'tail', 'wc', 'sort',
    'curl', 'wget'
  ];

  constructor() {
    super();
    // Clean up inactive sessions every 30 minutes
    setInterval(() => this.cleanupInactiveSessions(), 30 * 60 * 1000);
  }

  createSession(projectId: string, userId: string): string {
    const sessionId = `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    
    // Ensure project directory exists
    try {
      require('fs').mkdirSync(projectPath, { recursive: true });
    } catch (error) {
      console.warn(`Could not create project directory ${projectPath}:`, error);
    }
    
    const session: TerminalSession = {
      id: sessionId,
      projectId,
      userId,
      cwd: projectPath,
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    console.log(`Created terminal session ${sessionId} for user ${userId} in project ${projectId}`);
    
    return sessionId;
  }

  async executeCommand(sessionId: string, command: string): Promise<TerminalOutput[]> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      throw new Error('Terminal session not found or inactive');
    }

    session.lastActivity = new Date();
    const outputs: TerminalOutput[] = [];

    // Add command to output
    outputs.push({
      type: 'command',
      content: `${session.cwd}$ ${command}`,
      timestamp: new Date()
    });

    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      return outputs;
    }

    // Handle built-in commands
    if (trimmedCommand === 'clear') {
      outputs.push({
        type: 'system',
        content: 'CLEAR_SCREEN',
        timestamp: new Date()
      });
      return outputs;
    }

    if (trimmedCommand === 'help') {
      outputs.push({
        type: 'stdout',
        content: `Available commands:
  ls, pwd, cd, cat, echo, mkdir, rmdir
  npm, node, git, clear, help, whoami
  grep, find, head, tail, wc, sort
  curl, wget

Note: Commands are executed in a sandboxed environment.
Some commands may be restricted for security.`,
        timestamp: new Date()
      });
      return outputs;
    }

    // Handle cd command specially
    if (trimmedCommand.startsWith('cd ')) {
      return this.handleCdCommand(session, trimmedCommand, outputs);
    }

    // Validate command
    const commandParts = trimmedCommand.split(' ');
    const baseCommand = commandParts[0];

    if (!this.allowedCommands.includes(baseCommand)) {
      outputs.push({
        type: 'stderr',
        content: `Command '${baseCommand}' is not allowed or not found`,
        timestamp: new Date()
      });
      return outputs;
    }

    // Execute command
    try {
      const result = await this.runCommand(session, trimmedCommand);
      outputs.push(...result);
    } catch (error) {
      outputs.push({
        type: 'stderr',
        content: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      });
    }

    return outputs;
  }

  private handleCdCommand(session: TerminalSession, command: string, outputs: TerminalOutput[]): TerminalOutput[] {
    const targetPath = command.substring(3).trim();
    let newCwd: string;

    if (!targetPath || targetPath === '~') {
      // Go to project root
      newCwd = path.join(process.cwd(), 'projects', session.projectId);
    } else if (targetPath.startsWith('/')) {
      // Absolute path - restrict to project directory
      const projectRoot = path.join(process.cwd(), 'projects', session.projectId);
      newCwd = path.resolve(projectRoot, targetPath.substring(1));
      
      // Ensure we don't escape the project directory
      if (!newCwd.startsWith(projectRoot)) {
        outputs.push({
          type: 'stderr',
          content: 'Permission denied: Cannot access outside project directory',
          timestamp: new Date()
        });
        return outputs;
      }
    } else {
      // Relative path
      newCwd = path.resolve(session.cwd, targetPath);
      
      // Ensure we don't escape the project directory
      const projectRoot = path.join(process.cwd(), 'projects', session.projectId);
      if (!newCwd.startsWith(projectRoot)) {
        outputs.push({
          type: 'stderr',
          content: 'Permission denied: Cannot access outside project directory',
          timestamp: new Date()
        });
        return outputs;
      }
    }

    // Update session cwd
    session.cwd = newCwd;
    this.sessions.set(session.id, session);

    return outputs;
  }

  private runCommand(session: TerminalSession, command: string): Promise<TerminalOutput[]> {
    return new Promise((resolve, reject) => {
      const outputs: TerminalOutput[] = [];
      
      // Determine the appropriate shell based on OS with fallbacks
      let shell: string;
      let shellArgs: string[];
      
      if (process.platform === 'win32') {
        shell = 'cmd.exe';
        shellArgs = ['/c', command];
      } else {
        // Try bash first, fall back to sh if not available
        shell = '/bin/bash';
        shellArgs = ['-c', command];
        
        // Check if bash exists, fallback to sh
        try {
          require('fs').accessSync('/bin/bash');
        } catch {
          try {
            require('fs').accessSync('/bin/sh');
            shell = '/bin/sh';
          } catch {
            // Last resort: use zsh (common on macOS)
            shell = '/bin/zsh';
          }
        }
      }
      
      console.log(`Executing command: ${command} in ${session.cwd} using shell: ${shell}`);
      
      const child = spawn(shell, shellArgs, {
        cwd: session.cwd,
        timeout: 30000, // 30 second timeout
        env: {
          ...process.env,
          HOME: session.cwd,
          PWD: session.cwd,
          PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin'
        }
      });

      child.stdout?.on('data', (data) => {
        outputs.push({
          type: 'stdout',
          content: data.toString(),
          timestamp: new Date()
        });
      });

      child.stderr?.on('data', (data) => {
        outputs.push({
          type: 'stderr',
          content: data.toString(),
          timestamp: new Date()
        });
      });

      child.on('close', (code) => {
        // Some commands like 'npm', 'git', 'help' exit with non-zero codes but aren't errors
        const informationalCommands = ['npm', 'git', 'help', '--help', '-h'];
        const isInformationalCommand = informationalCommands.some(cmd => command.trim().startsWith(cmd));
        
        if (code !== 0 && code !== null && !isInformationalCommand) {
          outputs.push({
            type: 'stderr',
            content: `Command exited with code ${code}`,
            timestamp: new Date()
          });
        }
        resolve(outputs);
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Store process reference for potential termination
      session.process = child;
      this.sessions.set(session.id, session);
    });
  }

  terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    if (session.process) {
      session.process.kill('SIGTERM');
    }

    session.isActive = false;
    this.sessions.delete(sessionId);
    console.log(`Terminated terminal session ${sessionId}`);
    
    return true;
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  getUserSessions(userId: string): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(session => 
      session.userId === userId && session.isActive
    );
  }

  private cleanupInactiveSessions(): void {
    const now = new Date();
    const maxInactiveTime = 60 * 60 * 1000; // 1 hour

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > maxInactiveTime) {
        console.log(`Cleaning up inactive terminal session ${sessionId}`);
        this.terminateSession(sessionId);
      }
    }
  }
}

export default new TerminalService();