import * as path from 'path';
import * as fs from 'fs/promises';
import { ProjectFileModel } from '../models/ProjectFile';
import { FileNode } from '@swistack/shared';

interface ProjectConfig {
  id: string;
  name: string;
  basePath: string;
  framework: string;
  language: string;
}

export class ProjectFileSystem {
  private projectConfigs: Map<string, ProjectConfig> = new Map();
  private fileCache: Map<string, string> = new Map(); // path -> content cache
  
  /**
   * Initialize project configuration
   */
  async initializeProject(projectId: string, config: Partial<ProjectConfig>): Promise<void> {
    const basePath = config.basePath || this.resolveProjectBasePath(projectId);
    
    const projectConfig: ProjectConfig = {
      id: projectId,
      name: config.name || projectId,
      basePath,
      framework: config.framework || 'react',
      language: config.language || 'typescript'
    };
    
    this.projectConfigs.set(projectId, projectConfig);
    
    // Ensure base directory exists
    await fs.mkdir(basePath, { recursive: true });
  }

  /**
   * Get project configuration
   */
  getProjectConfig(projectId: string): ProjectConfig | undefined {
    return this.projectConfigs.get(projectId);
  }

  /**
   * Resolve project base path dynamically
   */
  private resolveProjectBasePath(projectId: string): string {
    // Use environment variable if available
    const workspaceBase = process.env.WORKSPACE_BASE_PATH || '/Applications/swistack_app';
    
    // Determine path based on project type
    // This can be enhanced to support multiple project types
    return path.join(workspaceBase, 'packages', 'frontend', 'src');
  }

  /**
   * Get absolute file path
   */
  getAbsolutePath(projectId: string, relativePath: string): string {
    const config = this.projectConfigs.get(projectId);
    if (!config) {
      throw new Error(`Project ${projectId} not initialized`);
    }
    
    // Sanitize the relative path
    const sanitized = relativePath.replace(/^\/+/, '').replace(/\.\.+/g, '');
    return path.join(config.basePath, sanitized);
  }

