import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { EnhancedFileOperations } from './EnhancedFileOperations';

const execAsync = promisify(exec);

export class SwiStackMcpToolsServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "swistack-tools",
      version: "1.0.0"
    });
    this.setupTools();
  }

  private setupTools(): void {
    // Register file read tool  
    this.server.registerTool("read_file", {
      description: "Read the contents of a file",
      inputSchema: z.object({
        path: z.string().describe("Path to the file to read")
      }) as any
    }, async (args: { path: string }) => {
      const content = await this.readFile(args.path);
      return {
        content: [{ type: "text" as const, text: content }]
      } as any;
    });

    // Register file write tool
    this.server.registerTool("write_file", {
      description: "Write content to a file",
      inputSchema: z.object({
        path: z.string().describe("Path to the file to write"),
        content: z.string().describe("Content to write"),
        projectId: z.string().describe("Project ID"),
        userId: z.string().describe("User ID"),
        force: z.boolean().optional().describe("Force overwrite existing file"),
        backupBeforeWrite: z.boolean().optional().describe("Create backup before writing"),
        dryRun: z.boolean().optional().describe("Perform dry run without actual write")
      }) as any
    }, async (args: { path: string; content: string; projectId: string; userId: string; force?: boolean; backupBeforeWrite?: boolean; dryRun?: boolean }) => {
      const enhancedOps = new EnhancedFileOperations();
      const result = await enhancedOps.writeFile(args.path, args.content, {
        projectId: args.projectId,
        userId: args.userId,
        force: args.force,
        backupBeforeWrite: args.backupBeforeWrite,
        dryRun: args.dryRun
      });
      
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(result, null, 2)
        }]
      } as any;
    });

    // Register directory list tool
    this.server.registerTool("list_files", {
      description: "List files in a directory",
      inputSchema: z.object({
        directory: z.string().describe("Directory path to list")
      }) as any
    }, async (args: { directory: string }) => {
      const files = await this.listFiles(args.directory);
      return {
        content: [{ type: "text" as const, text: files.join('\n') }]
      } as any;
    });

    // Register command execution tool
    this.server.registerTool("execute_command", {
      description: "Execute a shell command",
      inputSchema: z.object({
        command: z.string().describe("Command to execute")
      }) as any
    }, async (args: { command: string }) => {
      const result = await this.executeCommand(args.command);
      return {
        content: [{ 
          type: "text" as const, 
          text: `stdout: ${result.stdout}\nstderr: ${result.stderr}` 
        }]
      } as any;
    });

    // Register git status tool
    this.server.registerTool("git_status", {
      description: "Get git status of the current project",
      inputSchema: z.object({}) as any
    }, async () => {
      const status = await this.gitStatus();
      return {
        content: [{ type: "text" as const, text: status }]
      } as any;
    });

    // Register enhanced file creation tool
    this.server.registerTool("create_file", {
      description: "Create a new file with validation and safety checks (fails if file exists)",
      inputSchema: z.object({
        path: z.string().describe("File path to create"),
        content: z.string().describe("Content for the new file"),
        projectId: z.string().describe("Project ID"),
        userId: z.string().describe("User ID"),
        backupBeforeWrite: z.boolean().optional().describe("Create backup if file exists"),
        dryRun: z.boolean().optional().describe("Perform dry run without actual creation")
      }) as any
    }, async (args: { path: string; content: string; projectId: string; userId: string; backupBeforeWrite?: boolean; dryRun?: boolean }) => {
      const enhancedOps = new EnhancedFileOperations();
      const result = await enhancedOps.createFile(args.path, args.content, {
        projectId: args.projectId,
        userId: args.userId,
        backupBeforeWrite: args.backupBeforeWrite,
        dryRun: args.dryRun
      });
      
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(result, null, 2)
        }]
      } as any;
    });

    // Register enhanced file update tool
    this.server.registerTool("update_file", {
      description: "Update an existing file with validation and safety checks",
      inputSchema: z.object({
        path: z.string().describe("File path to update"),
        content: z.string().describe("New content for the file"),
        projectId: z.string().describe("Project ID"),
        userId: z.string().describe("User ID"),
        force: z.boolean().optional().describe("Force update even if validations fail"),
        backupBeforeWrite: z.boolean().optional().describe("Create backup before updating"),
        dryRun: z.boolean().optional().describe("Perform dry run without actual update")
      }) as any
    }, async (args: { path: string; content: string; projectId: string; userId: string; force?: boolean; backupBeforeWrite?: boolean; dryRun?: boolean }) => {
      const enhancedOps = new EnhancedFileOperations();
      const result = await enhancedOps.updateFile(args.path, args.content, {
        projectId: args.projectId,
        userId: args.userId,
        force: args.force,
        backupBeforeWrite: args.backupBeforeWrite,
        dryRun: args.dryRun
      });
      
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(result, null, 2)
        }]
      } as any;
    });

    // Register enhanced file deletion tool
    this.server.registerTool("delete_file", {
      description: "Delete a file with validation and safety checks",
      inputSchema: z.object({
        path: z.string().describe("File path to delete"),
        projectId: z.string().describe("Project ID"),
        userId: z.string().describe("User ID"),
        force: z.boolean().optional().describe("Force deletion without confirmation"),
        backupBeforeWrite: z.boolean().optional().describe("Create backup before deletion"),
        dryRun: z.boolean().optional().describe("Perform dry run without actual deletion")
      }) as any
    }, async (args: { path: string; projectId: string; userId: string; force?: boolean; backupBeforeWrite?: boolean; dryRun?: boolean }) => {
      const enhancedOps = new EnhancedFileOperations();
      const result = await enhancedOps.deleteFile(args.path, {
        projectId: args.projectId,
        userId: args.userId,
        force: args.force,
        backupBeforeWrite: args.backupBeforeWrite,
        dryRun: args.dryRun
      });
      
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(result, null, 2)
        }]
      } as any;
    });

    // Register directory creation tool
    this.server.registerTool("create_directory", {
      description: "Create a directory with validation",
      inputSchema: z.object({
        path: z.string().describe("Directory path to create"),
        projectId: z.string().describe("Project ID"),
        userId: z.string().describe("User ID"),
        dryRun: z.boolean().optional().describe("Perform dry run without actual creation")
      }) as any
    }, async (args: { path: string; projectId: string; userId: string; dryRun?: boolean }) => {
      const enhancedOps = new EnhancedFileOperations();
      const result = await enhancedOps.createDirectory(args.path, {
        projectId: args.projectId,
        userId: args.userId,
        dryRun: args.dryRun
      });
      
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(result, null, 2)
        }]
      } as any;
    });

    // Register file move/rename tool
    this.server.registerTool("move_file", {
      description: "Move or rename a file with validation and safety checks",
      inputSchema: z.object({
        sourcePath: z.string().describe("Current file path"),
        destinationPath: z.string().describe("New file path"),
        projectId: z.string().describe("Project ID"),
        userId: z.string().describe("User ID"),
        force: z.boolean().optional().describe("Force move even if destination exists"),
        dryRun: z.boolean().optional().describe("Perform dry run without actual move")
      }) as any
    }, async (args: { sourcePath: string; destinationPath: string; projectId: string; userId: string; force?: boolean; dryRun?: boolean }) => {
      const enhancedOps = new EnhancedFileOperations();
      const result = await enhancedOps.moveFile(args.sourcePath, args.destinationPath, {
        projectId: args.projectId,
        userId: args.userId,
        force: args.force,
        dryRun: args.dryRun
      });
      
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(result, null, 2)
        }]
      } as any;
    });

    // Register project structure tool
    this.server.registerTool("get_project_structure", {
      description: "Get the structure of the current project",
      inputSchema: z.object({}) as any
    }, async () => {
      const structure = await this.getProjectStructure();
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(structure, null, 2) 
        }]
      } as any;
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async close(): Promise<void> {
    await this.server.close();
  }

  // Helper methods
  private async readFile(filePath: string): Promise<string> {
    try {
      const projectPath = process.env.PROJECT_PATH || process.cwd();
      const fullPath = path.resolve(projectPath, filePath);
      
      // Security check: ensure we're within the project directory
      if (!fullPath.startsWith(projectPath)) {
        throw new Error('Access denied: path outside project directory');
      }
      
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
  }

  private async listFiles(directory: string): Promise<string[]> {
    try {
      const projectPath = process.env.PROJECT_PATH || process.cwd();
      const fullPath = path.resolve(projectPath, directory);
      
      // Security check
      if (!fullPath.startsWith(projectPath)) {
        throw new Error('Access denied: path outside project directory');
      }
      
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      return files.map(file => `${file.isDirectory() ? '[DIR]' : '[FILE]'} ${file.name}`);
    } catch (error) {
      throw new Error(`Failed to list directory ${directory}: ${(error as Error).message}`);
    }
  }

  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const projectPath = process.env.PROJECT_PATH || process.cwd();
      const { stdout, stderr } = await execAsync(command, { 
        cwd: projectPath,
        timeout: 30000 // 30 second timeout
      });
      return { stdout, stderr };
    } catch (error: any) {
      return { 
        stdout: error.stdout || '', 
        stderr: error.stderr || error.message 
      };
    }
  }

  private async gitStatus(projectPath?: string): Promise<string> {
    try {
      const workingDir = projectPath || process.env.PROJECT_PATH || process.cwd();
      const { stdout } = await execAsync('git status --porcelain', { 
        cwd: workingDir 
      });
      
      if (!stdout.trim()) {
        return 'Working tree clean';
      }
      
      return stdout;
    } catch (error) {
      return `Git error: ${(error as Error).message}`;
    }
  }

  private async getProjectStructure(): Promise<any> {
    try {
      const projectPath = process.env.PROJECT_PATH || process.cwd();
      
      async function buildTree(dirPath: string, relativePath = ''): Promise<any> {
        const structure: any = {};
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          // Skip hidden files and node_modules
          if (item.name.startsWith('.') || item.name === 'node_modules') {
            continue;
          }
          
          const itemPath = path.join(dirPath, item.name);
          const relativeItemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
          
          if (item.isDirectory()) {
            structure[relativeItemPath] = await buildTree(itemPath, relativeItemPath);
          } else {
            structure[relativeItemPath] = 'file';
          }
        }
        
        return structure;
      }

      return await buildTree(projectPath);
    } catch (error) {
      throw new Error(`Failed to get project structure: ${(error as Error).message}`);
    }
  }
}

export const swiStackMcpToolsServer = new SwiStackMcpToolsServer();