// Note: MCP imports temporarily disabled due to module resolution
// Will be re-enabled after proper SDK setup
// import { McpServer } from '@modelcontextprotocol/sdk/server';
// import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SwiStackMcpToolsServer {
  private server: any; // Will be typed properly when MCP is re-enabled

  constructor() {
    // MCP server initialization temporarily disabled
    console.log('MCP Tools Server - placeholder mode until SDK is properly configured');
    // this.setupTools();
  }

  private setupTools(): void {
    // File system operations
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'read_file':
          return await this.readFile(args.path);
        case 'write_file':
          return await this.writeFile(args.path, args.content);
        case 'list_files':
          return await this.listFiles(args.directory);
        case 'execute_command':
          return await this.executeCommand(args.command);
        case 'capture_preview':
          return await this.capturePreview();
        case 'get_project_structure':
          return await this.getProjectStructure();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'read_file',
            description: 'Read the contents of a file in the user\'s project',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Relative path to the file from project root',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'write_file',
            description: 'Write content to a file in the user\'s project',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Relative path to the file from project root',
                },
                content: {
                  type: 'string',
                  description: 'Content to write to the file',
                },
              },
              required: ['path', 'content'],
            },
          },
          {
            name: 'list_files',
            description: 'List files and directories in a project directory',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Relative path to the directory from project root',
                },
              },
              required: ['directory'],
            },
          },
          {
            name: 'execute_command',
            description: 'Execute a shell command in the project directory',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Shell command to execute',
                },
              },
              required: ['command'],
            },
          },
          {
            name: 'capture_preview',
            description: 'Capture the current state of the live preview',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_project_structure',
            description: 'Get an overview of the project structure and key files',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });
  }

  private async readFile(relativePath: string): Promise<any> {
    try {
      const projectRoot = process.cwd();
      const fullPath = path.join(projectRoot, relativePath);
      
      // Security check: ensure path is within project
      if (!fullPath.startsWith(projectRoot)) {
        throw new Error('Access denied: Path outside project directory');
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `File content for ${relativePath}:\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading file ${relativePath}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async writeFile(relativePath: string, content: string): Promise<any> {
    try {
      const projectRoot = process.cwd();
      const fullPath = path.join(projectRoot, relativePath);
      
      // Security check: ensure path is within project
      if (!fullPath.startsWith(projectRoot)) {
        throw new Error('Access denied: Path outside project directory');
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote ${content.length} characters to ${relativePath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error writing file ${relativePath}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listFiles(directory: string): Promise<any> {
    try {
      const projectRoot = process.cwd();
      const fullPath = path.join(projectRoot, directory);
      
      // Security check: ensure path is within project
      if (!fullPath.startsWith(projectRoot)) {
        throw new Error('Access denied: Path outside project directory');
      }

      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'directory' : 'file',
      }));

      return {
        content: [
          {
            type: 'text',
            text: `Files in ${directory}:\n${fileList.map(f => `${f.type === 'directory' ? '📁' : '📄'} ${f.name}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing directory ${directory}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async executeCommand(command: string): Promise<any> {
    try {
      // Security: whitelist allowed commands
      const allowedCommands = [
        'npm', 'yarn', 'pnpm', 'node', 'tsc', 'eslint', 'prettier',
        'git', 'ls', 'pwd', 'cat', 'grep', 'find', 'test', 'build'
      ];
      
      const commandName = command.split(' ')[0];
      if (!allowedCommands.some(allowed => commandName.includes(allowed))) {
        throw new Error(`Command not allowed: ${commandName}`);
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 30000, // 30 second timeout
      });

      return {
        content: [
          {
            type: 'text',
            text: `Command: ${command}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing command ${command}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async capturePreview(): Promise<any> {
    try {
      // Import here to avoid circular dependency
      const { livePreviewIntegration } = await import('./LivePreviewIntegration');
      
      // Get current preview state for all projects (simplified for now)
      // In production, you'd need projectId context
      const mockProjectId = 'current-project'; // This should come from context
      const previewSummary = await livePreviewIntegration.capturePreviewForAgent(mockProjectId);
      
      return {
        content: [
          {
            type: 'text',
            text: `Live Preview State:\n\n${previewSummary}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error capturing preview: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getProjectStructure(): Promise<any> {
    try {
      const projectRoot = process.cwd();
      const structure = await this.buildProjectStructure(projectRoot, '', 2); // Max depth 2

      return {
        content: [
          {
            type: 'text',
            text: `SwiStack Project Structure:\n\n${structure}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting project structure: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async buildProjectStructure(dirPath: string, prefix: string, maxDepth: number): Promise<string> {
    if (maxDepth <= 0) return '';

    const files = await fs.readdir(dirPath, { withFileTypes: true });
    let structure = '';

    for (const file of files) {
      if (file.name.startsWith('.') || file.name === 'node_modules') continue;

      structure += `${prefix}${file.isDirectory() ? '📁' : '📄'} ${file.name}\n`;

      if (file.isDirectory() && maxDepth > 1) {
        const subStructure = await this.buildProjectStructure(
          path.join(dirPath, file.name),
          prefix + '  ',
          maxDepth - 1
        );
        structure += subStructure;
      }
    }

    return structure;
  }

  async start(): Promise<void> {
    // MCP server start temporarily disabled
    console.log('SwiStack MCP Tools Server - start method placeholder');
  }
}

// For standalone execution
if (require.main === module) {
  const server = new SwiStackMcpToolsServer();
  server.start().catch(console.error);
}