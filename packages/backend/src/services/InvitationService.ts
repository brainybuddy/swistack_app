import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { EmailService } from './EmailService';
import { UserModel } from '../models/User';
import { ProjectModel } from '../models/Project';

export interface ProjectInvitation {
  id: string;
  projectId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  collaborationRole: 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter';
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface InvitationRequest {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  collaborationRole?: 'admin' | 'editor' | 'viewer' | 'commenter';
  message?: string;
}

export interface InvitationResponse {
  success: boolean;
  invitation?: ProjectInvitation;
  error?: string;
}

export class InvitationService {
  
  /**
   * Create and send a project invitation
   */
  static async inviteToProject(
    projectId: string,
    inviterUserId: string,
    request: InvitationRequest
  ): Promise<InvitationResponse> {
    try {
      // Validate project and permissions
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Check if inviter has permission to invite
      const inviterRole = await ProjectModel.getMemberRole(projectId, inviterUserId);
      if (!inviterRole || (inviterRole !== 'owner' && inviterRole !== 'admin')) {
        return { success: false, error: 'Insufficient permissions to invite members' };
      }

      // Check if user is already a member
      const existingUser = await UserModel.findByEmail(request.email);
      if (existingUser) {
        const existingMember = await ProjectModel.getMemberRole(projectId, existingUser.id);
        if (existingMember) {
          return { success: false, error: 'User is already a member of this project' };
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await this.findPendingInvitation(projectId, request.email);
      if (existingInvitation) {
        return { success: false, error: 'Invitation already sent to this email' };
      }

      // Create invitation
      const invitation: ProjectInvitation = {
        id: uuidv4(),
        projectId,
        inviterUserId,
        inviteeEmail: request.email,
        role: request.role,
        collaborationRole: request.collaborationRole || request.role,
        token: this.generateInvitationToken(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date()
      };

      // Save to database
      await db('project_invitations').insert({
        id: invitation.id,
        project_id: invitation.projectId,
        inviter_user_id: invitation.inviterUserId,
        invitee_email: invitation.inviteeEmail,
        role: invitation.role,
        collaboration_role: invitation.collaborationRole,
        token: invitation.token,
        status: invitation.status,
        expires_at: invitation.expiresAt,
        created_at: invitation.createdAt
      });

      // Send invitation email
      await this.sendInvitationEmail(invitation, project, request.message);

      return { success: true, invitation };
    } catch (error) {
      console.error('Failed to create invitation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send invitation' 
      };
    }
  }

  /**
   * Accept a project invitation
   */
  static async acceptInvitation(token: string, userId?: string): Promise<InvitationResponse> {
    try {
      const invitation = await this.findByToken(token);
      if (!invitation) {
        return { success: false, error: 'Invalid invitation token' };
      }

      if (invitation.status !== 'pending') {
        return { success: false, error: 'Invitation has already been processed' };
      }

      if (new Date() > invitation.expiresAt) {
        await this.updateStatus(invitation.id, 'expired');
        return { success: false, error: 'Invitation has expired' };
      }

      // If userId is provided, verify it matches the invitation email
      if (userId) {
        const user = await UserModel.findById(userId);
        if (!user || user.email !== invitation.inviteeEmail) {
          return { success: false, error: 'User email does not match invitation' };
        }
      } else {
        // Find user by email
        const user = await UserModel.findByEmail(invitation.inviteeEmail);
        if (!user) {
          return { success: false, error: 'User not found. Please register first.' };
        }
        userId = user.id;
      }

      // Add user to project
      await ProjectModel.addMember({
        projectId: invitation.projectId,
        userId: userId,
        role: invitation.role as 'editor' | 'viewer',
        invitedBy: invitation.inviterUserId
      });

      // Update invitation status
      await this.updateStatus(invitation.id, 'accepted', new Date());

      return { success: true, invitation };
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to accept invitation' 
      };
    }
  }

  /**
   * Decline a project invitation
   */
  static async declineInvitation(token: string): Promise<InvitationResponse> {
    try {
      const invitation = await this.findByToken(token);
      if (!invitation) {
        return { success: false, error: 'Invalid invitation token' };
      }

      if (invitation.status !== 'pending') {
        return { success: false, error: 'Invitation has already been processed' };
      }

      await this.updateStatus(invitation.id, 'declined');
      return { success: true, invitation };
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to decline invitation' 
      };
    }
  }

  /**
   * Get pending invitations for a project
   */
  static async getProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
    try {
      const invitations = await db('project_invitations')
        .where('project_id', projectId)
        .where('status', 'pending')
        .where('expires_at', '>', new Date())
        .orderBy('created_at', 'desc');

      return invitations.map(this.mapDatabaseToInvitation);
    } catch (error) {
      console.error('Failed to fetch project invitations:', error);
      return [];
    }
  }

