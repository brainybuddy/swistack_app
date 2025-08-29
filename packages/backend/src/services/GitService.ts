import { simpleGit, SimpleGit, GitResponseError } from 'simple-git';
import { ProjectFileModel } from '../models/ProjectFile';
import { ProjectModel } from '../models/Project';
import { storageService } from './StorageService';
import path from 'path';
import fs from 'fs/promises';
import { GitOperationRequest, GitOperationResponse } from '@swistack/shared';
import { db } from '../config/database';

export class GitService {
  private static getProjectWorkspace(projectId: string): string {
    return path.join(process.cwd(), 'workspaces', projectId);
  }

  static async initializeRepository(
    projectId: string,
    repositoryUrl?: string
  ): Promise<GitOperationResponse> {
    try {
      const workspacePath = this.getProjectWorkspace(projectId);
      
      // Ensure workspace directory exists
      await fs.mkdir(workspacePath, { recursive: true });
      
      const git = simpleGit(workspacePath);
      
      if (repositoryUrl) {
        // Clone existing repository
        await git.clone(repositoryUrl, workspacePath);
        return {
          success: true,
          message: 'Repository cloned successfully',
          data: { repositoryUrl }
        };
      } else {
        // Initialize new repository
        await git.init();
        await git.addConfig('user.name', 'Swistack');
        await git.addConfig('user.email', 'noreply@swistack.dev');
        
        return {
          success: true,
          message: 'Repository initialized successfully'
        };
      }
    } catch (error) {
      console.error('Git initialization failed:', error);
      return {
        success: false,
        message: `Git initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async syncProjectFiles(projectId: string): Promise<void> {
    try {
      const workspacePath = this.getProjectWorkspace(projectId);
      const files = await ProjectFileModel.getProjectTree(projectId);
      
      // Clear workspace directory (except .git)
      const entries = await fs.readdir(workspacePath);
      for (const entry of entries) {
        if (entry !== '.git') {
          await fs.rm(path.join(workspacePath, entry), { recursive: true, force: true });
        }
      }
      
      // Create directories and files
      const createdDirs = new Set<string>();
      
      for (const file of files) {
        const filePath = path.join(workspacePath, file.path);
        const dirPath = path.dirname(filePath);
        
        // Create directory if it doesn't exist
        if (!createdDirs.has(dirPath)) {
          await fs.mkdir(dirPath, { recursive: true });
          createdDirs.add(dirPath);
        }
        
        if (file.type === 'file') {
          let content = '';
          
          if (file.content) {
            content = file.content;
          } else if (file.storageKey) {
            const buffer = await storageService.downloadFile(file.storageKey);
            content = buffer.toString(file.encoding as BufferEncoding);
          }
          
          await fs.writeFile(filePath, content, file.encoding as BufferEncoding);
        }
      }
    } catch (error) {
      console.error('Failed to sync project files:', error);
      throw error;
    }
  }

  static async performGitOperation(
    projectId: string,
    operation: GitOperationRequest
  ): Promise<GitOperationResponse> {
    try {
      const workspacePath = this.getProjectWorkspace(projectId);
      const git = simpleGit(workspacePath);
      
      // Sync files before git operations
      await this.syncProjectFiles(projectId);
      
      switch (operation.operation) {
        case 'commit':
          await git.add('.');
          const commitResult = await git.commit(operation.message || 'Auto-commit from Swistack');
          return {
            success: true,
            message: 'Changes committed successfully',
            data: { commit: commitResult.commit }
          };
          
        case 'push':
          const pushResult = await git.push(operation.remote || 'origin', operation.branch || 'main');
          return {
            success: true,
            message: 'Changes pushed successfully',
            data: pushResult
          };
          
        case 'pull':
          const pullResult = await git.pull(operation.remote || 'origin', operation.branch || 'main');
          
          // Update project files from pulled changes
          await this.updateProjectFromWorkspace(projectId);
          
          return {
            success: true,
            message: 'Changes pulled successfully',
            data: pullResult
          };
          
        case 'branch':
          if (operation.branch) {
            await git.checkoutLocalBranch(operation.branch);
            return {
              success: true,
              message: `Switched to branch '${operation.branch}'`
            };
          } else {
            const branches = await git.branch();
            return {
              success: true,
              message: 'Branch list retrieved',
              data: { branches: branches.all }
            };
          }
          
        case 'merge':
          if (!operation.branch) {
            throw new Error('Branch name is required for merge operation');
          }
          
          const mergeResult = await git.merge([operation.branch]);
          
          // Update project files after merge
          await this.updateProjectFromWorkspace(projectId);
          
          return {
            success: true,
            message: `Merged branch '${operation.branch}' successfully`,
            data: mergeResult
          };
          
        case 'clone':
          if (!operation.remote) {
            throw new Error('Repository URL is required for clone operation');
          }
          
          // Remove existing workspace
          await fs.rm(workspacePath, { recursive: true, force: true });
          await fs.mkdir(path.dirname(workspacePath), { recursive: true });
          
          await git.clone(operation.remote, workspacePath);
          
          // Update project files from cloned repository
          await this.updateProjectFromWorkspace(projectId);
          
          return {
            success: true,
            message: 'Repository cloned successfully',
            data: { repositoryUrl: operation.remote }
          };
          
        default:
          throw new Error(`Unsupported Git operation: ${operation.operation}`);
      }
    } catch (error) {
      console.error(`Git ${operation.operation} failed:`, error);
      
      let errorMessage = `Git ${operation.operation} failed`;
      if (error instanceof GitResponseError) {
        errorMessage += `: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  static async getStatus(projectId: string): Promise<GitOperationResponse> {
    try {
      const workspacePath = this.getProjectWorkspace(projectId);
      const git = simpleGit(workspacePath);
      
      // Sync files first
      await this.syncProjectFiles(projectId);
      
      const status = await git.status();
      
      return {
        success: true,
        message: 'Git status retrieved successfully',
        data: {
          branch: status.current,
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          modified: status.modified,
          not_added: status.not_added,
          deleted: status.deleted,
          renamed: status.renamed,
          conflicted: status.conflicted
        }
      };
    } catch (error) {
      console.error('Failed to get Git status:', error);
      return {
        success: false,
        message: `Failed to get Git status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async getCommitHistory(
    projectId: string,
    limit: number = 10
  ): Promise<GitOperationResponse> {
    try {
      const workspacePath = this.getProjectWorkspace(projectId);
      const git = simpleGit(workspacePath);
      
      const log = await git.log({ maxCount: limit });
      
      return {
        success: true,
        message: 'Commit history retrieved successfully',
        data: {
          commits: log.all.map(commit => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author_name,
            email: commit.author_email,
            date: commit.date,
          }))
        }
      };
    } catch (error) {
      console.error('Failed to get commit history:', error);
      return {
        success: false,
        message: `Failed to get commit history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async updateProjectFromWorkspace(projectId: string): Promise<void> {
    try {
      const workspacePath = this.getProjectWorkspace(projectId);
      
      // Clear existing project files
      await ProjectFileModel.deleteProjectFiles(projectId);
      
      // Read workspace files recursively
      await this.readWorkspaceDirectory(workspacePath, projectId, '', projectId);
      
    } catch (error) {
      console.error('Failed to update project from workspace:', error);
      throw error;
    }
  }

  private static async readWorkspaceDirectory(
    basePath: string,
    projectId: string,
    relativePath: string,
    userId: string,
    parentId: string | null = null
  ): Promise<void> {
    const fullPath = path.join(basePath, relativePath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip .git directory and other hidden files
      if (entry.name.startsWith('.')) continue;
      
      const entryPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
      const entryFullPath = path.join(fullPath, entry.name);
      
      if (entry.isDirectory()) {
        // Create directory record
        const directory = await ProjectFileModel.createDirectory(
          projectId,
          entryPath,
          parentId,
          userId
        );
        
        // Recursively read subdirectory
        await this.readWorkspaceDirectory(basePath, projectId, entryPath, userId, directory.id);
        
      } else if (entry.isFile()) {
        // Read file content
        const stats = await fs.stat(entryFullPath);
        const content = await fs.readFile(entryFullPath, 'utf8');
        
        // Determine if file should be stored in MinIO or database
        let storageKey: string | undefined = undefined;
        let fileContent: string | undefined = content;
        
        if (content.length > 1024 * 10) { // 10KB threshold
          storageKey = await storageService.uploadFile(projectId, entryPath, content);
          fileContent = undefined;
        }
        
        // Create file record
        await ProjectFileModel.create({
          projectId,
          path: entryPath,
          name: entry.name,
          type: 'file',
          mimeType: this.getMimeType(entry.name),
          size: stats.size,
          storageKey,
          content: fileContent,
          encoding: 'utf8',
          isBinary: this.isBinaryFile(entry.name),
          parentId: parentId || undefined,
          createdBy: userId,
        });
      }
    }
  }

  private static getMimeType(fileName: string): string | undefined {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'py': 'text/x-python',
      'java': 'text/x-java-source',
    };
    
    return ext ? mimeTypes[ext] : undefined;
  }

  private static isBinaryFile(fileName: string): boolean {
    const binaryExtensions = [
      'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico',
      'pdf', 'zip', 'tar', 'gz', 'rar',
      'exe', 'dll', 'so', 'dylib',
      'mp3', 'mp4', 'avi', 'mov',
    ];
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? binaryExtensions.includes(ext) : false;
  }

  static async cleanupWorkspace(projectId: string): Promise<void> {
    try {
      const workspacePath = this.getProjectWorkspace(projectId);
      await fs.rm(workspacePath, { recursive: true, force: true });
      console.log(`Cleaned up workspace for project ${projectId}`);
    } catch (error) {
      console.error(`Failed to cleanup workspace for project ${projectId}:`, error);
    }
  }

  // Clean up old workspaces based on project last access time
  static async cleanupOldWorkspaces(maxAgeHours: number = 24): Promise<void> {
    try {
      const workspacesRoot = path.join(process.cwd(), 'workspaces');
      
      // Ensure workspaces directory exists
      try {
        await fs.access(workspacesRoot);
      } catch {
        console.log('Workspaces directory does not exist, nothing to clean up');
        return;
      }

      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      
      // Get projects that haven't been accessed recently
      const staleProjects = await db('projects')
        .select('id', 'lastAccessedAt', 'name')
        .where('lastAccessedAt', '<', cutoffTime)
        .orWhereNull('lastAccessedAt');

      const workspaceDirs = await fs.readdir(workspacesRoot);
      let cleanupCount = 0;
      let spaceFreed = 0;

      for (const dir of workspaceDirs) {
        const workspacePath = path.join(workspacesRoot, dir);
        
        try {
          const stats = await fs.stat(workspacePath);
          if (!stats.isDirectory()) continue;

          // Check if this workspace corresponds to a stale project or deleted project
          const isStale = staleProjects.some(p => p.id === dir);
          const projectExists = await db('projects').select('id').where('id', dir).first();

          if (isStale || !projectExists) {
            // Calculate workspace size before deletion
            const size = await this.getDirectorySize(workspacePath);
            spaceFreed += size;
            
            await fs.rm(workspacePath, { recursive: true, force: true });
            cleanupCount++;
            
            const reason = !projectExists ? 'deleted project' : 'inactive project';
            console.log(`Cleaned up workspace for ${reason}: ${dir} (${this.formatBytes(size)})`);
          }
        } catch (error) {
          console.error(`Failed to process workspace directory ${dir}:`, error);
        }
      }

      if (cleanupCount > 0) {
        console.log(`🧹 Workspace cleanup completed: ${cleanupCount} workspaces removed, ${this.formatBytes(spaceFreed)} freed`);
      } else {
        console.log('🧹 Workspace cleanup completed: no workspaces needed cleaning');
      }
    } catch (error) {
      console.error('Failed to cleanup old workspaces:', error);
    }
  }

  // Clean up workspaces for deleted projects
  static async cleanupDeletedProjectWorkspaces(): Promise<void> {
    try {
      const workspacesRoot = path.join(process.cwd(), 'workspaces');
      
      try {
        await fs.access(workspacesRoot);
      } catch {
        return;
      }

      const workspaceDirs = await fs.readdir(workspacesRoot);
      let cleanupCount = 0;
      let spaceFreed = 0;

      for (const dir of workspaceDirs) {
        // Check if project still exists
        const projectExists = await db('projects').select('id').where('id', dir).first();
        
        if (!projectExists) {
          const workspacePath = path.join(workspacesRoot, dir);
          const size = await this.getDirectorySize(workspacePath);
          spaceFreed += size;
          
          await fs.rm(workspacePath, { recursive: true, force: true });
          cleanupCount++;
          
          console.log(`Cleaned up workspace for deleted project: ${dir}`);
        }
      }

      if (cleanupCount > 0) {
        console.log(`Cleaned up ${cleanupCount} workspaces for deleted projects (${this.formatBytes(spaceFreed)} freed)`);
      }
    } catch (error) {
      console.error('Failed to cleanup deleted project workspaces:', error);
    }
  }

  // Get directory size recursively
  private static async getDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(entryPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error(`Failed to calculate directory size for ${dirPath}:`, error);
      return 0;
    }
  }

  // Format bytes to human readable format
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Force cleanup all workspaces (for maintenance)
  static async forceCleanupAllWorkspaces(): Promise<void> {
    try {
      const workspacesRoot = path.join(process.cwd(), 'workspaces');
      
      try {
        const totalSize = await this.getDirectorySize(workspacesRoot);
        await fs.rm(workspacesRoot, { recursive: true, force: true });
        console.log(`🧹 Force cleaned up all workspaces (${this.formatBytes(totalSize)} freed)`);
      } catch (error) {
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to force cleanup all workspaces:', error);
    }
  }

  // Schedule periodic workspace cleanup
  static startWorkspaceCleanupScheduler(intervalHours: number = 6, maxAgeHours: number = 24): void {
    console.log(`🧹 Starting workspace cleanup scheduler (every ${intervalHours}h, max age ${maxAgeHours}h)`);
    
    // Run cleanup immediately on startup
    this.cleanupOldWorkspaces(maxAgeHours).catch(console.error);
    
    // Schedule periodic cleanup
    setInterval(async () => {
      try {
        await this.cleanupOldWorkspaces(maxAgeHours);
        await this.cleanupDeletedProjectWorkspaces();
      } catch (error) {
        console.error('Scheduled workspace cleanup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  // Get workspace statistics
  static async getWorkspaceStatistics(): Promise<{
    totalWorkspaces: number;
    totalSize: number;
    oldestWorkspace: Date | null;
    newestWorkspace: Date | null;
  }> {
    try {
      const workspacesRoot = path.join(process.cwd(), 'workspaces');
      
      try {
        await fs.access(workspacesRoot);
      } catch {
        return {
          totalWorkspaces: 0,
          totalSize: 0,
          oldestWorkspace: null,
          newestWorkspace: null
        };
      }

      const workspaceDirs = await fs.readdir(workspacesRoot);
      let totalSize = 0;
      let oldestDate: Date | null = null;
      let newestDate: Date | null = null;
      let validWorkspaces = 0;

      for (const dir of workspaceDirs) {
        const workspacePath = path.join(workspacesRoot, dir);
        
        try {
          const stats = await fs.stat(workspacePath);
          if (!stats.isDirectory()) continue;

          validWorkspaces++;
          const size = await this.getDirectorySize(workspacePath);
          totalSize += size;

          if (!oldestDate || stats.mtime < oldestDate) {
            oldestDate = stats.mtime;
          }
          if (!newestDate || stats.mtime > newestDate) {
            newestDate = stats.mtime;
          }
        } catch (error) {
          console.error(`Failed to stat workspace ${dir}:`, error);
        }
      }

      return {
        totalWorkspaces: validWorkspaces,
        totalSize,
        oldestWorkspace: oldestDate,
        newestWorkspace: newestDate
      };
    } catch (error) {
      console.error('Failed to get workspace statistics:', error);
      return {
        totalWorkspaces: 0,
        totalSize: 0,
        oldestWorkspace: null,
        newestWorkspace: null
      };
    }
  }
}