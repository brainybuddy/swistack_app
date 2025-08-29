import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface ScanResult {
  isClean: boolean;
  threat?: string;
  scanTime: number;
  fileHash: string;
}

export interface ScanOptions {
  timeout?: number;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  blockedExtensions?: string[];
}

export class VirusScanService {
  private static readonly DEFAULT_OPTIONS: Required<ScanOptions> = {
    timeout: 30000, // 30 seconds
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed'
    ],
    blockedExtensions: [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe',
      '.js', '.jar', '.ws', '.wsf', '.wsc', '.wsh', '.ps1', '.ps1xml',
      '.ps2', '.ps2xml', '.psc1', '.psc2', '.msh', '.msh1', '.msh2',
      '.mshxml', '.msh1xml', '.msh2xml'
    ]
  };

  private static clamAvailable: boolean | null = null;

  /**
   * Check if ClamAV is available on the system
   */
  private static async checkClamAvailability(): Promise<boolean> {
    if (this.clamAvailable !== null) {
      return this.clamAvailable;
    }

    try {
      await this.runCommand('clamdscan', ['--version'], 5000);
      this.clamAvailable = true;
      return true;
    } catch (error) {
      try {
        await this.runCommand('clamscan', ['--version'], 5000);
        this.clamAvailable = true;
        return true;
      } catch (error2) {
        console.warn('ClamAV not found. Falling back to basic file validation.');
        this.clamAvailable = false;
        return false;
      }
    }
  }

  /**
   * Run a command with timeout
   */
  private static runCommand(command: string, args: string[], timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Calculate file hash for caching and verification
   */
  private static async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Validate file based on basic security checks
   */
  private static async validateFile(
    filePath: string, 
    mimeType: string, 
    options: Required<ScanOptions>
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > options.maxFileSize) {
        return { 
          isValid: false, 
          reason: `File size ${stats.size} exceeds maximum allowed size ${options.maxFileSize}` 
        };
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (options.blockedExtensions.includes(ext)) {
        return { 
          isValid: false, 
          reason: `File extension ${ext} is not allowed` 
        };
      }

      // Check MIME type
      if (!options.allowedMimeTypes.includes(mimeType)) {
        return { 
          isValid: false, 
          reason: `MIME type ${mimeType} is not allowed` 
        };
      }

      // Basic content validation for executable headers
      const buffer = await fs.readFile(filePath);
      const header = buffer.slice(0, 4);

      // Check for common executable headers
      const executableSignatures = [
        Buffer.from([0x4D, 0x5A]), // PE executable
        Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
        Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O executable
        Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // Mach-O executable
      ];

      for (const signature of executableSignatures) {
        if (buffer.indexOf(signature) === 0) {
          return { 
            isValid: false, 
            reason: 'File appears to be an executable' 
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        reason: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Scan file with ClamAV
   */
  private static async scanWithClamAV(filePath: string, timeout: number): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      // Try clamdscan first (daemon), fallback to clamscan
      let output: string;
      try {
        output = await this.runCommand('clamdscan', ['--no-summary', filePath], timeout);
      } catch (error) {
        output = await this.runCommand('clamscan', ['--no-summary', filePath], timeout);
      }

      const scanTime = Date.now() - startTime;
      const fileHash = await this.calculateFileHash(filePath);

      // Parse ClamAV output
      if (output.includes('FOUND')) {
        const lines = output.split('\n');
        const threatLine = lines.find(line => line.includes('FOUND'));
        const threat = threatLine ? threatLine.split(':')[1]?.trim() : 'Unknown threat';
        
        return {
          isClean: false,
          threat,
          scanTime,
          fileHash
        };
      } else {
        return {
          isClean: true,
          scanTime,
          fileHash
        };
      }
    } catch (error) {
      const scanTime = Date.now() - startTime;
      const fileHash = await this.calculateFileHash(filePath);
      
      throw new Error(`Virus scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Main virus scanning method
   */
  public static async scanFile(
    filePath: string, 
    mimeType: string, 
    options: ScanOptions = {}
  ): Promise<ScanResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    try {
      // First, validate file with basic security checks
      const validation = await this.validateFile(filePath, mimeType, mergedOptions);
      if (!validation.isValid) {
        const fileHash = await this.calculateFileHash(filePath);
        return {
          isClean: false,
          threat: validation.reason,
          scanTime: Date.now() - startTime,
          fileHash
        };
      }

      // Check if ClamAV is available
      const clamAvailable = await this.checkClamAvailability();
      
      if (clamAvailable) {
        // Scan with ClamAV
        return await this.scanWithClamAV(filePath, mergedOptions.timeout);
      } else {
        // Fallback to basic validation only
        const fileHash = await this.calculateFileHash(filePath);
        return {
          isClean: true,
          scanTime: Date.now() - startTime,
          fileHash
        };
      }
    } catch (error) {
      const fileHash = await this.calculateFileHash(filePath);
      throw new Error(`Virus scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Scan buffer content (for in-memory files)
   */
  public static async scanBuffer(
    buffer: Buffer, 
    filename: string, 
    mimeType: string, 
    options: ScanOptions = {}
  ): Promise<ScanResult> {
    // Create temporary file for scanning
    const tempDir = '/tmp';
    const tempFilename = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${filename}`;
    const tempFilePath = path.join(tempDir, tempFilename);

    try {
      // Write buffer to temporary file
      await fs.writeFile(tempFilePath, buffer);
      
      // Scan the temporary file
      const result = await this.scanFile(tempFilePath, mimeType, options);
      
      return result;
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(tempFilePath);
      } catch (error) {
        console.warn(`Failed to cleanup temporary file ${tempFilePath}:`, error);
      }
    }
  }

  /**
   * Get scan statistics
   */
  public static async getScanStats(): Promise<{
    clamAvAvailable: boolean;
    defaultTimeout: number;
    maxFileSize: number;
    allowedMimeTypes: number;
    blockedExtensions: number;
  }> {
    const clamAvAvailable = await this.checkClamAvailability();
    
    return {
      clamAvAvailable,
      defaultTimeout: this.DEFAULT_OPTIONS.timeout,
      maxFileSize: this.DEFAULT_OPTIONS.maxFileSize,
      allowedMimeTypes: this.DEFAULT_OPTIONS.allowedMimeTypes.length,
      blockedExtensions: this.DEFAULT_OPTIONS.blockedExtensions.length
    };
  }
}