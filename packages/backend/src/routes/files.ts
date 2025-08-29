import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ProjectFileModel } from '../models/ProjectFile';
import { ProjectModel } from '../models/Project';
import { storageService } from '../services/StorageService';
import { VirusScanService } from '../services/VirusScanService';
import { ProjectUpdateService } from '../services/ProjectUpdateService';
import { authenticateToken } from '../middleware/auth';
import { 
  fileUploadSchema,
  HTTP_STATUS,
  validateFilePath 
} from '@swistack/shared';
import path from 'path';
import mime from 'mime-types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});

// Apply authentication to all file routes
router.use(authenticateToken);

// Get project file tree
router.get('/projects/:projectId/tree', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if user has access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const files = await ProjectFileModel.getProjectTree(projectId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { files },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch file tree';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Get file content
router.get('/projects/:projectId/files/*', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const filePath = req.params[0]; // Everything after /files/
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if user has access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const file = await ProjectFileModel.findByPath(projectId, filePath);
    if (!file) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'File not found',
      });
      return;
    }

    let content: string | Buffer;
    
    if (file.content) {
      // File content is stored in database
      content = file.content;
    } else if (file.storageKey) {
      // File content is stored in MinIO
      content = await storageService.downloadFile(file.storageKey);
      
      if (file.isBinary) {
        // Return binary file as download
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.send(content);
        return;
      }
      
      content = content.toString(file.encoding as BufferEncoding);
    } else {
      content = '';
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { 
        file: {
          ...file,
          content: content.toString()
        }
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch file';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Create or update file
router.put('/projects/:projectId/files/*', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const filePath = req.params[0];
    const { content, encoding = 'utf8' } = req.body;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate file path
    if (!validateFilePath(filePath)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid file path',
      });
      return;
    }

    // Check if user has write access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role || role === 'viewer') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);
    const mimeType = mime.lookup(fileName) || 'text/plain';
    const size = content ? Buffer.byteLength(content, encoding) : 0;
    
    // Scan content for viruses if it's substantial content
    if (content && content.length > 0) {
      try {
        console.log(`🔍 Scanning file content ${fileName} for viruses...`);
        const scanResult = await VirusScanService.scanBuffer(
          Buffer.from(content, encoding as BufferEncoding), 
          fileName, 
          mimeType
        );
        
        if (!scanResult.isClean) {
          console.warn(`🚨 Virus detected in file content ${fileName}: ${scanResult.threat}`);
          res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: `File save rejected: ${scanResult.threat}`,
            code: 'VIRUS_DETECTED'
          });
          return;
        }
        
        console.log(`✅ File content ${fileName} passed virus scan in ${scanResult.scanTime}ms`);
      } catch (scanError) {
        console.error(`❌ Virus scan failed for file content ${fileName}:`, scanError);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: 'File security scan failed. Please try again.',
          code: 'SCAN_ERROR'
        });
        return;
      }
    }
    
    // Check if file exists
    let file = await ProjectFileModel.findByPath(projectId, filePath);
    const isNewFile = !file;
    
    if (file) {
      // Update existing file
      let storageKey = file.storageKey;
      let fileContent = content;
      
      // If file is large, store in MinIO
      if (content && content.length > 1024 * 10) { // 10KB threshold
        storageKey = await storageService.uploadFile(projectId, filePath, content);
        fileContent = undefined;
      } else if (file.storageKey && content && content.length <= 1024 * 10) {
        // File was in storage but is now small enough for database
        await storageService.deleteFile(file.storageKey, projectId);
        storageKey = undefined;
        fileContent = content;
      }
      
      file = await ProjectFileModel.updateById(
        file.id,
        {
          content: fileContent,
          size,
          storageKey,
          mimeType,
          encoding,
          updatedBy: req.user.id,
        },
        req.user.id
      );
    } else {
      // Create new file
      let parentId: string | null = null;
      
      // Find or create parent directory
      if (dirPath && dirPath !== '.' && dirPath !== '/') {
        let parentDir = await ProjectFileModel.findByPath(projectId, dirPath);
        if (!parentDir) {
          parentDir = await ProjectFileModel.createDirectory(
            projectId,
            dirPath,
            null,
            req.user.id
          );
        }
        parentId = parentDir.id;
      }
      
      let storageKey: string | undefined;
      let fileContent = content;
      
      // If file is large, store in MinIO
      if (content && content.length > 1024 * 10) { // 10KB threshold
        storageKey = await storageService.uploadFile(projectId, filePath, content);
        fileContent = undefined;
      }
      
      file = await ProjectFileModel.create({
        projectId,
        path: filePath,
        name: fileName,
        type: 'file',
        mimeType,
        size,
        storageKey,
        content: fileContent,
        encoding,
        isBinary: false,
        parentId: parentId || undefined,
        createdBy: req.user.id,
      });
    }
    
    // Emit real-time update
    if (isNewFile) {
      ProjectUpdateService.emitFileCreated(projectId, req.user.id, fileName, filePath);
    } else {
      ProjectUpdateService.emitFileUpdated(projectId, req.user.id, fileName, filePath);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'File saved successfully',
      data: { file },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save file';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Upload binary file
router.post('/projects/:projectId/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { path: filePath } = req.body;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'No file provided',
      });
      return;
    }

    // Validate file path
    if (!validateFilePath(filePath)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid file path',
      });
      return;
    }

    // Check if user has write access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role || role === 'viewer') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);
    
    // Scan uploaded file for viruses
    try {
      console.log(`🔍 Scanning file ${fileName} for viruses...`);
      const scanResult = await VirusScanService.scanBuffer(
        req.file.buffer, 
        fileName, 
        req.file.mimetype
      );
      
      if (!scanResult.isClean) {
        console.warn(`🚨 Virus detected in file ${fileName}: ${scanResult.threat}`);
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: `File upload rejected: ${scanResult.threat}`,
          code: 'VIRUS_DETECTED'
        });
        return;
      }
      
      console.log(`✅ File ${fileName} passed virus scan in ${scanResult.scanTime}ms`);
    } catch (scanError) {
      console.error(`❌ Virus scan failed for file ${fileName}:`, scanError);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'File security scan failed. Please try again.',
        code: 'SCAN_ERROR'
      });
      return;
    }
    
    // Upload file to MinIO
    const storageKey = await storageService.uploadFile(
      projectId,
      filePath,
      req.file.buffer,
      {
        'Original-Name': req.file.originalname,
        'Upload-User': req.user.id,
      }
    );
    
    // Find or create parent directory
    let parentId: string | null = null;
    if (dirPath && dirPath !== '.' && dirPath !== '/') {
      let parentDir = await ProjectFileModel.findByPath(projectId, dirPath);
      if (!parentDir) {
        parentDir = await ProjectFileModel.createDirectory(
          projectId,
          dirPath,
          null,
          req.user.id
        );
      }
      parentId = parentDir.id;
    }
    
    // Create file record
    const file = await ProjectFileModel.create({
      projectId,
      path: filePath,
      name: fileName,
      type: 'file',
      mimeType: req.file.mimetype,
      size: req.file.size,
      storageKey,
      isBinary: true,
      parentId: parentId || undefined,
      createdBy: req.user.id,
    });
    
    // Emit real-time update
    ProjectUpdateService.emitFileCreated(projectId, req.user.id, fileName, filePath);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Delete file or directory
