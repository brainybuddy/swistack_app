import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileConflict, AutoSaveResult, AutoSaveOptions } from '@swistack/shared';

interface FileState {
  content: string;
  hash: string;
  lastModified: Date;
  savedVersion?: string;
  savedHash?: string;
}

interface ConflictResolutionStrategy {
  resolveConflict(localContent: string, remoteContent: string, originalContent?: string): string;
}

class OverwriteStrategy implements ConflictResolutionStrategy {
  resolveConflict(localContent: string): string {
    return localContent;
  }
}

class ManualStrategy implements ConflictResolutionStrategy {
  resolveConflict(localContent: string, remoteContent: string): string {
    // Return a merged version with conflict markers
    return `<<<<<<< LOCAL\n${localContent}\n=======\n${remoteContent}\n>>>>>>> REMOTE\n`;
  }
}

class MergeStrategy implements ConflictResolutionStrategy {
  resolveConflict(localContent: string, remoteContent: string, originalContent?: string): string {
    // Simple line-based merge
    if (!originalContent) {
      return new ManualStrategy().resolveConflict(localContent, remoteContent);
    }

    const originalLines = originalContent.split('\n');
    const localLines = localContent.split('\n');
    const remoteLines = remoteContent.split('\n');

    const result: string[] = [];
    let i = 0, j = 0, k = 0;

    while (i < originalLines.length || j < localLines.length || k < remoteLines.length) {
      const originalLine = i < originalLines.length ? originalLines[i] : undefined;
      const localLine = j < localLines.length ? localLines[j] : undefined;
      const remoteLine = k < remoteLines.length ? remoteLines[k] : undefined;

      if (originalLine === localLine && originalLine === remoteLine) {
        // No changes
        if (originalLine !== undefined) result.push(originalLine);
        i++; j++; k++;
      } else if (originalLine === localLine && originalLine !== remoteLine) {
        // Only remote changed
        if (remoteLine !== undefined) result.push(remoteLine);
        i++; j++; k++;
      } else if (originalLine !== localLine && originalLine === remoteLine) {
        // Only local changed
        if (localLine !== undefined) result.push(localLine);
        i++; j++; k++;
      } else {
        // Conflict - both changed
        result.push(`<<<<<<< LOCAL`);
        if (localLine !== undefined) result.push(localLine);
        result.push(`=======`);
        if (remoteLine !== undefined) result.push(remoteLine);
        result.push(`>>>>>>> REMOTE`);
        
        i++; j++; k++;
      }
    }

    return result.join('\n');
  }
}

export class AutoSaveService {
  private fileStates = new Map<string, FileState>();
  private saveTimeouts = new Map<string, NodeJS.Timeout>();
  private conflictStrategies = new Map<string, ConflictResolutionStrategy>();

  constructor() {
    this.conflictStrategies.set('overwrite', new OverwriteStrategy());
    this.conflictStrategies.set('manual', new ManualStrategy());
    this.conflictStrategies.set('merge', new MergeStrategy());
  }

  /**
   * Schedule an auto-save for a file
   */
  public scheduleAutoSave(
    filePath: string, 
    content: string, 
    options: AutoSaveOptions
  ): void {
    if (!options.enabled) return;

    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(filePath);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Update file state
    const hash = this.generateHash(content);
    this.fileStates.set(filePath, {
      content,
      hash,
      lastModified: new Date()
    });

    // Schedule new save
    const timeout = setTimeout(async () => {
      try {
        await this.performAutoSave(filePath, content, options);
      } catch (error) {
        console.error(`Auto-save failed for ${filePath}:`, error);
      }
      this.saveTimeouts.delete(filePath);
    }, options.delay);

    this.saveTimeouts.set(filePath, timeout);
  }

