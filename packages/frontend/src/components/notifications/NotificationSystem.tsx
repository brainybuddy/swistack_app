'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Users,
  Code,
  GitBranch,
  MessageSquare,
  Shield,
  Clock,
  Settings
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'collaboration' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actions?: {
    label: string;
    action: () => void;
    type: 'primary' | 'secondary';
  }[];
  metadata?: {
    userId?: string;
    projectId?: string;
    fileId?: string;
    [key: string]: any;
  };
}

interface NotificationSystemProps {
  className?: string;
}

const NOTIFICATION_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  collaboration: Users,
  system: Settings
};

const NOTIFICATION_COLORS = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    text: 'text-blue-300'
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    text: 'text-green-300'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-400',
    text: 'text-yellow-300'
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    text: 'text-red-300'
  },
  collaboration: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    icon: 'text-teal-400',
    text: 'text-teal-300'
  },
  system: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    icon: 'text-gray-400',
    text: 'text-gray-300'
  }
};

export default function NotificationSystem({ className = '' }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);

  // Mock initial notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'collaboration',
        title: 'New Collaborator',
        message: 'Sarah Chen has joined the project as an editor',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        metadata: { userId: 'user-2', projectId: 'proj-1' }
      },
      {
        id: '2',
        type: 'system',
        title: 'Build Completed',
        message: 'Your project build completed successfully in 2.3s',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: false,
        metadata: { projectId: 'proj-1' }
      },
      {
        id: '3',
        type: 'warning',
        title: 'Dependency Update',
        message: 'React has a new version available (18.2.1)',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        actions: [
          { label: 'Update', action: () => console.log('Update React'), type: 'primary' },
          { label: 'Ignore', action: () => console.log('Ignore update'), type: 'secondary' }
        ]
      },
      {
        id: '4',
        type: 'info',
        title: 'File Shared',
        message: 'Alex Rodriguez shared "api-utils.ts" with you',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        metadata: { userId: 'user-3', fileId: 'file-123' }
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  // Add notification method
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show as toast if not persistent
    if (!notification.persistent) {
      setToastNotifications(prev => [...prev, newNotification]);
      
      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToastNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  }, []);

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  // Remove notification
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setToastNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Expose methods globally for other components to use
  useEffect(() => {
    (window as any).addNotification = addNotification;
  }, [addNotification]);

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationItem = ({ notification, showActions = true, onClose }: {
    notification: Notification;
    showActions?: boolean;
    onClose?: () => void;
  }) => {
    const colors = NOTIFICATION_COLORS[notification.type];
    const Icon = NOTIFICATION_ICONS[notification.type];

    return (
      <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border} ${
        !notification.read ? 'ring-1 ring-teal-500/20' : ''
      }`}>
        <div className="flex items-start space-x-3">
          <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white text-sm">{notification.title}</h4>
              <div className="flex items-center space-x-2">
                {!notification.read && (
                  <div className="w-2 h-2 bg-teal-400 rounded-full" />
                )}
                <span className="text-xs text-gray-500">
                  {formatTimestamp(notification.timestamp)}
                </span>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
            
            {notification.actions && showActions && (
              <div className="flex items-center space-x-2 mt-3">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      action.type === 'primary'
                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Notification Bell */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>

        {/* Notification Panel */}
        {showPanel && (
          <>
            <div className="absolute right-0 top-12 w-80 max-h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="font-medium text-white">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-teal-400 hover:text-teal-300"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowPanel(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className="cursor-pointer"
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <NotificationItem 
                          notification={notification} 
                          showActions={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-700 p-3">
                <button
                  onClick={() => console.log('Open notification settings')}
                  className="w-full text-center text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Notification Settings
                </button>
              </div>
            </div>

            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPanel(false)}
            />
          </>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toastNotifications.map(notification => (
          <div
            key={notification.id}
            className="w-80 animate-in slide-in-from-right duration-300"
          >
            <NotificationItem
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>

      {/* Expose methods globally for other components to use */}
    </>
  );
}