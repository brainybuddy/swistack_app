import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';
import { ProjectModel } from '../models/Project';
import { TemplateService } from '../services/TemplateService';
import { ProjectUpdateService } from '../services/ProjectUpdateService';
import { authenticateToken } from '../middleware/auth';
import { 
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
  updateMemberSchema,
  projectQuerySchema,
  HTTP_STATUS 
} from '@swistack/shared';

const router = Router();

// Apply authentication to all project routes
router.use(authenticateToken);

// Get all templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await TemplateService.getAll();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Get full template data via POST to avoid 431 errors
router.post('/templates/full-data', async (req: Request, res: Response) => {
  try {
    const { templateKey } = req.body;
    
    if (!templateKey) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Template key is required',
      });
      return;
    }
    
    const template = await TemplateService.getByKey(templateKey);
    
    if (!template) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: template,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch template';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Get template by key (deprecated - use POST /templates/full-data)
router.get('/templates/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const template = await TemplateService.getByKey(key);
    
    if (!template) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: template,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch template';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Create project
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const project = await ProjectService.createProject(req.user.id, validatedData);
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    
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

// Get user's projects
router.get('/my', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const validatedQuery = projectQuerySchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      template: req.query.template,
      status: req.query.status,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });

    const result = await ProjectService.getUserProjects(req.user.id, validatedQuery);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Get public projects
router.get('/public', async (req: Request, res: Response) => {
  try {
    const validatedQuery = projectQuerySchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      template: req.query.template,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });

    const result = await ProjectService.getPublicProjects(validatedQuery);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch public projects';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Get project by ID or slug
router.get('/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const userId = req.user?.id;
    
    // Try to get by ID first, then by slug
    let project = await ProjectService.getProject(identifier, userId);
    if (!project) {
      project = await ProjectService.getProjectBySlug(identifier, userId);
    }
    
    if (!project) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch project';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const project = await ProjectService.updateProject(id, req.user.id, validatedData);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    
    if (message.includes('permissions')) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: message,
      });
    } else if (message.includes('not found')) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: message,
      });
    } else if (error && typeof error === 'object' && 'issues' in error) {
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

// Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    await ProjectService.deleteProject(id, req.user.id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete project';
    
    if (message.includes('Only project owners')) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: message,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

// Duplicate project
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const project = await ProjectService.duplicateProject(id, req.user.id, name);
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Project duplicated successfully',
      data: { project },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to duplicate project';
    
    if (message.includes('not found') || message.includes('access denied')) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: message,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

// Get project members
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const members = await ProjectService.getProjectMembers(id, req.user.id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { members },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch project members';
    
    if (message.includes('Access denied')) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: message,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

// Invite member
router.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = inviteMemberSchema.parse(req.body);
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    await ProjectService.inviteMember(id, req.user.id, validatedData.email, validatedData.role);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Member invitation sent successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to invite member';
    
    if (message.includes('permissions')) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: message,
      });
    } else if (error && typeof error === 'object' && 'issues' in error) {
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

// Update member role
router.put('/:id/members/:userId', async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;
    const validatedData = updateMemberSchema.parse(req.body);
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    await ProjectService.updateMemberRole(id, req.user.id, userId, validatedData.role);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Member role updated successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update member role';
    
    if (message.includes('Only project owners')) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: message,
      });
    } else if (error && typeof error === 'object' && 'issues' in error) {
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

// Remove member
router.delete('/:id/members/:userId', async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;
    
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    await ProjectService.removeMember(id, req.user.id, userId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove member';
    
    if (message.includes('permissions')) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: message,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

// Get project activity/updates
router.get('/:id/updates', async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { limit = '50' } = req.query;

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

    const updates = await ProjectUpdateService.getRecentUpdates(projectId, parseInt(limit as string));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { updates }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get project updates';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

export { router as projectsRouter };