  /**
   * Get pending invitations for a user by email
   */
  static async getUserInvitations(email: string): Promise<ProjectInvitation[]> {
    try {
      const invitations = await db('project_invitations')
        .where('invitee_email', email)
        .where('status', 'pending')
        .where('expires_at', '>', new Date())
        .orderBy('created_at', 'desc');

      return invitations.map(this.mapDatabaseToInvitation);
    } catch (error) {
      console.error('Failed to fetch user invitations:', error);
      return [];
    }
  }

  /**
   * Cancel/revoke an invitation
   */
  static async cancelInvitation(invitationId: string, userId: string): Promise<InvitationResponse> {
    try {
      const invitation = await this.findById(invitationId);
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      // Check permissions
      const userRole = await ProjectModel.getMemberRole(invitation.projectId, userId);
      if (!userRole || (userRole !== 'owner' && userRole !== 'admin' && invitation.inviterUserId !== userId)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      await db('project_invitations')
        .where('id', invitationId)
        .update({ status: 'declined' });

      return { success: true };
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel invitation' 
      };
    }
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpiredInvitations(): Promise<number> {
    try {
      const result = await db('project_invitations')
        .where('status', 'pending')
        .where('expires_at', '<', new Date())
        .update({ status: 'expired' });

      return result;
    } catch (error) {
      console.error('Failed to cleanup expired invitations:', error);
      return 0;
    }
  }

  // Private helper methods

  private static generateInvitationToken(): string {
    return uuidv4().replace(/-/g, '');
  }

  private static async findPendingInvitation(
    projectId: string, 
    email: string
  ): Promise<ProjectInvitation | null> {
    try {
      const invitation = await db('project_invitations')
        .where('project_id', projectId)
        .where('invitee_email', email)
        .where('status', 'pending')
        .where('expires_at', '>', new Date())
        .first();

      return invitation ? this.mapDatabaseToInvitation(invitation) : null;
    } catch (error) {
      return null;
    }
  }

  private static async findByToken(token: string): Promise<ProjectInvitation | null> {
    try {
      const invitation = await db('project_invitations')
        .where('token', token)
        .first();

      return invitation ? this.mapDatabaseToInvitation(invitation) : null;
    } catch (error) {
      return null;
    }
  }

  private static async findById(id: string): Promise<ProjectInvitation | null> {
    try {
      const invitation = await db('project_invitations')
        .where('id', id)
        .first();

      return invitation ? this.mapDatabaseToInvitation(invitation) : null;
    } catch (error) {
      return null;
    }
  }

  private static async updateStatus(
    id: string, 
    status: 'accepted' | 'declined' | 'expired',
    acceptedAt?: Date
  ): Promise<void> {
    const updateData: any = { status };
    if (acceptedAt) {
      updateData.accepted_at = acceptedAt;
    }

    await db('project_invitations')
      .where('id', id)
      .update(updateData);
  }

  private static mapDatabaseToInvitation(row: any): ProjectInvitation {
    return {
      id: row.id,
      projectId: row.project_id,
      inviterUserId: row.inviter_user_id,
      inviteeEmail: row.invitee_email,
      role: row.role,
      collaborationRole: row.collaboration_role,
      token: row.token,
      status: row.status,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined
    };
  }

  private static async sendInvitationEmail(
    invitation: ProjectInvitation,
    project: any,
    customMessage?: string
  ): Promise<void> {
    try {
      const inviter = await UserModel.findById(invitation.inviterUserId);
      const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitation.token}`;

      const subject = `Invitation to collaborate on "${project.name}"`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">You're invited to collaborate!</h2>
          
          <p>${inviter?.firstName || 'Someone'} has invited you to join the project <strong>"${project.name}"</strong> on Swistack.</p>
          
          ${customMessage ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><em>"${customMessage}"</em></p>
          </div>` : ''}
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Project Details</h3>
            <p><strong>Project:</strong> ${project.name}</p>
            <p><strong>Role:</strong> ${invitation.role}</p>
            <p><strong>Invited by:</strong> ${inviter?.firstName} ${inviter?.lastName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This invitation will expire in 7 days. If you don't have a Swistack account, you'll need to create one first.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #10b981;">${inviteUrl}</a>
          </p>
        </div>
      `;

      await EmailService.sendEmail(invitation.inviteeEmail, subject, htmlContent);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't throw - invitation should still be created even if email fails
    }
  }
}