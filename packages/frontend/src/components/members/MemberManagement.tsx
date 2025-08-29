'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MemberList from './MemberList';
import InviteMemberModal from './InviteMemberModal';
import {
  Users,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: Date;
  lastActive?: Date;
  invitedBy?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: Date;
  expiresAt: Date;
  invitedBy: string;
}

interface MemberManagementProps {
  projectId: string;
  projectName: string;
  className?: string;
}

export default function MemberManagement({
  projectId,
  projectName,
  className = ''
}: MemberManagementProps) {
  const { user, httpClient } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('viewer');

  useEffect(() => {
    fetchMembersAndInvitations();
  }, [projectId]);

  const fetchMembersAndInvitations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch members and invitations in parallel
      const [membersResponse, invitationsResponse] = await Promise.all([
        httpClient.get(`/api/projects/${projectId}/members`),
        httpClient.get(`/api/projects/${projectId}/invitations`)
      ]);

      if (membersResponse.success && membersResponse.data) {
        const membersData = membersResponse.data.members;
        setMembers(membersData);
        
        // Find current user's role
        const currentMember = membersData.find((m: Member) => m.userId === user.id);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }

      if (invitationsResponse.success && invitationsResponse.data) {
        setInvitations(invitationsResponse.data.invitations);
      }
    } catch (err) {
      console.error('Error fetching members and invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const canManageMembers = (): boolean => {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  };

  const handleInviteMembers = async (inviteData: { email: string; role: string; message?: string }[]) => {
    try {
      const promises = inviteData.map(invite =>
        httpClient.post(`/api/projects/${projectId}/members`, {
          email: invite.email,
          role: invite.role,
          message: invite.message
        })
      );

      await Promise.all(promises);
      
      // Refresh data
      await fetchMembersAndInvitations();
    } catch (err) {
      console.error('Error sending invitations:', err);
      throw err;
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: string) => {
    try {
      const response = await httpClient.put(`/api/projects/${projectId}/members/${userId}`, {
        role
      });

      if (response.success) {
        // Update local state
        setMembers(prevMembers =>
          prevMembers.map(member =>
            member.userId === userId ? { ...member, role: role as Member['role'] } : member
          )
        );
      } else {
        throw new Error(response.error || 'Failed to update member role');
      }
    } catch (err) {
      console.error('Error updating member role:', err);
      throw err;
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await httpClient.delete(`/api/projects/${projectId}/members/${userId}`);

      if (response.success) {
        // Remove from local state
        setMembers(prevMembers => prevMembers.filter(member => member.userId !== userId));
      } else {
        throw new Error(response.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      throw err;
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await httpClient.post(`/api/projects/${projectId}/invitations/${invitationId}/resend`);
      
      if (response.success) {
        // Update invitation timestamp
        setInvitations(prevInvitations =>
          prevInvitations.map(inv =>
            inv.id === invitationId ? { ...inv, sentAt: new Date() } : inv
          )
        );
      }
    } catch (err) {
      console.error('Error resending invitation:', err);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await httpClient.delete(`/api/projects/${projectId}/invitations/${invitationId}`);
      
      if (response.success) {
        // Remove from local state
        setInvitations(prevInvitations => 
          prevInvitations.filter(inv => inv.id !== invitationId)
        );
      }
    } catch (err) {
      console.error('Error canceling invitation:', err);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'accepted': return 'text-green-400';
      case 'declined': return 'text-red-400';
      case 'expired': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'accepted': return CheckCircle;
      case 'declined': 
      case 'expired': return XCircle;
      default: return Clock;
    }
  };

  if (error && !isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to load members</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchMembersAndInvitations}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Member List */}
      <MemberList
        members={members}
        currentUserId={user?.id || ''}
        canManageMembers={canManageMembers()}
        onUpdateRole={handleUpdateMemberRole}
        onRemoveMember={handleRemoveMember}
        onInviteMembers={() => setShowInviteModal(true)}
        isLoading={isLoading}
      />

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-white">
              Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
            </h3>
          </div>

          <div className="space-y-3">
            {invitations.map(invitation => {
              const StatusIcon = getInvitationStatusIcon(invitation.status);
              
              return (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`w-5 h-5 ${getInvitationStatusColor(invitation.status)}`} />
                    <div>
                      <p className="font-medium text-white">{invitation.email}</p>
                      <div className="flex items-center space-x-3 text-sm text-gray-400">
                        <span className="capitalize">{invitation.role}</span>
                        <span>•</span>
                        <span>Sent {formatDate(invitation.sentAt)}</span>
                        <span>•</span>
                        <span className={getInvitationStatusColor(invitation.status)}>
                          {invitation.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {invitation.status === 'pending' && canManageMembers() && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResendInvitation(invitation.id)}
                        className="px-3 py-1 text-sm text-teal-400 hover:bg-teal-400/10 rounded transition-colors"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="px-3 py-1 text-sm text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMembers}
        projectName={projectName}
        projectId={projectId}
      />
    </div>
  );
}