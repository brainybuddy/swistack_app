'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  UserPlus,
  Settings,
  Crown,
  Shield,
  Edit3,
  Eye,
  Circle,
  MessageSquare,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share,
  Lock,
  Globe,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';

interface CollaborationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'online' | 'away' | 'offline';
  cursor?: {
    x: number;
    y: number;
    file?: string;
  };
  isTyping?: boolean;
  lastActive: Date;
}

interface CollaborationPanelProps {
  projectId: string;
  currentFile?: string;
  className?: string;
}

const ROLE_CONFIG = {
  owner: {
    icon: Crown,
    label: 'Owner',
    color: 'text-yellow-400'
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    color: 'text-red-400'
  },
  editor: {
    icon: Edit3,
    label: 'Editor',
    color: 'text-blue-400'
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    color: 'text-gray-400'
  }
};

const STATUS_CONFIG = {
  online: {
    color: 'text-green-400',
    bgColor: 'bg-green-400',
    label: 'Online'
  },
  away: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400',
    label: 'Away'
  },
  offline: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
    label: 'Offline'
  }
};

export default function CollaborationPanel({ 
  projectId, 
  currentFile,
  className = '' 
}: CollaborationPanelProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [volumeEnabled, setVolumeEnabled] = useState(true);

  // Mock collaboration data
  useEffect(() => {
    // In real implementation, this would be WebSocket connection
    const mockCollaborators: CollaborationUser[] = [
      {
        id: user?.id || 'current-user',
        firstName: user?.firstName || 'You',
        lastName: user?.lastName || '',
        email: user?.email || 'you@example.com',
        role: 'owner',
        status: 'online',
        cursor: { x: 0, y: 0, file: currentFile },
        isTyping: false,
        lastActive: new Date()
      },
      {
        id: 'user-2',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah@company.com',
        role: 'editor',
        status: 'online',
        cursor: { x: 120, y: 45, file: 'src/components/App.tsx' },
        isTyping: true,
        lastActive: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      },
      {
        id: 'user-3',
        firstName: 'Alex',
        lastName: 'Rodriguez',
        email: 'alex@company.com',
        role: 'viewer',
        status: 'away',
        lastActive: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        id: 'user-4',
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma@company.com',
        role: 'admin',
        status: 'offline',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ];

    setCollaborators(mockCollaborators);
  }, [user, currentFile]);

  const getUserAvatar = (collaborator: CollaborationUser) => {
    if (collaborator.avatar) {
      return (
        <img
          src={collaborator.avatar}
          alt={`${collaborator.firstName} ${collaborator.lastName}`}
          className="w-8 h-8 rounded-full"
        />
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
        {collaborator.firstName.charAt(0)}{collaborator.lastName.charAt(0)}
      </div>
    );
  };

  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'Yesterday';
  };

  const getUsersInCurrentFile = () => {
    return collaborators.filter(c => 
      c.cursor?.file === currentFile && 
      c.status === 'online' && 
      c.id !== user?.id
    );
  };

  const onlineUsers = collaborators.filter(c => c.status === 'online');
  const awayUsers = collaborators.filter(c => c.status === 'away');
  const offlineUsers = collaborators.filter(c => c.status === 'offline');

  const UserItem = ({ collaborator }: { collaborator: CollaborationUser }) => {
    const roleConfig = ROLE_CONFIG[collaborator.role];
    const statusConfig = STATUS_CONFIG[collaborator.status];
    const RoleIcon = roleConfig.icon;
    const isCurrentUser = collaborator.id === user?.id;

    return (
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded-lg cursor-pointer group">
        <div className="relative">
          {getUserAvatar(collaborator)}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusConfig.bgColor} rounded-full border-2 border-gray-900`} />
          {collaborator.isTyping && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white text-sm truncate">
              {collaborator.firstName} {collaborator.lastName}
              {isCurrentUser && <span className="text-teal-400 text-xs ml-1">(You)</span>}
            </span>
            <RoleIcon className={`w-3 h-3 ${roleConfig.color}`} />
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span className={statusConfig.color}>{statusConfig.label}</span>
            {collaborator.status !== 'online' && (
              <span>• {formatLastActive(collaborator.lastActive)}</span>
            )}
          </div>
          {collaborator.isTyping && (
            <div className="text-xs text-blue-400 italic">typing...</div>
          )}
          {collaborator.cursor?.file && collaborator.cursor.file !== currentFile && (
            <div className="text-xs text-gray-500 truncate">
              in {collaborator.cursor.file}
            </div>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setSelectedUser(selectedUser === collaborator.id ? null : collaborator.id)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-800/30 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-medium text-white">Collaboration</h3>
          <span className="text-sm text-gray-400">({onlineUsers.length} online)</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowInviteModal(true)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            title="Invite collaborators"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Current File Collaborators */}
          {currentFile && getUsersInCurrentFile().length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>In this file ({getUsersInCurrentFile().length})</span>
              </h4>
              <div className="space-y-1">
                {getUsersInCurrentFile().map(collaborator => (
                  <UserItem key={collaborator.id} collaborator={collaborator} />
                ))}
              </div>
            </div>
          )}

          {/* Voice Chat */}
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-white">Voice Chat</span>
              </div>
              <button
                onClick={() => setVoiceChatEnabled(!voiceChatEnabled)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  voiceChatEnabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {voiceChatEnabled ? 'Leave' : 'Join'}
              </button>
            </div>
            
            {voiceChatEnabled && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`p-2 rounded transition-colors ${
                    micEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setVolumeEnabled(!volumeEnabled)}
                  className={`p-2 rounded transition-colors ${
                    volumeEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {volumeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <div className="flex-1 text-xs text-gray-400">
                  {onlineUsers.filter(u => u.id !== user?.id).length} participants
                </div>
              </div>
            )}
          </div>

          {/* All Users */}
          <div className="space-y-3">
            {onlineUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center space-x-2">
                  <Circle className="w-2 h-2 fill-current" />
                  <span>Online ({onlineUsers.length})</span>
                </h4>
                <div className="space-y-1">
                  {onlineUsers.map(collaborator => (
                    <UserItem key={collaborator.id} collaborator={collaborator} />
                  ))}
                </div>
              </div>
            )}

            {awayUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center space-x-2">
                  <Circle className="w-2 h-2 fill-current" />
                  <span>Away ({awayUsers.length})</span>
                </h4>
                <div className="space-y-1">
                  {awayUsers.map(collaborator => (
                    <UserItem key={collaborator.id} collaborator={collaborator} />
                  ))}
                </div>
              </div>
            )}

            {offlineUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center space-x-2">
                  <Circle className="w-2 h-2 fill-current" />
                  <span>Offline ({offlineUsers.length})</span>
                </h4>
                <div className="space-y-1">
                  {offlineUsers.map(collaborator => (
                    <UserItem key={collaborator.id} collaborator={collaborator} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => console.log('Share project')}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                <Share className="w-4 h-4" />
                <span>Share Project</span>
              </button>
              <button
                onClick={() => console.log('Project settings')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Project settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal Placeholder */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Invite Collaborators</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Invite team members to collaborate on this project
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Send Invites
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}