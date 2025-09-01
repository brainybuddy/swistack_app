import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ProjectFileModel } from '../../models/ProjectFile';
import { FileNode, CodeExecution, ExecutionResult } from '@swistack/shared';

const execAsync = promisify(exec);

export interface ExecutionOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  input?: string;
  language?: string;
}

export interface FileOperation {
  type: 'create' | 'update' | 'delete' | 'rename';
  path: string;
  content?: string;
  newPath?: string;
}

export class CodeExecutionService {
  private executionTimeout = 30000; // 30 seconds default
  private maxOutputSize = 1024 * 1024; // 1MB max output
  private sandboxDir = '/tmp/swistack-sandbox';

  constructor() {
    this.initializeSandbox();
  }

  private async initializeSandbox() {
    try {
      await fs.mkdir(this.sandboxDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create sandbox directory:', error);
    }
  }

  /**
   * Execute code in a sandboxed environment
   */
  async executeCode(
    code: string,
    language: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      let result: ExecutionResult;

      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          result = await this.executeJavaScript(code, options);
          break;
        case 'typescript':
        case 'ts':
          result = await this.executeTypeScript(code, options);
          break;
        case 'python':
        case 'py':
          result = await this.executePython(code, options);
          break;
        case 'bash':
        case 'sh':
        case 'shell':
          result = await this.executeBash(code, options);
          break;
        case 'sql':
          result = await this.executeSQL(code, options);
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      return {
        ...result,
        id: executionId,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: executionId,
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute JavaScript code using Node.js
   */
  private async executeJavaScript(
    code: string,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const tempFile = path.join(this.sandboxDir, `${uuidv4()}.js`);
    
    try {
      await fs.writeFile(tempFile, code);
      
      const { stdout, stderr } = await execAsync(
        `node ${tempFile}`,
        {
          timeout: options.timeout || this.executionTimeout,
          cwd: options.cwd || this.sandboxDir,
          env: { ...process.env, ...options.env },
        }
      );

      return {
        success: true,
        output: stdout,
        error: stderr,
      };
    } finally {
      await fs.unlink(tempFile).catch(() => {});
    }
  }

  /**
   * Execute TypeScript code by transpiling to JavaScript first
   */
  private async executeTypeScript(
    code: string,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const tempTsFile = path.join(this.sandboxDir, `${uuidv4()}.ts`);
    const tempJsFile = tempTsFile.replace('.ts', '.js');
    
    try {
      await fs.writeFile(tempTsFile, code);
      
      // Transpile TypeScript to JavaScript
      await execAsync(
        `npx tsc ${tempTsFile} --outFile ${tempJsFile} --target ES2020 --module commonjs`,
        {
          timeout: 10000,
          cwd: this.sandboxDir,
        }
      );

      // Execute the transpiled JavaScript
      const { stdout, stderr } = await execAsync(
        `node ${tempJsFile}`,
        {
          timeout: options.timeout || this.executionTimeout,
          cwd: options.cwd || this.sandboxDir,
          env: { ...process.env, ...options.env },
        }
      );

      return {
        success: true,
        output: stdout,
        error: stderr,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      await fs.unlink(tempTsFile).catch(() => {});
      await fs.unlink(tempJsFile).catch(() => {});
    }
  }

  /**
   * Execute Python code
   */
  private async executePython(
    code: string,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const tempFile = path.join(this.sandboxDir, `${uuidv4()}.py`);
    
    try {
      await fs.writeFile(tempFile, code);
      
      const { stdout, stderr } = await execAsync(
        `python3 ${tempFile}`,
        {
          timeout: options.timeout || this.executionTimeout,
          cwd: options.cwd || this.sandboxDir,
          env: { ...process.env, ...options.env },
        }
      );

      return {
        success: true,
        output: stdout,
        error: stderr,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      await fs.unlink(tempFile).catch(() => {});
    }
  }

  /**
   * Execute Bash/Shell commands
   */
  private async executeBash(
    code: string,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    console.log(`[CodeExecution] executeBash called with code: ${code}`);
    console.log(`[CodeExecution] Options:`, { 
      cwd: options.cwd || this.sandboxDir,
      timeout: options.timeout || this.executionTimeout 
    });
    
    return new Promise((resolve) => {
      exec(code, {
        timeout: options.timeout || this.executionTimeout,
        cwd: options.cwd || this.sandboxDir,
        env: { ...process.env, ...options.env },
        shell: true,
      }, (error, stdout, stderr) => {
        if (error) {
          console.log(`[CodeExecution] executeBash error:`, error.message);
          resolve({
            success: false,
            output: stdout || '',
            error: stderr || error.message,
          });
        } else {
          resolve({
            success: true,
            output: stdout,
            error: stderr,
          });
        }
      });
    });
  }

  /**
   * Execute SQL queries (requires database connection)
   */
  private async executeSQL(
    code: string,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    // This would connect to the project's database
    // For now, return a placeholder
    return {
      success: false,
      output: '',
      error: 'SQL execution not yet implemented',
    };
  }

  /**
   * Execute a terminal command
   */
  async executeCommand(
    command: string,
    cwd?: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    // Always use sandbox dir if cwd is not provided or doesn't exist
    const workingDir = cwd || this.sandboxDir;
    
    console.log(`[CodeExecution] executeCommand called with command: ${command}`);
    console.log(`[CodeExecution] Using working dir: ${workingDir}`);
    
    // Use the same approach as executeBash which works
    const result = await this.executeBash(command, {
      ...options,
      cwd: workingDir,
    });
    
    console.log(`[CodeExecution] Command result:`, result);
    return result;
  }

  /**
   * Execute multiple terminal commands in sequence
   */
  async executeCommandSequence(
    commands: string[],
    cwd: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    for (const command of commands) {
      const result = await this.executeCommand(command, cwd, options);
      results.push(result);
      
      // Stop on first failure unless specified otherwise
      if (!result.success && !options.env?.CONTINUE_ON_ERROR) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Run a long-running process with streaming output
   */
  async runProcess(
    command: string,
    args: string[],
    cwd: string,
    onOutput: (data: string) => void,
    onError: (error: string) => void
  ): Promise<{ pid: number; kill: () => void }> {
    const child = spawn(command, args, {
      cwd: cwd || this.sandboxDir,
      env: process.env,
      shell: true,
    });

    child.stdout?.on('data', (data) => {
      onOutput(data.toString());
    });

    child.stderr?.on('data', (data) => {
      onError(data.toString());
    });

    return {
      pid: child.pid || 0,
      kill: () => child.kill(),
    };
  }

  /**
   * Find files that match a given pattern or name
   */
  private async findMatchingFiles(
    projectId: string,
    searchPattern: string
  ): Promise<string[]> {
    const projectBasePath = '/Applications/swistack_app/packages/frontend/src';
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      // Search for files matching the pattern
      const searchTerms = searchPattern.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || searchPattern;
      
      // Try multiple search strategies
      const searchCommands = [
        `find ${projectBasePath} -name "*${searchTerms}*" -type f 2>/dev/null`,
        `find ${projectBasePath} -iname "*${searchTerms}*" -type f 2>/dev/null`,
        `grep -r -l "${searchTerms}" ${projectBasePath} 2>/dev/null | head -20`
      ];
      
      const results = new Set<string>();
      
      for (const cmd of searchCommands) {
        try {
          const { stdout } = await execAsync(cmd, { timeout: 5000 });
          const files = stdout.split('\n').filter(f => f.length > 0);
          files.forEach(f => results.add(f.replace(projectBasePath + '/', '')));
        } catch (e) {
          // Continue with next search strategy
        }
      }
      
      return Array.from(results);
    } catch (error) {
      console.log(`[CodeExecution] Search failed for pattern: ${searchPattern}`);
      return [];
    }
  }

  /**
   * Intelligently resolve file path
   */
  private async resolveFilePath(
    projectId: string,
    requestedPath: string
  ): Promise<string | null> {
    const projectBasePath = '/Applications/swistack_app/packages/frontend/src';
    
    // First, check if the exact path exists
    try {
      await fs.access(path.join(projectBasePath, requestedPath));
      console.log(`[CodeExecution] Found exact match: ${requestedPath}`);
      return requestedPath;
    } catch (e) {
      // File doesn't exist at the exact path
    }
    
    // Try to find similar files
    console.log(`[CodeExecution] Searching for file similar to: ${requestedPath}`);
    const matchingFiles = await this.findMatchingFiles(projectId, requestedPath);
    
    if (matchingFiles.length === 0) {
      console.log(`[CodeExecution] No matching files found for: ${requestedPath}`);
      return null;
    }
    
    // Sort by similarity to requested path
    const scored = matchingFiles.map(file => {
      const requestedParts = requestedPath.toLowerCase().split('/');
      const fileParts = file.toLowerCase().split('/');
      let score = 0;
      
      // Check filename match
      const requestedName = requestedParts[requestedParts.length - 1];
      const fileName = fileParts[fileParts.length - 1];
      if (fileName === requestedName) score += 10;
      else if (fileName.includes(requestedName.replace(/\.[^.]+$/, ''))) score += 5;
      
      // Check path similarity
      requestedParts.forEach(part => {
        if (fileParts.includes(part)) score += 2;
      });
      
      return { file, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    
    if (scored[0].score > 0) {
      console.log(`[CodeExecution] Best match found: ${scored[0].file} (score: ${scored[0].score})`);
      return scored[0].file;
    }
    
    return null;
  }

  /**
   * Modify project files (create, update, delete) with intelligent path resolution
   */
  async modifyProjectFiles(
    projectId: string,
    operations: FileOperation[],
    userId: string
  ): Promise<{ success: boolean; results: any[] }> {
    const results = [];
    
    try {
      for (const operation of operations) {
        let result;
        let actualPath = operation.path;
        
        // For update operations, try to resolve the actual file path
        if (operation.type === 'update') {
          const resolvedPath = await this.resolveFilePath(projectId, operation.path);
          if (resolvedPath) {
            actualPath = resolvedPath;
            console.log(`[CodeExecution] Resolved path: ${operation.path} -> ${actualPath}`);
          } else if (!operation.path.includes('app/components/')) {
            // If we couldn't find the file and it's not in the expected location,
            // log a warning but continue
            console.warn(`[CodeExecution] Could not resolve path: ${operation.path}`);
          }
        }
        
        switch (operation.type) {
          case 'create':
            result = await this.createFile(projectId, actualPath, operation.content || '', userId);
            break;
          case 'update':
            result = await this.updateFile(projectId, actualPath, operation.content || '', userId);
            break;
          case 'delete':
            result = await this.deleteFile(projectId, actualPath);
            break;
          case 'rename':
            result = await this.renameFile(projectId, actualPath, operation.newPath || '');
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        
        results.push({
          operation: operation.type,
          path: actualPath,
          originalPath: operation.path,
          success: true,
          result,
        });
      }
      
      return { success: true, results };
    } catch (error) {
      console.error('File modification error:', error);
      return {
        success: false,
        results: [...results, { error: error instanceof Error ? error.message : String(error) }],
      };
    }
  }

  /**
   * Create a new file in the project
   */
  private async createFile(
    projectId: string,
    filePath: string,
    content: string,
    userId: string
  ) {
    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);
    
    // Check if file already exists
    const existing = await ProjectFileModel.findByPath(projectId, filePath);
    if (existing) {
      throw new Error(`File already exists: ${filePath}`);
    }
    
    // Get parent directory
    let parentId = null;
    if (dirPath !== '.' && dirPath !== '/') {
      const parent = await ProjectFileModel.findByPath(projectId, dirPath);
      parentId = parent?.id || null;
    }
    
    // IMPORTANT: Write to actual file system for live preview
    // Determine the actual project path - for now using frontend src
    const projectBasePath = '/Applications/swistack_app/packages/frontend/src';
    const fullPath = path.join(projectBasePath, filePath);
    const fullDirPath = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(fullDirPath, { recursive: true });
    
    // Write the actual file
    await fs.writeFile(fullPath, content, 'utf8');
    console.log(`[CodeExecution] Created file on disk: ${fullPath}`);
    
    // Also create in database for tracking
    return await ProjectFileModel.create({
      projectId,
      path: filePath,
      name: fileName,
      type: 'file',
      content,
      size: Buffer.byteLength(content),
      mimeType: this.getMimeType(fileName),
      encoding: 'utf8',
      isBinary: false,
      parentId,
      createdBy: userId,
    });
  }

  /**
   * Update an existing file
   */
  private async updateFile(
    projectId: string,
    filePath: string,
    content: string,
    userId: string
  ) {
    // AGGRESSIVE FIX: Intercept known problematic paths and redirect
    const pathMappings: { [key: string]: string } = {
      'app/components/Navbar.tsx': 'components/WorkspaceLayout.tsx',
      'components/Navbar.tsx': 'components/WorkspaceLayout.tsx',
      'app/components/SignOutModal.tsx': 'components/SignOutModal.tsx',
    };
    
    // Check if this is a known problematic path
    if (pathMappings[filePath]) {
      console.log(`[CodeExecution] INTERCEPTED problematic path: ${filePath} -> Redirecting to: ${pathMappings[filePath]}`);
      filePath = pathMappings[filePath];
    }
    
    const file = await ProjectFileModel.findByPath(projectId, filePath);
    if (!file) {
      // Try to find the actual file
      console.log(`[CodeExecution] File not found in DB: ${filePath}, checking filesystem...`);
      
      const projectBasePath = '/Applications/swistack_app/packages/frontend/src';
      const fullPath = path.join(projectBasePath, filePath);
      
      try {
        await fs.access(fullPath);
        console.log(`[CodeExecution] File exists on disk, proceeding with update: ${fullPath}`);
      } catch (e) {
        // File doesn't exist - this is the actual problem!
        console.error(`[CodeExecution] ERROR: Attempting to update non-existent file: ${filePath}`);
        
        // For navigation-related requests, we need to be SMART about this
        if (filePath.toLowerCase().includes('navbar') || filePath.toLowerCase().includes('navigation')) {
          console.log(`[CodeExecution] INTERCEPTING navigation update - merging into WorkspaceLayout.tsx`);
          
          // Read the existing WorkspaceLayout file
          const wsPath = path.join(projectBasePath, 'components/WorkspaceLayout.tsx');
          const existingContent = await fs.readFile(wsPath, 'utf8');
          
          // Extract what the AI was trying to do from the content
          // Look for navigation to settings page
          if (content.includes('router.push(\'/settings\')') || content.includes('handleProfileSettings')) {
            console.log(`[CodeExecution] Detected settings navigation update - applying to WorkspaceLayout dropdown menu`);
            
            // Find and replace the settings button onClick handler
            const updatedContent = existingContent.replace(
              /onClick=\{.*?\s*onViewChange\('settings'\).*?\}/s,
              `onClick={() => {
                      router.push('/settings');
                      setShowUserMenu(false);
                    }}`
            );
            
            await fs.writeFile(wsPath, updatedContent, 'utf8');
            console.log(`[CodeExecution] Successfully updated WorkspaceLayout.tsx with settings navigation`);
            return { success: true, message: 'Updated navigation in WorkspaceLayout.tsx' };
          }
          
          // For other navigation updates, log warning but try to proceed
          console.warn(`[CodeExecution] Unable to merge navigation changes intelligently, skipping update`);
          return { 
            success: false, 
            message: 'Navigation components are in WorkspaceLayout.tsx, not in a separate Navbar file. Please update WorkspaceLayout.tsx directly.' 
          };
        } else {
          throw new Error(`File not found: ${filePath}. Please check the project file structure and use an existing file path.`);
        }
      }
    }
    
    // Write to actual file system for live preview
    const projectBasePath = '/Applications/swistack_app/packages/frontend/src';
    const fullPath = path.join(projectBasePath, filePath);
    
    // Write the updated file
    await fs.writeFile(fullPath, content, 'utf8');
    console.log(`[CodeExecution] Updated file on disk: ${fullPath}`);
    
    // Also update in database if we have the file record
    if (file) {
      return await ProjectFileModel.updateContent(
        file.id,
        content,
        Buffer.byteLength(content),
        userId
      );
    }
    
    return { success: true, message: `Updated ${filePath}` };
  }

  /**
   * Delete a file from the project
   */
  private async deleteFile(projectId: string, filePath: string) {
    return await ProjectFileModel.deleteByPath(projectId, filePath);
  }

  /**
   * Rename a file
   */
  private async renameFile(
    projectId: string,
    oldPath: string,
    newPath: string
  ) {
    const file = await ProjectFileModel.findByPath(projectId, oldPath);
    if (!file) {
      throw new Error(`File not found: ${oldPath}`);
    }
    
    return await ProjectFileModel.moveFile(file.id, newPath);
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.jsx': 'text/jsx',
      '.tsx': 'text/tsx',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.scss': 'text/scss',
      '.py': 'text/x-python',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'text/plain';
  }

  /**
   * Install npm packages in project
   */
  async installPackages(
    projectPath: string,
    packages: string[],
    isDev = false
  ): Promise<ExecutionResult> {
    const command = `npm install ${isDev ? '--save-dev' : ''} ${packages.join(' ')}`;
    return await this.executeCommand(command, projectPath);
  }

  /**
   * Run npm scripts
   */
  async runNpmScript(
    projectPath: string,
    scriptName: string
  ): Promise<ExecutionResult> {
    const command = `npm run ${scriptName}`;
    return await this.executeCommand(command, projectPath);
  }

  /**
   * Lint and format code
   */
  async lintCode(
    projectPath: string,
    filePath?: string
  ): Promise<ExecutionResult> {
    const command = filePath 
      ? `npx eslint ${filePath} --fix`
      : 'npm run lint';
    return await this.executeCommand(command, projectPath);
  }

  /**
   * Run tests
   */
  async runTests(
    projectPath: string,
    testFile?: string
  ): Promise<ExecutionResult> {
    const command = testFile
      ? `npm test -- ${testFile}`
      : 'npm test';
    return await this.executeCommand(command, projectPath);
  }
}

// Export singleton instance
export const codeExecutionService = new CodeExecutionService();