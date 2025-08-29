import { Router, Request, Response } from 'express';
import { InvitationService, InvitationRequest } from '../services/InvitationService';
import { ProjectModel } from '../models/Project';
import { authenticateToken } from '../middleware/auth';
import { HTTP_STATUS } from '@swistack/shared';

const router = Router();

// Apply authentication to all invitation routes
router.use(authenticateToken);

// Send invitation to join project
router.post('/projects/:projectId/invite', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const invitationRequest: InvitationRequest = req.body;

    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate request body
    if (!invitationRequest.email || !invitationRequest.role) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Email and role are required',
      });
      return;
    }

    // Validate role
    const validRoles = ['admin', 'editor', 'viewer'];
    if (!validRoles.includes(invitationRequest.role)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid role specified',
      });
      return;
    }

    const result = await InvitationService.inviteToProject(
      projectId,
      req.user.id,
      invitationRequest
    );

    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Invitation sent successfully',
        data: {
          invitation: {
            id: result.invitation!.id,
            inviteeEmail: result.invitation!.inviteeEmail,
            role: result.invitation!.role,
            status: result.invitation!.status,
            expiresAt: result.invitation!.expiresAt,
            createdAt: result.invitation!.createdAt
          }
        }
      });
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to send invitation',
    });
  }
});

// Get invitations for a project
router.get('/projects/:projectId/invitations', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if user has permission to view invitations
    const userRole = await ProjectModel.getMemberRole(projectId, req.user.id);
    if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    const invitations = await InvitationService.getProjectInvitations(projectId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        invitations: invitations.map(inv => ({
          id: inv.id,
          inviteeEmail: inv.inviteeEmail,
          role: inv.role,
          status: inv.status,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to fetch invitations',
    });
  }
});

// Cancel/revoke an invitation
router.delete('/invitations/:invitationId', async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;

    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await InvitationService.cancelInvitation(invitationId, req.user.id);

    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Invitation cancelled successfully',
      });
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to cancel invitation',
    });
  }
});

// Get user's pending invitations
router.get('/my-invitations', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const invitations = await InvitationService.getUserInvitations(req.user.email);

    // Fetch project details for each invitation
    const invitationsWithProjects = await Promise.all(
      invitations.map(async (inv) => {
        const project = await ProjectModel.findById(inv.projectId);
        return {
          id: inv.id,
          project: project ? {
            id: project.id,
            name: project.name,
            description: project.description
          } : null,
          role: inv.role,
          status: inv.status,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
          token: inv.token
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        invitations: invitationsWithProjects
      }
    });
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to fetch invitations',
    });
  }
});

// Accept invitation (public route - uses token)
router.post('/accept/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user?.id;

    const result = await InvitationService.acceptInvitation(token, userId);

    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Invitation accepted successfully',
        data: {
          projectId: result.invitation!.projectId
        }
      });
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to accept invitation',
    });
  }
});

// Decline invitation
router.post('/decline/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await InvitationService.declineInvitation(token);

    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Invitation declined',
      });
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to decline invitation',
    });
  }
});

export { router as invitationsRouter };