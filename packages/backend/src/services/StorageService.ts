import * as Minio from 'minio';
import { Readable } from 'stream';
import path from 'path';
import mime from 'mime-types';
import { db } from '../config/database';

export class StorageService {
  public client: Minio.Client;
  public bucketName: string = 'swistack-projects';

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    this.client = new Minio.Client({
      endPoint: endpoint.split(':')[0],
      port: parseInt(endpoint.split(':')[1] || (useSSL ? '443' : '9000')),
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Create bucket if it doesn't exist
      const bucketExists = await this.client.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        
        // Set bucket policy for project files
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/public/*`],
            },
          ],
        };
        
        await this.client.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      }
    } catch (error) {
      console.error('Failed to initialize MinIO storage:', error);
      throw error;
    }
  }

  // Upload file
  async uploadFile(
    projectId: string,
    filePath: string,
    content: Buffer | string | Readable,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const objectKey = this.getObjectKey(projectId, filePath);
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      
      // Calculate file size
      let size: number;
      let stream: Readable;

      if (Buffer.isBuffer(content)) {
        size = content.length;
        stream = Readable.from(content);
      } else if (typeof content === 'string') {
        const buffer = Buffer.from(content, 'utf8');
        size = buffer.length;
        stream = Readable.from(buffer);
      } else {
        // For Readable streams, we need to estimate size or buffer
        throw new Error('Readable streams not supported for quota enforcement. Use Buffer or string.');
      }

      // Check storage quota before upload
      await this.checkStorageQuota(projectId, size, filePath);
      
      const metaData = {
        'Content-Type': mimeType,
        'X-Project-ID': projectId,
        'X-File-Path': filePath,
        ...metadata,
      };

      // Upload the file
      await this.client.putObject(this.bucketName, objectKey, stream, size, metaData);
      
      // Update project storage usage
      await this.updateProjectStorageUsage(projectId, size);
      
      return objectKey;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'}`);
    }
  }

  // Download file
  async downloadFile(objectKey: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.bucketName, objectKey);
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'}`);
    }
  }

  // Get file stream
  async getFileStream(objectKey: string): Promise<Readable> {
    try {
      return await this.client.getObject(this.bucketName, objectKey);
    } catch (error) {
      console.error('Failed to get file stream:', error);
      throw new Error(`Failed to get file stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete file
  async deleteFile(objectKey: string, projectId?: string): Promise<void> {
    try {
      // Get file size before deletion if projectId is provided
      let fileSize = 0;
      if (projectId) {
        try {
          const stat = await this.client.statObject(this.bucketName, objectKey);
          fileSize = stat.size;
        } catch {
          // File doesn't exist or can't get size, continue with deletion
        }
      }
      
      await this.client.removeObject(this.bucketName, objectKey);
      
      // Update project storage usage
      if (projectId && fileSize > 0) {
        await this.updateProjectStorageUsage(projectId, -fileSize);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete all files in a project
  async deleteProjectFiles(projectId: string): Promise<void> {
    try {
      const prefix = `projects/${projectId}/`;
      const objectsList: string[] = [];
      let totalSize = 0;
      
      const stream = this.client.listObjectsV2(this.bucketName, prefix, true);
      
      for await (const obj of stream) {
        if (obj.name) {
          objectsList.push(obj.name);
          if (obj.size !== undefined) {
            totalSize += obj.size;
          }
        }
      }
      
      if (objectsList.length > 0) {
        await this.client.removeObjects(this.bucketName, objectsList);
        
        // Reset project storage usage to 0
        await db('projects')
          .where('id', projectId)
          .update('storageUsed', 0);
      }
    } catch (error) {
      console.error('Failed to delete project files:', error);
      throw new Error(`Failed to delete project files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get presigned URL for upload
  async getUploadUrl(
    projectId: string,
    filePath: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    try {
      const objectKey = this.getObjectKey(projectId, filePath);
      return await this.client.presignedPutObject(this.bucketName, objectKey, expirySeconds);
    } catch (error) {
      console.error('Failed to get upload URL:', error);
      throw new Error(`Failed to get upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get presigned URL for download
  async getDownloadUrl(
    objectKey: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    try {
      return await this.client.presignedGetObject(this.bucketName, objectKey, expirySeconds);
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw new Error(`Failed to get download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get file metadata
  async getFileMetadata(objectKey: string): Promise<any> {
    try {
      return await this.client.statObject(this.bucketName, objectKey);
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // List project files
  async listProjectFiles(projectId: string): Promise<Array<{ name: string; size: number; lastModified: Date }>> {
    try {
      const prefix = `projects/${projectId}/`;
      const files: Array<{ name: string; size: number; lastModified: Date }> = [];
      
      const stream = this.client.listObjectsV2(this.bucketName, prefix, true);
      
      for await (const obj of stream) {
        if (obj.name && obj.size !== undefined && obj.lastModified) {
          files.push({
            name: obj.name.replace(prefix, ''),
            size: obj.size,
            lastModified: obj.lastModified,
          });
        }
      }
      
      return files;
    } catch (error) {
      console.error('Failed to list project files:', error);
      throw new Error(`Failed to list project files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Copy file
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const copyConditions = new (require('minio').CopyConditions)();
      await this.client.copyObject(
        this.bucketName,
        destinationKey,
        `/${this.bucketName}/${sourceKey}`,
        copyConditions
      );
    } catch (error) {
      console.error('Failed to copy file:', error);
      throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Move file
  async moveFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await this.copyFile(sourceKey, destinationKey);
      await this.deleteFile(sourceKey);
    } catch (error) {
      console.error('Failed to move file:', error);
      throw new Error(`Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper to generate object key
  private getObjectKey(projectId: string, filePath: string): string {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `projects/${projectId}/${cleanPath}`;
  }

  // Get storage usage for a project from database (faster than MinIO scan)
  async getProjectStorageUsage(projectId: string): Promise<number> {
    try {
      const result = await db('projects')
        .select('storageUsed')
        .where('id', projectId)
        .first();
        
      return result?.storageUsed || 0;
    } catch (error) {
      console.error('Failed to get project storage usage:', error);
      throw new Error(`Failed to get project storage usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get actual storage usage from MinIO (for verification/sync)
  async getActualProjectStorageUsage(projectId: string): Promise<number> {
    try {
      const prefix = `projects/${projectId}/`;
      let totalSize = 0;
      
      const stream = this.client.listObjectsV2(this.bucketName, prefix, true);
      
      for await (const obj of stream) {
        if (obj.size !== undefined) {
          totalSize += obj.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate actual project storage usage:', error);
      throw new Error(`Failed to calculate actual project storage usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check storage quota before upload
  private async checkStorageQuota(projectId: string, additionalSize: number, filePath?: string): Promise<void> {
    try {
      const project = await db('projects')
        .select('storageUsed', 'storageLimit', 'name')
        .where('id', projectId)
        .first();
        
      if (!project) {
        throw new Error('Project not found');
      }

      // Check if file already exists (for updates)
      let existingFileSize = 0;
      if (filePath) {
        try {
          const objectKey = this.getObjectKey(projectId, filePath);
          const stat = await this.client.statObject(this.bucketName, objectKey);
          existingFileSize = stat.size;
        } catch {
          // File doesn't exist, that's fine
        }
      }

      const currentUsage = project.storageUsed;
      const storageLimit = project.storageLimit;
      const netAdditionalSize = additionalSize - existingFileSize;
      const projectedUsage = currentUsage + netAdditionalSize;

      if (projectedUsage > storageLimit) {
        const usageInMB = Math.round(projectedUsage / (1024 * 1024) * 100) / 100;
        const limitInMB = Math.round(storageLimit / (1024 * 1024) * 100) / 100;
        const additionalInMB = Math.round(netAdditionalSize / (1024 * 1024) * 100) / 100;
        
        throw new Error(
          `Storage quota exceeded. ` +
          `Adding ${additionalInMB}MB would result in ${usageInMB}MB usage, ` +
          `exceeding the ${limitInMB}MB limit for project "${project.name}".`
        );
      }
    } catch (error) {
      if ((error instanceof Error ? error.message : 'Unknown error').includes('Storage quota exceeded')) {
        throw error;
      }
      console.error('Failed to check storage quota:', error);
      throw new Error(`Failed to check storage quota: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update project storage usage in database
  private async updateProjectStorageUsage(projectId: string, additionalSize: number): Promise<void> {
    try {
      await db('projects')
        .where('id', projectId)
        .increment('storageUsed', additionalSize);
    } catch (error) {
      console.error('Failed to update project storage usage:', error);
      // Don't throw here as the file was already uploaded successfully
    }
  }

  // Sync storage usage from MinIO to database (for maintenance)
  async syncProjectStorageUsage(projectId: string): Promise<void> {
    try {
      const actualUsage = await this.getActualProjectStorageUsage(projectId);
      
      await db('projects')
        .where('id', projectId)
        .update('storageUsed', actualUsage);
        
      console.log(`Synced storage usage for project ${projectId}: ${actualUsage} bytes`);
    } catch (error) {
      console.error('Failed to sync project storage usage:', error);
      throw new Error(`Failed to sync project storage usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get project storage info
  async getProjectStorageInfo(projectId: string): Promise<{
    used: number;
    limit: number;
    available: number;
    usagePercentage: number;
  }> {
    try {
      const project = await db('projects')
        .select('storageUsed', 'storageLimit')
        .where('id', projectId)
        .first();
        
      if (!project) {
        throw new Error('Project not found');
      }

      const used = project.storageUsed;
      const limit = project.storageLimit;
      const available = Math.max(0, limit - used);
      const usagePercentage = Math.round((used / limit) * 100 * 100) / 100;

      return {
        used,
        limit,
        available,
        usagePercentage
      };
    } catch (error) {
      console.error('Failed to get project storage info:', error);
      throw new Error(`Failed to get project storage info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const storageService = new StorageService();