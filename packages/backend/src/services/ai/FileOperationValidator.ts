import * as path from 'path';
import * as fs from 'fs/promises';
import { ProjectFileModel } from '../../models/ProjectFile';
import { ProjectModel } from '../../models/Project';

export interface FileOperationOptions {
  path: string;
  content?: string;
  projectId: string;
  userId: string;
  confirmationRequired?: boolean;
  backupBeforeWrite?: boolean;
  validateSyntax?: boolean;
  dryRun?: boolean;
  force?: boolean;
  operation: 'create' | 'write' | 'modify' | 'delete' | 'move' | 'rename';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  safePath?: string;
  requiresConfirmation?: boolean;
  backupPath?: string;
}

export interface FileOperationResult {
  success: boolean;
  message: string;
  path?: string;
  backupCreated?: boolean;
  backupPath?: string;
  dryRun?: boolean;
  warnings?: string[];
  confirmationRequired?: boolean;
}

export class FileOperationValidator {
  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.scr', '.com', '.pif'
  ];

  private static readonly ALLOWED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.css', '.scss', 
    '.less', '.html', '.htm', '.xml', '.svg', '.yaml', '.yml', '.toml',
    '.ini', '.env', '.gitignore', '.gitkeep', '.editorconfig', '.prettierrc',
    '.eslintrc', '.babelrc', '.npmrc', '.nvmrc', '.dockerignore', '.dockerfile'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly SYSTEM_PATHS = ['node_modules', '.git', '.env', 'dist', 'build'];

  /**
   * Validate file operation with comprehensive security and business logic checks
   */
  static async validateOperation(options: FileOperationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // 1. Basic path validation
      const pathValidation = await this.validatePathSecurity(options.path, options.projectId);
      if (!pathValidation.valid) {
        result.errors.push(...pathValidation.errors);
        result.valid = false;
      } else {
        result.safePath = pathValidation.safePath;
      }

      // 2. Project boundary checks
      const projectValidation = await this.validateProjectBoundaries(options.path, options.projectId, options.userId);
      if (!projectValidation.valid) {
        result.errors.push(...projectValidation.errors);
        result.valid = false;
      }

      // 3. File type and extension validation
      const typeValidation = this.validateFileType(options.path);
      if (!typeValidation.valid) {
        result.errors.push(...typeValidation.errors);
        result.warnings.push(...typeValidation.warnings);
        if (typeValidation.errors.length > 0) {
          result.valid = false;
        }
      }

      // 4. Operation-specific validation
      const operationValidation = await this.validateOperationSpecific(options);
      if (!operationValidation.valid) {
        result.errors.push(...operationValidation.errors);
        result.warnings.push(...operationValidation.warnings);
        if (operationValidation.errors.length > 0) {
          result.valid = false;
        }
      }

      // 5. Determine if confirmation is required
      result.requiresConfirmation = this.requiresConfirmation(options, result);

      // 6. Generate backup path if needed
      if (options.backupBeforeWrite && result.safePath) {
        result.backupPath = await this.generateBackupPath(result.safePath);
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate path security - prevent directory traversal and ensure project boundaries
   */
  private static async validatePathSecurity(filePath: string, projectId: string): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    try {
      // Get project path from environment or default
      const projectBasePath = process.env.PROJECT_PATH || '/Applications/swistack_app/repositories';
      const projectPath = path.join(projectBasePath, projectId);
      
      // Resolve and normalize the path
      const resolvedPath = path.resolve(projectPath, filePath);
      const normalizedProjectPath = path.resolve(projectPath);

      // Security check: ensure path is within project boundaries
      if (!resolvedPath.startsWith(normalizedProjectPath + path.sep) && resolvedPath !== normalizedProjectPath) {
        result.valid = false;
        result.errors.push('Access denied: Path outside project directory');
        return result;
      }

      // Check for dangerous path patterns
      const relativePath = path.relative(normalizedProjectPath, resolvedPath);
      if (relativePath.includes('..') || relativePath.startsWith('/')) {
        result.valid = false;
        result.errors.push('Invalid path: Contains directory traversal patterns');
        return result;
      }

      // Check for system/protected directories
      const pathParts = relativePath.split(path.sep);
      for (const systemPath of this.SYSTEM_PATHS) {
        if (pathParts.includes(systemPath)) {
          result.warnings.push(`Warning: Operating on system directory '${systemPath}'`);
        }
      }

      result.safePath = resolvedPath;
    } catch (error) {
      result.valid = false;
      result.errors.push(`Path resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate project boundaries and user permissions
   */
  private static async validateProjectBoundaries(filePath: string, projectId: string, userId: string): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    try {
      // Verify project exists and user has access
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        result.valid = false;
        result.errors.push('Project not found');
        return result;
      }

      // Check user permissions (assuming ownerId check for now)
      if (project.ownerId !== userId) {
        result.valid = false;
        result.errors.push('Access denied: Insufficient permissions for this project');
        return result;
      }

      // Additional project-specific validations can be added here
      
    } catch (error) {
      result.valid = false;
      result.errors.push(`Project validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate file type and extension
   */
  private static validateFileType(filePath: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };
    
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    // Check for dangerous file extensions
    if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
      result.valid = false;
      result.errors.push(`Dangerous file type not allowed: ${ext}`);
      return result;
    }

    // Check if extension is in allowed list (warn if not)
    if (ext && !this.ALLOWED_EXTENSIONS.includes(ext)) {
      result.warnings.push(`Uncommon file extension: ${ext}. Proceed with caution.`);
    }

    // Check for suspicious filenames
    const suspiciousPatterns = [/^\./, /\$/, /[<>:"|?*]/];
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileName)) {
        result.warnings.push(`Potentially problematic filename pattern: ${fileName}`);
        break;
      }
    }

    return result;
  }

  /**
   * Operation-specific validation
   */
  private static async validateOperationSpecific(options: FileOperationOptions): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    // Get the safe path from path validation first
    const pathValidation = await this.validatePathSecurity(options.path, options.projectId);
    if (!pathValidation.valid || !pathValidation.safePath) {
      return result; // Path validation handles errors
    }

    const safePath = pathValidation.safePath;

    try {
      const fileExists = await this.fileExists(safePath);

      switch (options.operation) {
        case 'create':
          if (fileExists) {
            result.errors.push('File already exists. Use write or modify operation instead.');
            result.valid = false;
          }
          break;

        case 'write':
        case 'modify':
          if (!fileExists) {
            result.warnings.push('File does not exist. Will create new file.');
          } else {
            result.warnings.push('File exists and will be overwritten.');
          }
          
          // Check content size
          if (options.content && Buffer.byteLength(options.content, 'utf8') > this.MAX_FILE_SIZE) {
            result.errors.push(`Content too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
            result.valid = false;
          }
          break;

        case 'delete':
          if (!fileExists) {
            result.errors.push('Cannot delete: File does not exist.');
            result.valid = false;
          } else {
            result.warnings.push('File will be permanently deleted.');
          }
          break;

        default:
          result.warnings.push(`Unrecognized operation: ${options.operation}`);
      }

    } catch (error) {
      result.warnings.push(`Could not check file existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Determine if user confirmation is required
   */
  private static requiresConfirmation(options: FileOperationOptions, validationResult: ValidationResult): boolean {
    // Always require confirmation if explicitly requested
    if (options.confirmationRequired) return true;
    
    // Skip confirmation if force flag is set
    if (options.force) return false;

    // Require confirmation for dangerous operations
    if (options.operation === 'delete') return true;
    if (validationResult.warnings.some(w => w.includes('overwritten'))) return true;
    if (validationResult.warnings.some(w => w.includes('system directory'))) return true;

    return false;
  }

  /**
   * Generate backup path for file operations
   */
  private static async generateBackupPath(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    return path.join(dir, `${base}.backup.${timestamp}${ext}`);
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
}