  /**
   * Check if file exists
   */
  async fileExists(projectId: string, relativePath: string): Promise<boolean> {
    try {
      const absPath = this.getAbsolutePath(projectId, relativePath);
      await fs.access(absPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(projectId: string, relativePath: string): Promise<string> {
    const absPath = this.getAbsolutePath(projectId, relativePath);
    
    // Check cache first
    const cached = this.fileCache.get(absPath);
    if (cached) {
      return cached;
    }
    
    const content = await fs.readFile(absPath, 'utf8');
    
    // Cache the content
    this.fileCache.set(absPath, content);
    
    return content;
  }

  /**
   * Write file content
   */
  async writeFile(
    projectId: string,
    relativePath: string,
    content: string,
    userId: string = 'system'
  ): Promise<void> {
    const absPath = this.getAbsolutePath(projectId, relativePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    
    // Write to filesystem
    await fs.writeFile(absPath, content, 'utf8');
    
    // Update cache
    this.fileCache.set(absPath, content);
    
    // Update database
    await this.syncToDatabase(projectId, relativePath, content, userId);
  }

  /**
   * Delete file
   */
  async deleteFile(projectId: string, relativePath: string): Promise<void> {
    const absPath = this.getAbsolutePath(projectId, relativePath);
    
    // Delete from filesystem
    await fs.unlink(absPath);
    
    // Remove from cache
    this.fileCache.delete(absPath);
    
    // Delete from database
    await ProjectFileModel.deleteByPath(projectId, relativePath);
  }

  /**
   * Move/rename file
   */
  async moveFile(
    projectId: string,
    oldPath: string,
    newPath: string,
    userId: string = 'system'
  ): Promise<void> {
    const oldAbsPath = this.getAbsolutePath(projectId, oldPath);
    const newAbsPath = this.getAbsolutePath(projectId, newPath);
    
    // Ensure new directory exists
    await fs.mkdir(path.dirname(newAbsPath), { recursive: true });
    
    // Move file
    await fs.rename(oldAbsPath, newAbsPath);
    
    // Update cache
    const content = this.fileCache.get(oldAbsPath);
    if (content) {
      this.fileCache.delete(oldAbsPath);
      this.fileCache.set(newAbsPath, content);
    }
    
    // Update database
    const file = await ProjectFileModel.findByPath(projectId, oldPath);
    if (file) {
      await ProjectFileModel.moveFile(file.id, newPath);
    }
  }

  /**
   * List files in directory
   */
  async listFiles(projectId: string, dirPath: string = ''): Promise<FileNode[]> {
    const absPath = this.getAbsolutePath(projectId, dirPath);
    
    try {
      const entries = await fs.readdir(absPath, { withFileTypes: true });
      
      const files: FileNode[] = [];
      
      for (const entry of entries) {
        // Skip hidden files and node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        const relativePath = path.join(dirPath, entry.name);
        const stats = await fs.stat(path.join(absPath, entry.name));
        
        files.push({
          id: `${projectId}:${relativePath}`,
          name: entry.name,
          path: relativePath,
          type: entry.isDirectory() ? 'folder' : 'file',
          size: stats.size,
          modifiedAt: stats.mtime,
          children: entry.isDirectory() ? [] : undefined
        });
      }
      
      return files;
    } catch (error) {
      console.error(`Failed to list files in ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Search for files by pattern
   */
  async searchFiles(
    projectId: string,
    pattern: string,
    options: {
      maxResults?: number;
      includeContent?: boolean;
      caseSensitive?: boolean;
    } = {}
  ): Promise<Array<{ path: string; content?: string }>> {
    const config = this.projectConfigs.get(projectId);
    if (!config) {
      throw new Error(`Project ${projectId} not initialized`);
    }
    
    const results: Array<{ path: string; content?: string }> = [];
    const { maxResults = 50, includeContent = false, caseSensitive = false } = options;
    
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
    
    async function searchDir(dirPath: string) {
      if (results.length >= maxResults) return;
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (results.length >= maxResults) break;
          
          // Skip hidden files and node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }
          
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(config.basePath, fullPath);
          
          if (entry.isDirectory()) {
            await searchDir(fullPath);
          } else {
            const fileName = caseSensitive ? entry.name : entry.name.toLowerCase();
            
            if (fileName.includes(searchPattern)) {
              const result: any = { path: relativePath };
              
              if (includeContent) {
                try {
                  result.content = await fs.readFile(fullPath, 'utf8');
                } catch {
                  result.content = null;
                }
              }
              
              results.push(result);
            }
          }
        }
      } catch (error) {
        console.error(`Error searching directory ${dirPath}:`, error);
      }
    }
    
    await searchDir(config.basePath);
    
    return results;
  }

  /**
   * Find files with similar names (fuzzy search)
   */
  async findSimilarFiles(
    projectId: string,
    targetPath: string,
    threshold: number = 0.6
  ): Promise<string[]> {
    const allFiles = await this.searchFiles(projectId, '', { maxResults: 1000 });
    
    const targetName = path.basename(targetPath).toLowerCase();
    const targetParts = targetPath.toLowerCase().split('/');
    
    const scored = allFiles.map(file => {
      const fileName = path.basename(file.path).toLowerCase();
      const fileParts = file.path.toLowerCase().split('/');
      
      let score = 0;
      
      // Exact filename match
      if (fileName === targetName) {
        score += 0.5;
      } else if (fileName.includes(targetName.replace(/\.[^.]+$/, ''))) {
        score += 0.3;
      }
      
      // Path similarity
      targetParts.forEach(part => {
        if (fileParts.includes(part)) {
          score += 0.1;
        }
      });
      
      // Levenshtein distance for fuzzy matching
      const distance = this.levenshteinDistance(targetName, fileName);
      const maxLen = Math.max(targetName.length, fileName.length);
      const similarity = 1 - (distance / maxLen);
      score += similarity * 0.2;
      
      return { path: file.path, score };
    });
    
    return scored
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.path);
  }

  /**
   * Sync file to database
   */
  private async syncToDatabase(
    projectId: string,
    relativePath: string,
    content: string,
    userId: string
  ): Promise<void> {
    const fileName = path.basename(relativePath);
    
    // Check if file exists in database
    const existing = await ProjectFileModel.findByPath(projectId, relativePath);
    
    if (existing) {
      // Update existing file
      await ProjectFileModel.updateContent(
        existing.id,
        content,
        Buffer.byteLength(content),
        userId
      );
    } else {
      // Create new file record
      await ProjectFileModel.create({
        projectId,
        path: relativePath,
        name: fileName,
        type: 'file',
        content,
        size: Buffer.byteLength(content),
        mimeType: this.getMimeType(fileName),
        encoding: 'utf8',
        isBinary: false,
        createdBy: userId
      });
    }
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
   * Calculate Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Clear cache for a project
   */
  clearCache(projectId?: string): void {
    if (projectId) {
      const config = this.projectConfigs.get(projectId);
      if (config) {
        // Clear only files for this project
        for (const [path] of this.fileCache) {
          if (path.startsWith(config.basePath)) {
            this.fileCache.delete(path);
          }
        }
      }
    } else {
      // Clear all cache
      this.fileCache.clear();
    }
  }
}

// Export singleton instance
export const projectFileSystem = new ProjectFileSystem();