router.delete('/projects/:projectId/files/*', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const filePath = req.params[0];
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if user has write access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role || role === 'viewer') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    const file = await ProjectFileModel.findByPath(projectId, filePath);
    if (!file) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'File not found',
      });
      return;
    }

    // If file has storage key, delete from MinIO
    if (file.storageKey) {
      try {
        await storageService.deleteFile(file.storageKey, projectId);
      } catch (error) {
        console.error('Failed to delete file from storage:', error);
      }
    }

    // If it's a directory, check if it has children
    if (file.type === 'directory') {
      const hasChildren = await ProjectFileModel.hasChildren(file.id);
      if (hasChildren) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Directory is not empty',
        });
        return;
      }
    }

    await ProjectFileModel.deleteById(file.id);
    
    // Emit real-time update
    ProjectUpdateService.emitFileDeleted(projectId, req.user.id, file.name, file.path);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete file';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Move/rename file
router.post('/projects/:projectId/files/*/move', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const sourcePath = req.params[0];
    const { destinationPath } = req.body;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate paths
    if (!validateFilePath(sourcePath) || !validateFilePath(destinationPath)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid file path',
      });
      return;
    }

    // Check if user has write access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role || role === 'viewer') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    const file = await ProjectFileModel.findByPath(projectId, sourcePath);
    if (!file) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Source file not found',
      });
      return;
    }

    // Check if destination already exists
    const existing = await ProjectFileModel.findByPath(projectId, destinationPath);
    if (existing) {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: 'Destination already exists',
      });
      return;
    }

    // Find new parent directory
    const newDirPath = path.dirname(destinationPath);
    let newParentId: string | null = null;
    
    if (newDirPath && newDirPath !== '.' && newDirPath !== '/') {
      const parentDir = await ProjectFileModel.findByPath(projectId, newDirPath);
      if (!parentDir) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Destination directory does not exist',
        });
        return;
      }
      newParentId = parentDir.id;
    }

    // Move file in storage if it has a storage key
    if (file.storageKey) {
      const newStorageKey = await storageService.uploadFile(
        projectId,
        destinationPath,
        await storageService.downloadFile(file.storageKey)
      );
      
      await storageService.deleteFile(file.storageKey, projectId);
      
      await ProjectFileModel.updateById(
        file.id,
        { storageKey: newStorageKey },
        req.user.id
      );
    }

    // Update file record
    const updatedFile = await ProjectFileModel.moveFile(
      file.id,
      destinationPath,
      newParentId || undefined
    );
    
    // Emit real-time update
    ProjectUpdateService.emitFileRenamed(projectId, req.user.id, sourcePath, destinationPath);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'File moved successfully',
      data: { file: updatedFile },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move file';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Create directory
