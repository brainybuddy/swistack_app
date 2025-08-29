'use client';

import { useState } from 'react';
import {
  X,
  Mail,
  Plus,
  Trash2,
  Crown,
  Shield,
  Edit3,
  Eye,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Copy,
  Link as LinkIcon
} from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (invitations: { email: string; role: string; message?: string }[]) => Promise<void>;
  projectName: string;
  projectId: string;
}

type Role = 'admin' | 'editor' | 'viewer';

interface Invitation {
  id: string;
  email: string;
  role: Role;
  error?: string;
}

const ROLES = [
  {
    value: 'admin' as Role,
    icon: Shield,
    label: 'Admin',
    color: 'text-red-400',
    description: 'Can manage members and project settings'
  },
  {
    value: 'editor' as Role,
    icon: Edit3,
    label: 'Editor',
    color: 'text-blue-400',
    description: 'Can edit files and collaborate'
  },
  {
    value: 'viewer' as Role,
    icon: Eye,
    label: 'Viewer',
    color: 'text-gray-400',
    description: 'Can view files and leave comments'
  }
];

const PREDEFINED_MESSAGES = [
  "Join me on this exciting project!",
  "I'd love to collaborate with you on this.",
  "Your expertise would be valuable for this project.",
  "Let's work together on this project."
];

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  projectName,
  projectId
}: InviteMemberModalProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([
    { id: '1', email: '', role: 'editor' }
  ]);
  const [customMessage, setCustomMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<'email' | 'link'>('email');
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Reset form when modal opens/closes
  useState(() => {
    if (isOpen) {
      setInvitations([{ id: '1', email: '', role: 'editor' }]);
      setCustomMessage('');
      setIsInviting(false);
      generateInviteLink();
    }
  });

  const generateInviteLink = () => {
    // Generate shareable invite link
    const baseUrl = window.location.origin;
    const linkId = Math.random().toString(36).substring(2, 15);
    setInviteLink(`${baseUrl}/invite/${projectId}?token=${linkId}`);
  };

  const addInvitation = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setInvitations([...invitations, { id: newId, email: '', role: 'editor' }]);
  };

  const removeInvitation = (id: string) => {
    if (invitations.length > 1) {
      setInvitations(invitations.filter(inv => inv.id !== id));
    }
  };

  const updateInvitation = (id: string, field: keyof Invitation, value: string) => {
    setInvitations(invitations.map(inv =>
      inv.id === id ? { ...inv, [field]: value, error: undefined } : inv
    ));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    // Validate all invitations
    const validatedInvitations = invitations.map(inv => ({
      ...inv,
      error: inv.email.trim() === '' ? 'Email is required' :
             !validateEmail(inv.email) ? 'Invalid email address' : undefined
    }));

    setInvitations(validatedInvitations);

    const hasErrors = validatedInvitations.some(inv => inv.error);
    if (hasErrors) return;

    try {
      setIsInviting(true);
      const inviteData = validatedInvitations.map(inv => ({
        email: inv.email.trim(),
        role: inv.role,
        message: customMessage.trim() || undefined
      }));

      await onInvite(inviteData);
      onClose();
    } catch (error) {
      console.error('Failed to send invitations:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  const getRoleConfig = (role: Role) => {
    return ROLES.find(r => r.value === role) || ROLES[1];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-teal-400" />
              <span>Invite Members</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Invite people to collaborate on "{projectName}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Invite Method Toggle */}
          <div className="flex bg-gray-800/50 border border-gray-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => setInviteMethod('email')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm transition-colors ${
                inviteMethod === 'email'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email Invitations</span>
            </button>
            <button
              onClick={() => setInviteMethod('link')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm transition-colors ${
                inviteMethod === 'link'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Share Link</span>
            </button>
          </div>

          {inviteMethod === 'email' ? (
            <>
              {/* Email Invitations */}
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-medium text-gray-300">
                  Email Addresses
                </label>
                
                {invitations.map((invitation, index) => (
                  <div key={invitation.id} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="email"
                          placeholder="colleague@company.com"
                          value={invitation.email}
                          onChange={(e) => updateInvitation(invitation.id, 'email', e.target.value)}
                          className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors ${
                            invitation.error
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-gray-700 focus:border-teal-500'
                          }`}
                        />
                        {invitation.error && (
                          <p className="text-red-400 text-xs mt-1 flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{invitation.error}</span>
                          </p>
                        )}
                      </div>

                      <select
                        value={invitation.role}
                        onChange={(e) => updateInvitation(invitation.id, 'role', e.target.value)}
                        className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                      >
                        {ROLES.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>

                      {invitations.length > 1 && (
                        <button
                          onClick={() => removeInvitation(invitation.id)}
                          className="p-2 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {index === 0 && (
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const roleConfig = getRoleConfig(invitation.role);
                            const Icon = roleConfig.icon;
                            return (
                              <>
                                <Icon className={`w-3 h-3 ${roleConfig.color}`} />
                                <span>{roleConfig.description}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={addInvitation}
                  className="flex items-center space-x-2 text-teal-400 hover:text-teal-300 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add another email</span>
                </button>
              </div>

              {/* Custom Message */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-300">
                  Personal Message (optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
                
                {/* Quick Messages */}
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_MESSAGES.map((message, index) => (
                    <button
                      key={index}
                      onClick={() => setCustomMessage(message)}
                      className="text-xs px-2 py-1 bg-gray-800/50 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      "{message}"
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Share Link */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Shareable Invite Link
                  </label>
                  <p className="text-sm text-gray-400 mb-4">
                    Anyone with this link can request to join the project
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none pr-10"
                      />
                      <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        linkCopied
                          ? 'bg-green-600 text-white'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      {linkCopied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Link Settings */}
                <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Link Settings</h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>• Link expires in 7 days</p>
                    <p>• New members join as Viewers by default</p>
                    <p>• You can change their role after they join</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-500">
            {inviteMethod === 'email' ? (
              `${invitations.filter(inv => inv.email.trim()).length} invitation${
                invitations.filter(inv => inv.email.trim()).length !== 1 ? 's' : ''
              } ready to send`
            ) : (
              'Share the link with people you want to invite'
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            {inviteMethod === 'email' && (
              <button
                onClick={handleInvite}
                disabled={
                  isInviting || 
                  !invitations.some(inv => inv.email.trim()) ||
                  invitations.some(inv => inv.error)
                }
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isInviting && <Loader2 className="w-4 h-4 animate-spin" />}
                <Send className="w-4 h-4" />
                <span>Send Invitations</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}