  /**
   * Perform the actual auto-save operation
   */
  private async performAutoSave(
    filePath: string, 
    content: string, 
    options: AutoSaveOptions
  ): Promise<AutoSaveResult> {
    try {
      const fileState = this.fileStates.get(filePath);
      if (!fileState) {
        throw new Error('File state not found');
      }

      // Check if file has been modified externally
      const conflict = await this.detectConflict(filePath, fileState);
      
      if (conflict) {
        const strategy = this.conflictStrategies.get(options.conflictResolution);
        if (!strategy) {
          throw new Error(`Unknown conflict resolution strategy: ${options.conflictResolution}`);
        }

        // Handle conflict
        const resolvedContent = strategy.resolveConflict(
          content, 
          conflict.remoteVersion, 
          fileState.savedVersion
        );

        await this.writeFile(filePath, resolvedContent);
        
        // Update file state
        fileState.savedVersion = resolvedContent;
        fileState.savedHash = this.generateHash(resolvedContent);

        return {
          success: true,
          file: filePath,
          timestamp: new Date(),
          conflicts: [conflict]
        };
      }

      // No conflict, save normally
      await this.writeFile(filePath, content);
      
      // Update file state
      fileState.savedVersion = content;
      fileState.savedHash = fileState.hash;

      return {
        success: true,
        file: filePath,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        file: filePath,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Detect if there's a conflict with the file on disk
   */
  private async detectConflict(filePath: string, fileState: FileState): Promise<FileConflict | null> {
    try {
      // Check if file exists on disk
      const stats = await fs.stat(filePath);
      
      // If we have no saved version, no conflict
      if (!fileState.savedVersion || !fileState.savedHash) {
        return null;
      }

      // Read current file content
      const diskContent = await fs.readFile(filePath, 'utf-8');
      const diskHash = this.generateHash(diskContent);

      // If disk version matches our saved version, no conflict
      if (diskHash === fileState.savedHash) {
        return null;
      }

      // We have a conflict
      return {
        file: filePath,
        localVersion: fileState.content,
        remoteVersion: diskContent,
        timestamp: stats.mtime
      };

    } catch (error) {
      // File doesn't exist, no conflict
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Force save a file, bypassing auto-save delay
   */
  public async forceSave(
    filePath: string, 
    content: string, 
    options: AutoSaveOptions = { enabled: true, delay: 0, conflictResolution: 'overwrite' }
  ): Promise<AutoSaveResult> {
    // Cancel any pending auto-save
    const existingTimeout = this.saveTimeouts.get(filePath);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.saveTimeouts.delete(filePath);
    }

    return this.performAutoSave(filePath, content, options);
  }

  /**
   * Get file state for debugging
   */
  public getFileState(filePath: string): FileState | undefined {
    return this.fileStates.get(filePath);
  }

  /**
   * Clear file state (when file is closed)
   */
  public clearFileState(filePath: string): void {
    const timeout = this.saveTimeouts.get(filePath);
    if (timeout) {
      clearTimeout(timeout);
      this.saveTimeouts.delete(filePath);
    }
    this.fileStates.delete(filePath);
  }

  /**
   * Get all files with pending saves
   */
  public getPendingSaves(): string[] {
    return Array.from(this.saveTimeouts.keys());
  }

  /**
   * Cancel all pending saves
   */
  public cancelAllSaves(): void {
    for (const timeout of this.saveTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.saveTimeouts.clear();
  }

  /**
   * Resolve a conflict manually
   */
  public async resolveConflict(
    filePath: string, 
    resolvedContent: string, 
    resolution: 'local' | 'remote' | 'merged'
  ): Promise<AutoSaveResult> {
    try {
      await this.writeFile(filePath, resolvedContent);
      
      const fileState = this.fileStates.get(filePath);
      if (fileState) {
        fileState.content = resolvedContent;
        fileState.hash = this.generateHash(resolvedContent);
        fileState.savedVersion = resolvedContent;
        fileState.savedHash = fileState.hash;
      }

      return {
        success: true,
        file: filePath,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        file: filePath,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate MD5 hash of content
   */
  private generateHash(content: string): string {
    return crypto.createHash('md5').update(content, 'utf8').digest('hex');
  }

  /**
   * Write file to disk with proper directory creation
   */
  private async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Check if a file has unsaved changes
   */
  public hasUnsavedChanges(filePath: string): boolean {
    const fileState = this.fileStates.get(filePath);
    if (!fileState) return false;
    
    return fileState.hash !== fileState.savedHash;
  }

  /**
   * Get files with unsaved changes
   */
  public getFilesWithUnsavedChanges(): string[] {
    const files: string[] = [];
    
    for (const [filePath, state] of this.fileStates.entries()) {
      if (state.hash !== state.savedHash) {
        files.push(filePath);
      }
    }
    
    return files;
  }
}

// Singleton instance
export const autoSaveService = new AutoSaveService();