router.post('/projects/:projectId/directories', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { path: dirPath } = req.body;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate path
    if (!validateFilePath(dirPath)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid directory path',
      });
      return;
    }

    // Check if user has write access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role || role === 'viewer') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    // Check if directory already exists
    const existing = await ProjectFileModel.findByPath(projectId, dirPath);
    if (existing) {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: 'Directory already exists',
      });
      return;
    }

    // Find parent directory
    const parentPath = path.dirname(dirPath);
    let parentId: string | null = null;
    
    if (parentPath && parentPath !== '.' && parentPath !== '/') {
      const parentDir = await ProjectFileModel.findByPath(projectId, parentPath);
      if (!parentDir) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Parent directory does not exist',
        });
        return;
      }
      parentId = parentDir.id;
    }

    const directory = await ProjectFileModel.createDirectory(
      projectId,
      dirPath,
      parentId,
      req.user.id
    );
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Directory created successfully',
      data: { directory },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create directory';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Search files
router.get('/projects/:projectId/search', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { q: searchTerm, limit = '50' } = req.query;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!searchTerm || typeof searchTerm !== 'string') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Search term is required',
      });
      return;
    }

    // Check if user has access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const files = await ProjectFileModel.searchFiles(
      projectId,
      searchTerm,
      parseInt(limit as string)
    );
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { files },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search files';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Get project storage info
router.get('/projects/:projectId/storage', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if user has access to project
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const storageInfo = await storageService.getProjectStorageInfo(projectId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { storage: storageInfo },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get storage info';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Get virus scan status and statistics
router.get('/scan/status', async (req: Request, res: Response) => {
  try {
    const stats = await VirusScanService.getScanStats();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        scanStats: stats,
        message: stats.clamAvAvailable 
          ? 'ClamAV virus scanning is active'
          : 'Basic file validation active (ClamAV not available)'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get scan status';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

export { router as filesRouter };