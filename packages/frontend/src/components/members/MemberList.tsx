'use client';

import { useState } from 'react';
import {
  Crown,
  Shield,
  Edit3,
  Eye,
  MoreVertical,
  UserX,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  UserPlus
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

interface MemberListProps {
  members: Member[];
  currentUserId: string;
  canManageMembers: boolean;
  onUpdateRole: (userId: string, role: Member['role']) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onInviteMembers: () => void;
  isLoading?: boolean;
}

const ROLE_CONFIG = {
  owner: {
    icon: Crown,
    label: 'Owner',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    description: 'Full access to project and settings'
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    description: 'Can manage members and project settings'
  },
  editor: {
    icon: Edit3,
    label: 'Editor',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    description: 'Can edit files and collaborate'
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    description: 'Can view files and comments'
  }
};

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle,
    label: 'Active',
    color: 'text-green-400'
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-yellow-400'
  },
  inactive: {
    icon: XCircle,
    label: 'Inactive',
    color: 'text-gray-400'
  }
};

export default function MemberList({
  members,
  currentUserId,
  canManageMembers,
  onUpdateRole,
  onRemoveMember,
  onInviteMembers,
  isLoading = false
}: MemberListProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const getUserAvatar = (member: Member) => {
    if (member.avatar) {
      return (
        <img
          src={member.avatar}
          alt={`${member.firstName} ${member.lastName}`}
          className="w-10 h-10 rounded-full"
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
      </div>
    );
  };

  const handleRoleUpdate = async (member: Member, newRole: Member['role']) => {
    if (member.userId === currentUserId || member.role === 'owner') return;
    
    try {
      setUpdatingMember(member.userId);
      await onUpdateRole(member.userId, newRole);
    } catch (error) {
      console.error('Failed to update member role:', error);
    } finally {
      setUpdatingMember(null);
      setActionMenuOpen(null);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (member.userId === currentUserId || member.role === 'owner') return;
    
    const confirmed = confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName} from this project?`);
    if (!confirmed) return;
    
    try {
      setUpdatingMember(member.userId);
      await onRemoveMember(member.userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setUpdatingMember(null);
      setActionMenuOpen(null);
    }
  };

  const canEditMember = (member: Member): boolean => {
    return canManageMembers && 
           member.userId !== currentUserId && 
           member.role !== 'owner';
  };

  // Group members by status
  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');
  const inactiveMembers = members.filter(m => m.status === 'inactive');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/3" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
            <div className="w-20 h-6 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const MemberItem = ({ member }: { member: Member }) => {
    const roleConfig = ROLE_CONFIG[member.role];
    const statusConfig = STATUS_CONFIG[member.status];
    const RoleIcon = roleConfig.icon;
    const StatusIcon = statusConfig.icon;

    return (
      <div className="flex items-center space-x-4 p-4 bg-gray-800/30 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors">
        {getUserAvatar(member)}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-white truncate">
              {member.firstName} {member.lastName}
              {member.userId === currentUserId && (
                <span className="text-xs text-teal-400 ml-2">(You)</span>
              )}
            </h3>
            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
          </div>
          <p className="text-sm text-gray-400 truncate">{member.email}</p>
          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
            <span>Joined {formatDate(member.joinedAt)}</span>
            {member.lastActive && (
              <span>Active {formatDate(member.lastActive)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${roleConfig.bgColor}`}>
            <RoleIcon className={`w-3 h-3 ${roleConfig.color}`} />
            <span className={`text-xs font-medium ${roleConfig.color}`}>
              {roleConfig.label}
            </span>
          </div>

          {canEditMember(member) && (
            <div className="relative">
              <button
                onClick={() => setActionMenuOpen(actionMenuOpen === member.userId ? null : member.userId)}
                disabled={updatingMember === member.userId}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {actionMenuOpen === member.userId && (
                <div className="absolute right-0 top-10 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <p className="text-xs text-gray-400 px-3 py-2">Change Role</p>
                    {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                      if (role === 'owner') return null;
                      const Icon = config.icon;
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleUpdate(member, role as Member['role'])}
                          disabled={member.role === role}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="text-white">{config.label}</span>
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-700 my-2" />
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Remove Member</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-medium text-white">
            Project Members ({members.length})
          </h2>
        </div>
        {canManageMembers && (
          <button
            onClick={onInviteMembers}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Members</span>
          </button>
        )}
      </div>

      {/* Active Members */}
      {activeMembers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Active Members ({activeMembers.length})
          </h3>
          <div className="space-y-3">
            {activeMembers.map(member => (
              <MemberItem key={member.userId} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Pending Invitations ({pendingMembers.length})
          </h3>
          <div className="space-y-3">
            {pendingMembers.map(member => (
              <MemberItem key={member.userId} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Inactive Members ({inactiveMembers.length})
          </h3>
          <div className="space-y-3">
            {inactiveMembers.map(member => (
              <MemberItem key={member.userId} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No members yet</h3>
          <p className="text-gray-400 text-sm mb-6">
            Invite team members to collaborate on this project
          </p>
          {canManageMembers && (
            <button
              onClick={onInviteMembers}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Members</span>
            </button>
          )}
        </div>
      )}

      {/* Click outside to close menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  );
}