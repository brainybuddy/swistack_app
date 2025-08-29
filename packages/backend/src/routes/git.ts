import { Router, Request, Response } from 'express';
import { GitService } from '../services/GitService';
import { ProjectModel } from '../models/Project';
import { authenticateToken } from '../middleware/auth';
import { gitOperationSchema, HTTP_STATUS } from '@swistack/shared';

const router = Router();

// Apply authentication to all git routes
router.use(authenticateToken);

// Get Git status for project
router.get('/projects/:projectId/status', async (req: Request, res: Response) => {
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

    const result = await GitService.getStatus(projectId);
    
    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get Git status';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Get commit history for project
router.get('/projects/:projectId/history', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
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

    const result = await GitService.getCommitHistory(projectId, limit);
    
    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get commit history';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Initialize Git repository for project
router.post('/projects/:projectId/init', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { repositoryUrl } = req.body;
    
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

    const result = await GitService.initializeRepository(projectId, repositoryUrl);
    
    if (result.success) {
      // Update project with repository URL if provided
      if (repositoryUrl) {
        await ProjectModel.updateById(projectId, { repositoryUrl });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize Git repository';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Perform Git operation
router.post('/projects/:projectId/operations', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const validatedData = gitOperationSchema.parse(req.body);
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check permissions based on operation
    const role = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!role) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    // Read-only operations allowed for viewers
    const readOnlyOperations = ['branch', 'pull'];
    if (role === 'viewer' && !readOnlyOperations.includes(validatedData.operation)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions for this Git operation',
      });
      return;
    }

    const result = await GitService.performGitOperation(projectId, validatedData);
    
    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Git operation failed';
    
    if (error && typeof error === 'object' && 'issues' in error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.issues,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

export { router as gitRouter };