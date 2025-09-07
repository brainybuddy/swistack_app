import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectFileModel } from '../../models/ProjectFile';
import { 
  FileOperationValidator, 
  FileOperationOptions, 
  FileOperationResult,
  ValidationResult 
} from './FileOperationValidator';

export class EnhancedFileOperations {
  
  /**
   * Enhanced file write operation with validation and safety checks
   */
  static async writeFile(options: FileOperationOptions): Promise<FileOperationResult> {
    // Set operation type
    options.operation = options.operation || 'write';
    
    // Validate operation
    const validation = await FileOperationValidator.validateOperation(options);
    
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join('; ')}`,
        warnings: validation.warnings
      };
    }

    // Check if confirmation is required
    if (validation.requiresConfirmation && !options.force) {
      return {
        success: false,
        message: 'Operation requires confirmation. Use force flag to proceed.',
        confirmationRequired: true,
        warnings: validation.warnings,
        path: validation.safePath
      };
    }

    // Handle dry run
    if (options.dryRun) {
      return {
        success: true,
        message: `[DRY RUN] Would write to: ${validation.safePath}`,
        path: validation.safePath,
        dryRun: true,
        warnings: validation.warnings
      };
    }

    try {
      const safePath = validation.safePath!;
      let backupCreated = false;
      let backupPath: string | undefined;

      // Create backup if requested and file exists
      if (options.backupBeforeWrite && validation.backupPath) {
        const fileExists = await this.fileExists(safePath);
        if (fileExists) {
          await fs.copyFile(safePath, validation.backupPath);
          backupCreated = true;
          backupPath = validation.backupPath;
        }
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(safePath), { recursive: true });

      // Write the file
      await fs.writeFile(safePath, options.content || '', 'utf8');

      // Update database
      await this.updateDatabase(options, safePath);

      return {
        success: true,
        message: `Successfully wrote to ${safePath}`,
        path: safePath,
        backupCreated,
        backupPath,
        warnings: validation.warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: validation.warnings
      };
    }
  }

  /**
   * Enhanced file creation (fails if file exists)
   */
  static async createFile(options: FileOperationOptions): Promise<FileOperationResult> {
    options.operation = 'create';
    return this.writeFile(options);
  }

  /**
   * Enhanced file modification (requires file to exist)
   */
  static async modifyFile(options: FileOperationOptions): Promise<FileOperationResult> {
    options.operation = 'modify';
    
    // Validate first
    const validation = await FileOperationValidator.validateOperation(options);
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join('; ')}`,
        warnings: validation.warnings
      };
    }

    const fileExists = await this.fileExists(validation.safePath!);
    if (!fileExists) {
      return {
        success: false,
        message: 'Cannot modify: File does not exist. Use createFile instead.',
        path: validation.safePath
      };
    }

    return this.writeFile(options);
  }

  /**
   * Enhanced file deletion with safety checks
   */
  static async deleteFile(options: FileOperationOptions): Promise<FileOperationResult> {
    options.operation = 'delete';
    
    // Validate operation
    const validation = await FileOperationValidator.validateOperation(options);
    
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join('; ')}`,
        warnings: validation.warnings
      };
    }

    // Delete operations ALWAYS require confirmation unless forced
    if (!options.force) {
      return {
        success: false,
        message: 'Delete operation requires confirmation. Use force flag to proceed.',
        confirmationRequired: true,
        warnings: validation.warnings,
        path: validation.safePath
      };
    }

    // Handle dry run
    if (options.dryRun) {
      return {
        success: true,
        message: `[DRY RUN] Would delete: ${validation.safePath}`,
        path: validation.safePath,
        dryRun: true,
        warnings: validation.warnings
      };
    }

    try {
      const safePath = validation.safePath!;
      let backupCreated = false;
      let backupPath: string | undefined;

      // Create backup before deletion if requested
      if (options.backupBeforeWrite && validation.backupPath) {
        await fs.copyFile(safePath, validation.backupPath);
        backupCreated = true;
        backupPath = validation.backupPath;
      }

      // Delete the file
      await fs.unlink(safePath);

      // Update database
      await this.removeFromDatabase(options, safePath);

      return {
        success: true,
        message: `Successfully deleted ${safePath}`,
        path: safePath,
        backupCreated,
        backupPath,
        warnings: validation.warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: validation.warnings
      };
    }
  }

  /**
   * Create directory with validation
   */
  static async createDirectory(options: FileOperationOptions): Promise<FileOperationResult> {
    options.operation = 'create';
    
    // Validate operation
    const validation = await FileOperationValidator.validateOperation(options);
    
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join('; ')}`,
        warnings: validation.warnings
      };
    }

    // Handle dry run
    if (options.dryRun) {
      return {
        success: true,
        message: `[DRY RUN] Would create directory: ${validation.safePath}`,
        path: validation.safePath,
        dryRun: true,
        warnings: validation.warnings
      };
    }

    try {
      const safePath = validation.safePath!;

      // Create directory
      await fs.mkdir(safePath, { recursive: true });

      // Update database
      await this.updateDatabase({
        ...options,
        content: undefined
      }, safePath, 'directory');

      return {
        success: true,
        message: `Successfully created directory ${safePath}`,
        path: safePath,
        warnings: validation.warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `Directory creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: validation.warnings
      };
    }
  }

  /**
   * Move/rename file with validation
   */
  static async moveFile(
    options: FileOperationOptions, 
    newPath: string
  ): Promise<FileOperationResult> {
    options.operation = 'move';
    
    // Validate both source and destination
    const sourceValidation = await FileOperationValidator.validateOperation(options);
    const destValidation = await FileOperationValidator.validateOperation({
      ...options,
      path: newPath,
      operation: 'create'
    });
    
    if (!sourceValidation.valid || !destValidation.valid) {
      const errors = [...sourceValidation.errors, ...destValidation.errors];
      const warnings = [...sourceValidation.warnings, ...destValidation.warnings];
      return {
        success: false,
        message: `Validation failed: ${errors.join('; ')}`,
        warnings
      };
    }

    // Handle dry run
    if (options.dryRun) {
      return {
        success: true,
        message: `[DRY RUN] Would move ${sourceValidation.safePath} to ${destValidation.safePath}`,
        path: destValidation.safePath,
        dryRun: true,
        warnings: [...sourceValidation.warnings, ...destValidation.warnings]
      };
    }

    try {
      const sourcePath = sourceValidation.safePath!;
      const destPath = destValidation.safePath!;

      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // Move the file
      await fs.rename(sourcePath, destPath);

      // Update database
      await this.moveInDatabase(options, sourcePath, destPath);

      return {
        success: true,
        message: `Successfully moved ${sourcePath} to ${destPath}`,
        path: destPath,
        warnings: [...sourceValidation.warnings, ...destValidation.warnings]
      };

    } catch (error) {
      return {
        success: false,
        message: `Move failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: [...sourceValidation.warnings, ...destValidation.warnings]
      };
    }
  }

  /**
   * Helper: Check if file exists
   */
  private static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Update database with file information
   */
  private static async updateDatabase(
    options: FileOperationOptions, 
    filePath: string, 
    type: 'file' | 'directory' = 'file'
  ): Promise<void> {
    try {
      const relativePath = path.relative(
        path.join(process.env.PROJECT_PATH || '/Applications/swistack_app/repositories', options.projectId),
        filePath
      );

      // Check if file already exists in database
      const existingFile = await ProjectFileModel.findByPath(options.projectId, relativePath);
      
      if (existingFile) {
        // Update existing file
        const stats = await fs.stat(filePath);
        await ProjectFileModel.update(existingFile.id, {
          size: stats.size,
          content: type === 'file' ? options.content : undefined,
          updatedBy: options.userId,
          updatedAt: new Date(),
        });
      } else {
        // Create new file record
        const stats = await fs.stat(filePath);
        await ProjectFileModel.create({
          projectId: options.projectId,
          path: relativePath,
          name: path.basename(filePath),
          type,
          size: stats.size,
          content: type === 'file' ? options.content : undefined,
          createdBy: options.userId,
        });
      }
    } catch (error) {
      console.warn('Database update failed:', error);
      // Don't fail the operation if database update fails
    }
  }

  /**
   * Helper: Remove file from database
   */
  private static async removeFromDatabase(
    options: FileOperationOptions, 
    filePath: string
  ): Promise<void> {
    try {
      const relativePath = path.relative(
        path.join(process.env.PROJECT_PATH || '/Applications/swistack_app/repositories', options.projectId),
        filePath
      );

      await ProjectFileModel.deleteByPath(options.projectId, relativePath);
    } catch (error) {
      console.warn('Database removal failed:', error);
      // Don't fail the operation if database update fails
    }
  }

  /**
   * Helper: Update database for file move
   */
  private static async moveInDatabase(
    options: FileOperationOptions, 
    oldPath: string, 
    newPath: string
  ): Promise<void> {
    try {
      const projectBasePath = path.join(process.env.PROJECT_PATH || '/Applications/swistack_app/repositories', options.projectId);
      const oldRelativePath = path.relative(projectBasePath, oldPath);
      const newRelativePath = path.relative(projectBasePath, newPath);

      const existingFile = await ProjectFileModel.findByPath(options.projectId, oldRelativePath);
      if (existingFile) {
        await ProjectFileModel.update(existingFile.id, {
          path: newRelativePath,
          name: path.basename(newPath),
          updatedBy: options.userId,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.warn('Database move failed:', error);
      // Don't fail the operation if database update fails
    }
  }
}