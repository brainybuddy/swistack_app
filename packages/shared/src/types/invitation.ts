export interface ProjectInvitation {
  id: string;
  projectId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: 'admin' | 'editor' | 'viewer';
  collaborationRole: 'admin' | 'editor' | 'viewer' | 'commenter';
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
  message?: string;
  error?: string;
}

export interface InvitationListResponse {
  success: boolean;
  data?: {
    invitations: ProjectInvitation[];
  };
  error?: string;
}

export interface UserInvitationResponse {
  success: boolean;
  data?: {
    invitations: Array<{
      id: string;
      project: {
        id: string;
        name: string;
        description: string;
      } | null;
      role: string;
      status: string;
      expiresAt: string;
      createdAt: string;
      token: string;
    }>;
  };
  error?: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  data?: {
    projectId: string;
  };
  message?: string;
  error?: string;
}

export const INVITATION_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;

export type InvitationRole = typeof INVITATION_ROLES[keyof typeof INVITATION_ROLES];
export type InvitationStatus = typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];