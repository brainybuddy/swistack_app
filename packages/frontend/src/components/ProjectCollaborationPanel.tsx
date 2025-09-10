'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  Edit3,
  Eye,
  Trash2,
  Send,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Settings,
  Globe,
  Lock,
  Link,
  MoreVertical
} from 'lucide-react';
import { Project, ProjectMember, InviteMemberRequest } from '../../types/shared';

interface ProjectCollaborationPanelProps {
  project: Project;
  onProjectUpdate?: (project: Project) => void;
  className?: string;
}

interface Member {
  id: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: Date;
  joinedAt?: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function ProjectCollaborationPanel({ 
  project, 
  onProjectUpdate,
  className = '' 
}: ProjectCollaborationPanelProps) {
  const { user, httpClient } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' as 'editor' | 'viewer' });
  const [isInviting, setIsInviting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  useEffect(() => {
    fetchMembers();
    generateShareUrl();
  }, [project.id]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await httpClient.get(`/api/projects/${project.id}/members`);
      
      if (response.success && response.data?.members) {
        setMembers(response.data.members);
      } else {
        throw new Error(response.error || 'Failed to fetch members');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  const generateShareUrl = () => {
    if (project.isPublic) {
      setShareUrl(`${window.location.origin}/projects/${project.slug}`);
    } else {
      setShareUrl('');
    }
  };

  const inviteMember = async () => {
    if (!inviteForm.email.trim()) return;

    try {
      setIsInviting(true);
      setError(null);
      
      const inviteData: InviteMemberRequest = {
        email: inviteForm.email.trim(),
        role: inviteForm.role
      };

      const response = await httpClient.post(`/api/projects/${project.id}/members`, inviteData);
      
      if (response.success) {
        setInviteForm({ email: '', role: 'viewer' });
        setShowInviteForm(false);
        await fetchMembers();
      } else {
        throw new Error(response.error || 'Failed to invite member');
      }
    } catch (err) {
      console.error('Error inviting member:', err);
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'editor' | 'viewer') => {
    try {
      const response = await httpClient.put(`/api/projects/${project.id}/members/${memberId}`, {
        role: newRole
      });
      
      if (response.success) {
        await fetchMembers();
      } else {
        throw new Error(response.error || 'Failed to update member role');
      }
    } catch (err) {
      console.error('Error updating member role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;

    try {
      const response = await httpClient.delete(`/api/projects/${project.id}/members/${memberId}`);
      
      if (response.success) {
        await fetchMembers();
      } else {
        throw new Error(response.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const toggleProjectVisibility = async () => {
    try {
      const response = await httpClient.put(`/api/projects/${project.id}`, {
        isPublic: !project.isPublic
      });
      
      if (response.success && response.data?.project) {
        if (onProjectUpdate) {
          onProjectUpdate(response.data.project);
        }
        generateShareUrl();
      } else {
        throw new Error(response.error || 'Failed to update project visibility');
      }
    } catch (err) {
      console.error('Error updating project visibility:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project visibility');
    }
  };

  const copyShareUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'editor':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'editor':
        return 'text-blue-400 bg-blue-500/20';
      case 'viewer':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'declined':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOwner = members.some(m => m.userId === user?.id && m.role === 'owner');
  const canManageMembers = isOwner;

  return (
    <div className={`bg-gray-800/30 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-medium text-white">Collaboration</h3>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Project Visibility */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {project.isPublic ? (
              <Globe className="w-5 h-5 text-green-400" />
            ) : (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h4 className="text-sm font-medium text-white">
                {project.isPublic ? 'Public Project' : 'Private Project'}
              </h4>
              <p className="text-xs text-gray-400">
                {project.isPublic 
                  ? 'Anyone on the internet can view this project'
                  : 'Only invited collaborators can access this project'
                }
              </p>
            </div>
          </div>
          {canManageMembers && (
            <button
              onClick={toggleProjectVisibility}
              className="px-3 py-1.5 text-sm border border-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Make {project.isPublic ? 'Private' : 'Public'}
            </button>
          )}
        </div>

        {/* Share URL */}
        {project.isPublic && shareUrl && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-400 mb-1">Share Link</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-1.5 bg-gray-800/50 border border-gray-600 rounded text-sm text-gray-300 focus:outline-none"
              />
              <button
                onClick={copyShareUrl}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
              >
                {shareUrlCopied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">
          Members ({members.length})
        </h4>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No members yet. Invite collaborators to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    {member.user.avatar ? (
                      <img 
                        src={member.user.avatar} 
                        alt={member.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-white">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">{member.user.name}</span>
                      {member.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{member.user.email}</span>
                      <span>•</span>
                      <span>Invited {formatDate(member.invitedAt)}</span>
                      {member.joinedAt && (
                        <>
                          <span>•</span>
                          <span>Joined {formatDate(member.joinedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Role Badge */}
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    <span className="capitalize">{member.role}</span>
                  </div>

                  {/* Actions */}
                  {canManageMembers && member.role !== 'owner' && (
                    <div className="flex items-center space-x-1">
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.userId, e.target.value as 'editor' | 'viewer')}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        onClick={() => removeMember(member.userId)}
                        className="p-1 hover:bg-red-600/20 rounded transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 min-w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Invite Collaborator</h3>
              <button
                onClick={() => setShowInviteForm(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="collaborator@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'editor' | 'viewer' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="viewer">Viewer - Can view and comment</option>
                  <option value="editor">Editor - Can view and edit</option>
                </select>
              </div>

              <div className="text-xs text-gray-400">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-3 h-3" />
                    <span><strong>Viewer:</strong> Can view project files and leave comments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-3 h-3" />
                    <span><strong>Editor:</strong> Can view, edit, and manage project files</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowInviteForm(false)}
                  disabled={isInviting}
                  className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={inviteMember}
                  disabled={!inviteForm.email.trim() || isInviting}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isInviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Invite</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}