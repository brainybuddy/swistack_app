import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Send,
  Users,
  AlertCircle
} from 'lucide-react';

interface Invitation {
  id: string;
  inviteeEmail: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

interface ProjectInvitationManagerProps {
  projectId: string;
  canInvite: boolean;
  className?: string;
}

export const ProjectInvitationManager: React.FC<ProjectInvitationManagerProps> = ({
  projectId,
  canInvite,
  className = ''
}) => {
  const { httpClient } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (canInvite) {
      fetchInvitations();
    }
  }, [projectId, canInvite]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/api/invitations/projects/${projectId}/invitations`);
      if (response.success) {
        setInvitations(response.data.invitations);
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setInviting(true);
      setError(null);

      const response = await httpClient.post(`/api/invitations/projects/${projectId}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
        message: inviteMessage.trim() || undefined
      });

      if (response.success) {
        setSuccess('Invitation sent successfully!');
        setInviteEmail('');
        setInviteMessage('');
        setShowInviteForm(false);
        fetchInvitations();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const response = await httpClient.delete(`/api/invitations/invitations/${invitationId}`);
      if (response.success) {
        setSuccess('Invitation cancelled');
        fetchInvitations();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to cancel invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!canInvite) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p>You don't have permission to manage project invitations</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Project Invitations</h3>
          <p className="text-sm text-gray-400">Manage who can access this project</p>
        </div>
        {!showInviteForm && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center space-x-2 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">Invite New Member</h4>
            <button
              onClick={() => {
                setShowInviteForm(false);
                setInviteEmail('');
                setInviteMessage('');
                setError(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="viewer">Viewer - Can view project</option>
                <option value="editor">Editor - Can edit and view</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Personal Message (Optional)
            </label>
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => {
                setShowInviteForm(false);
                setInviteEmail('');
                setInviteMessage('');
              }}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={sendInvitation}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {inviting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{inviting ? 'Sending...' : 'Send Invitation'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-lg font-medium text-white flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Pending Invitations</span>
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No pending invitations</p>
            <p className="text-sm mt-1">Invite team members to start collaborating</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-white">{invitation.inviteeEmail}</span>
                      <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                        {invitation.role}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(invitation.status)}
                        <span className="text-xs text-gray-400 capitalize">{invitation.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Sent {formatDate(invitation.createdAt)}</span>
                      <span>Expires {formatDate(invitation.expiresAt)}</span>
                    </div>
                  </div>
                  
                  {invitation.status === 'pending' && (
                    <button
                      onClick={() => cancelInvitation(invitation.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Cancel invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectInvitationManager;