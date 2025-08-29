import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { autoSaveService } from '../services/AutoSaveService';
import { AutoSaveOptions } from '@swistack/shared';

const router = express.Router();

// Schedule auto-save for a file
router.post('/schedule', authenticateToken, (req: Request, res: Response) => {
  try {
    const { filePath, content, options } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({
        success: false,
        error: 'File path and content are required'
      });
    }

    const autoSaveOptions: AutoSaveOptions = {
      enabled: options?.enabled ?? true,
      delay: options?.delay ?? 2000,
      conflictResolution: options?.conflictResolution ?? 'manual'
    };

    autoSaveService.scheduleAutoSave(filePath, content, autoSaveOptions);

    res.json({
      success: true,
      data: {
        scheduled: true,
        filePath,
        delay: autoSaveOptions.delay
      }
    });
  } catch (error) {
    console.error('Error scheduling auto-save:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule auto-save'
    });
  }
});

// Force save a file immediately
router.post('/force-save', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { filePath, content, options } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({
        success: false,
        error: 'File path and content are required'
      });
    }

    const autoSaveOptions: AutoSaveOptions = {
      enabled: true,
      delay: 0,
      conflictResolution: options?.conflictResolution ?? 'overwrite'
    };

    const result = await autoSaveService.forceSave(filePath, content, autoSaveOptions);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    console.error('Error force saving file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force save file'
    });
  }
});

// Get file state and pending saves
router.get('/status/:projectId', authenticateToken, (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const pendingSaves = autoSaveService.getPendingSaves();
    const unsavedFiles = autoSaveService.getFilesWithUnsavedChanges();

    // Filter by project (in a real implementation, you'd validate project access)
    const projectPrefix = `/projects/${projectId}/`;
    const projectPendingSaves = pendingSaves.filter(path => path.startsWith(projectPrefix));
    const projectUnsavedFiles = unsavedFiles.filter(path => path.startsWith(projectPrefix));

    res.json({
      success: true,
      data: {
        pendingSaves: projectPendingSaves,
        unsavedFiles: projectUnsavedFiles,
        totalPending: projectPendingSaves.length,
        totalUnsaved: projectUnsavedFiles.length
      }
    });
  } catch (error) {
    console.error('Error getting auto-save status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto-save status'
    });
  }
});

// Get specific file state
router.get('/file-state', authenticateToken, (req: Request, res: Response) => {
  try {
    const { filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    const fileState = autoSaveService.getFileState(filePath);
    const hasUnsavedChanges = autoSaveService.hasUnsavedChanges(filePath);

    res.json({
      success: true,
      data: {
        exists: !!fileState,
        hasUnsavedChanges,
        lastModified: fileState?.lastModified,
        contentHash: fileState?.hash,
        savedHash: fileState?.savedHash
      }
    });
  } catch (error) {
    console.error('Error getting file state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file state'
    });
  }
});

// Resolve a conflict manually
router.post('/resolve-conflict', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { filePath, resolvedContent, resolution } = req.body;

    if (!filePath || resolvedContent === undefined || !resolution) {
      return res.status(400).json({
        success: false,
        error: 'File path, resolved content, and resolution type are required'
      });
    }

    if (!['local', 'remote', 'merged'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: 'Resolution must be one of: local, remote, merged'
      });
    }

    const result = await autoSaveService.resolveConflict(filePath, resolvedContent, resolution);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve conflict'
    });
  }
});

// Clear file state (when file is closed)
router.delete('/file-state', authenticateToken, (req: Request, res: Response) => {
  try {
    const { filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    autoSaveService.clearFileState(filePath);

    res.json({
      success: true,
      data: {
        cleared: true,
        filePath
      }
    });
  } catch (error) {
    console.error('Error clearing file state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear file state'
    });
  }
});

// Cancel all pending saves for a project
router.post('/cancel-all/:projectId', authenticateToken, (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    // In a real implementation, you'd filter by project and user permissions
    autoSaveService.cancelAllSaves();

    res.json({
      success: true,
      data: {
        cancelled: true,
        projectId
      }
    });
  } catch (error) {
    console.error('Error cancelling saves:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel saves'
    });
  }
});

// Get auto-save configuration
router.get('/config', authenticateToken, (req: Request, res: Response) => {
  try {
    const defaultConfig: AutoSaveOptions = {
      enabled: true,
      delay: 2000,
      conflictResolution: 'manual'
    };

    res.json({
      success: true,
      data: defaultConfig
    });
  } catch (error) {
    console.error('Error getting auto-save config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto-save configuration'
    });
  }
});

// Update auto-save configuration
router.put('/config', authenticateToken, (req: Request, res: Response) => {
  try {
    const { enabled, delay, conflictResolution } = req.body;

    // Validate configuration
    const config: AutoSaveOptions = {
      enabled: typeof enabled === 'boolean' ? enabled : true,
      delay: typeof delay === 'number' && delay >= 500 ? delay : 2000,
      conflictResolution: ['manual', 'overwrite', 'merge'].includes(conflictResolution) ? conflictResolution : 'manual'
    };

    // In a real implementation, you'd save this to user preferences
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error updating auto-save config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update auto-save configuration'
    });
  }
});

export default router;