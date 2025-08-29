import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText,
  FilePlus,
  FileX,
  FileEdit,
  UserPlus,
  UserMinus,
  Settings,
  Users,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ProjectUpdate {
  id: string;
  projectId: string;
  userId: string;
  type: 'file_created' | 'file_updated' | 'file_deleted' | 'file_renamed' | 'member_added' | 'member_removed' | 'project_updated' | 'collaboration_joined' | 'collaboration_left';
  data: {
    fileName?: string;
    filePath?: string;
    oldPath?: string;
    newPath?: string;
    memberEmail?: string;
    memberRole?: string;
    projectName?: string;
    changes?: Record<string, any>;
  };
  timestamp: string;
  userInfo: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface ProjectActivityFeedProps {
  projectId: string;
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
  autoUpdate?: boolean;
}

export const ProjectActivityFeed: React.FC<ProjectActivityFeedProps> = ({
  projectId,
  className = '',
  maxHeight = '400px',
  showHeader = true,
  autoUpdate = true
}) => {
  const { httpClient } = useAuth();
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpdates();

    // Setup real-time updates if enabled
    if (autoUpdate) {
      setupRealtimeUpdates();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [projectId, autoUpdate]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get(`/api/projects/${projectId}/updates?limit=50`);
      
      if (response.success) {
        setUpdates(response.data.updates);
      } else {
        setError('Failed to load activity');
      }
    } catch (err) {
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('accessToken')
      }
    });

    newSocket.on('connect', () => {
      // Join project room for updates
      newSocket.emit('join_project', { projectId });
    });

    newSocket.on('project_update', (update: ProjectUpdate) => {
      setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep only 50 most recent
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from real-time updates');
    });

    setSocket(newSocket);
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'file_created': return <FilePlus className="w-4 h-4 text-green-400" />;
      case 'file_updated': return <FileEdit className="w-4 h-4 text-blue-400" />;
      case 'file_deleted': return <FileX className="w-4 h-4 text-red-400" />;
      case 'file_renamed': return <FileText className="w-4 h-4 text-yellow-400" />;
      case 'member_added': return <UserPlus className="w-4 h-4 text-green-400" />;
      case 'member_removed': return <UserMinus className="w-4 h-4 text-red-400" />;
      case 'project_updated': return <Settings className="w-4 h-4 text-blue-400" />;
      case 'collaboration_joined': return <Users className="w-4 h-4 text-green-400" />;
      case 'collaboration_left': return <Users className="w-4 h-4 text-gray-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getUpdateMessage = (update: ProjectUpdate): string => {
    const { type, data, userInfo } = update;
    const userName = `${userInfo.firstName} ${userInfo.lastName}`;

    switch (type) {
      case 'file_created':
        return `${userName} created ${data.fileName}`;
      case 'file_updated':
        return `${userName} updated ${data.fileName}`;
      case 'file_deleted':
        return `${userName} deleted ${data.fileName}`;
      case 'file_renamed':
        return `${userName} renamed ${data.oldPath?.split('/').pop()} to ${data.newPath?.split('/').pop()}`;
      case 'member_added':
        return `${userName} added ${data.memberEmail} as ${data.memberRole}`;
      case 'member_removed':
        return `${userName} removed ${data.memberEmail}`;
      case 'project_updated':
        return `${userName} updated project settings`;
      case 'collaboration_joined':
        return `${userName} joined the collaboration`;
      case 'collaboration_left':
        return `${userName} left the collaboration`;
      default:
        return `${userName} made changes to the project`;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getUserAvatar = (userInfo: ProjectUpdate['userInfo']) => {
    if (userInfo.avatar) {
      return (
        <img
          src={userInfo.avatar}
          alt={`${userInfo.firstName} ${userInfo.lastName}`}
          className="w-6 h-6 rounded-full"
        />
      );
    }

    return (
      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-medium">
        {userInfo.firstName.charAt(0)}{userInfo.lastName.charAt(0)}
      </div>
    );
  };

  if (!showHeader && !expanded) {
    return null;
  }

  return (
    <div className={`bg-gray-800/30 border border-gray-700 rounded-lg ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-medium text-white">Activity Feed</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUpdates}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Refresh activity"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div
          className="overflow-y-auto"
          style={{ maxHeight }}
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading activity...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">
              <p>{error}</p>
              <button
                onClick={fetchUpdates}
                className="mt-2 text-sm text-teal-400 hover:text-teal-300"
              >
                Try again
              </button>
            </div>
          ) : updates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">Project activity will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getUpdateIcon(update.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getUserAvatar(update.userInfo)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          {getUpdateMessage(update)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(update.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-time indicator */}
      {autoUpdate && socket?.connected && (
        <div className="px-4 py-2 border-t border-gray-700">
          <div className="flex items-center space-x-2 text-xs text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live updates active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectActivityFeed;