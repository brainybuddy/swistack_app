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

export interface ScanStats {
  clamAvAvailable: boolean;
  defaultTimeout: number;
  maxFileSize: number;
  allowedMimeTypes: number;
  blockedExtensions: number;
}

export interface VirusScanResponse {
  success: boolean;
  data?: {
    scanStats: ScanStats;
    message: string;
  };
  error?: string;
}

export interface FileUploadError {
  success: false;
  error: string;
  code: 'VIRUS_DETECTED' | 'SCAN_ERROR' | 'FILE_TOO_LARGE' | 'INVALID_TYPE';
}

export const SCAN_ERROR_CODES = {
  VIRUS_DETECTED: 'VIRUS_DETECTED',
  SCAN_ERROR: 'SCAN_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_TYPE: 'INVALID_TYPE'
} as const;

export type ScanErrorCode = typeof SCAN_ERROR_CODES[keyof typeof SCAN_ERROR_CODES];