'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  CollaborativeUser,
  Operation,
  ActivityFeedItem,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
} from '../types/shared';
import { OperationalTransform, TextOperation } from '../types/shared';

interface CollaborationContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  currentProjectId: string | null;
  activeUsersInProject: CollaborativeUser[];
  activeUsersInFile: Map<string, CollaborativeUser[]>;
  userCursors: Map<string, Map<string, { line: number; column: number }>>;
  userSelections: Map<string, Map<string, {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }>>;
  activityFeed: ActivityFeedItem[];
  joinProject: (projectId: string) => void;
  leaveProject: () => void;
  openFile: (projectId: string, fileId: string) => void;
  closeFile: (projectId: string, fileId: string) => void;
  sendOperation: (fileId: string, operation: TextOperation) => void;
  sendCursorMove: (fileId: string, line: number, column: number) => void;
  sendSelectionChange: (fileId: string, startLine: number, startColumn: number, endLine: number, endColumn: number) => void;
  connect: () => void;
  disconnect: () => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

interface CollaborationProviderProps {
  children: React.ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeUsersInProject, setActiveUsersInProject] = useState<CollaborativeUser[]>([]);
  const [activeUsersInFile, setActiveUsersInFile] = useState<Map<string, CollaborativeUser[]>>(new Map());
  const [userCursors, setUserCursors] = useState<Map<string, Map<string, { line: number; column: number }>>>(new Map());
  const [userSelections, setUserSelections] = useState<Map<string, Map<string, {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }>>>(new Map());
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

  const connect = useCallback(() => {
    if (!user || !token || socket) return;

    console.log('Connecting to collaboration server...');
    
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket'],
      forceNew: true
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Collaboration connection error:', error);
      setIsConnected(false);
    });

    // Project events
    newSocket.on('project-joined', (data) => {
      console.log('Joined project:', data.projectId);
      setCurrentProjectId(data.projectId);
      setActiveUsersInProject(data.activeUsers);
    });

    newSocket.on('user-joined', (data) => {
      console.log('User joined project:', data.user.username);
      setActiveUsersInProject(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
    });

    newSocket.on('user-left', (data) => {
      console.log('User left project:', data.userId);
      setActiveUsersInProject(prev => prev.filter(u => u.id !== data.userId));
    });

    // File events
    newSocket.on('file-opened', (data) => {
      console.log('File opened:', data.fileId);
      setActiveUsersInFile(prev => {
        const newMap = new Map(prev);
        newMap.set(data.fileId, data.activeUsers);
        return newMap;
      });
    });

    newSocket.on('user-joined-file', (data) => {
      console.log('User joined file:', data.user.username, 'in file', data.fileId);
      setActiveUsersInFile(prev => {
        const newMap = new Map(prev);
        const currentUsers = newMap.get(data.fileId) || [];
        newMap.set(data.fileId, [...currentUsers.filter(u => u.id !== data.user.id), data.user]);
        return newMap;
      });
    });

    newSocket.on('user-left-file', (data) => {
      console.log('User left file:', data.userId, 'from file', data.fileId);
      setActiveUsersInFile(prev => {
        const newMap = new Map(prev);
        const currentUsers = newMap.get(data.fileId) || [];
        newMap.set(data.fileId, currentUsers.filter(u => u.id !== data.userId));
        return newMap;
      });

      // Remove user cursors and selections
      setUserCursors(prev => {
        const newMap = new Map(prev);
        const fileCursors = newMap.get(data.fileId);
        if (fileCursors) {
          fileCursors.delete(data.userId);
          if (fileCursors.size === 0) {
            newMap.delete(data.fileId);
          } else {
            newMap.set(data.fileId, fileCursors);
          }
        }
        return newMap;
      });

      setUserSelections(prev => {
        const newMap = new Map(prev);
        const fileSelections = newMap.get(data.fileId);
        if (fileSelections) {
          fileSelections.delete(data.userId);
          if (fileSelections.size === 0) {
            newMap.delete(data.fileId);
          } else {
            newMap.set(data.fileId, fileSelections);
          }
        }
        return newMap;
      });
    });

    // Operation events
    newSocket.on('operation-applied', (data) => {
      console.log('Operation applied:', data.operation.type, 'by', data.userId);
      // This will be handled by the Monaco editor integration
    });

    newSocket.on('operation-acknowledged', (data) => {
      console.log('Operation acknowledged for file:', data.fileId, 'version:', data.version);
    });

    // Cursor and selection events
    newSocket.on('cursor-moved', (data) => {
      setUserCursors(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(data.fileId)) {
          newMap.set(data.fileId, new Map());
        }
        newMap.get(data.fileId)!.set(data.userId, { line: data.line, column: data.column });
        return newMap;
      });
    });

    newSocket.on('selection-changed', (data) => {
      setUserSelections(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(data.fileId)) {
          newMap.set(data.fileId, new Map());
        }
        newMap.get(data.fileId)!.set(data.userId, {
          startLine: data.startLine,
          startColumn: data.startColumn,
          endLine: data.endLine,
          endColumn: data.endColumn
        });
        return newMap;
      });
    });

    // Activity feed events
    newSocket.on('activity-update', (data) => {
      setActivityFeed(prev => [data.activity, ...prev.slice(0, 49)]); // Keep last 50 activities
    });

    // Error events
    newSocket.on('error', (data) => {
      console.error('Collaboration error:', data.message);
    });

    setSocket(newSocket);
  }, [user, token, socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      console.log('Disconnecting from collaboration server...');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setCurrentProjectId(null);
      setActiveUsersInProject([]);
      setActiveUsersInFile(new Map());
      setUserCursors(new Map());
      setUserSelections(new Map());
    }
  }, [socket]);

  const joinProject = useCallback((projectId: string) => {
    if (socket && isConnected) {
      console.log('Joining project:', projectId);
      socket.emit('join-project', projectId);
    }
  }, [socket, isConnected]);

  const leaveProject = useCallback(() => {
    if (socket && isConnected && currentProjectId) {
      console.log('Leaving project:', currentProjectId);
      socket.emit('leave-project', currentProjectId);
      setCurrentProjectId(null);
      setActiveUsersInProject([]);
      setActiveUsersInFile(new Map());
      setUserCursors(new Map());
      setUserSelections(new Map());
    }
  }, [socket, isConnected, currentProjectId]);

  const openFile = useCallback((projectId: string, fileId: string) => {
    if (socket && isConnected) {
      console.log('Opening file:', fileId, 'in project:', projectId);
      socket.emit('open-file', { projectId, fileId });
    }
  }, [socket, isConnected]);

  const closeFile = useCallback((projectId: string, fileId: string) => {
    if (socket && isConnected) {
      console.log('Closing file:', fileId, 'in project:', projectId);
      socket.emit('close-file', { projectId, fileId });
    }
  }, [socket, isConnected]);

  const sendOperation = useCallback((fileId: string, operation: TextOperation) => {
    if (socket && isConnected) {
      socket.emit('operation', { fileId, operation });
    }
  }, [socket, isConnected]);

  const sendCursorMove = useCallback((fileId: string, line: number, column: number) => {
    if (socket && isConnected) {
      socket.emit('cursor-move', { fileId, line, column });
    }
  }, [socket, isConnected]);

  const sendSelectionChange = useCallback((fileId: string, startLine: number, startColumn: number, endLine: number, endColumn: number) => {
    if (socket && isConnected) {
      socket.emit('selection-change', { fileId, startLine, startColumn, endLine, endColumn });
    }
  }, [socket, isConnected]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && token && !socket) {
      connect();
    }
  }, [user, token, socket, connect]);

  // Auto-disconnect when user logs out
  useEffect(() => {
    if (!user || !token) {
      disconnect();
    }
  }, [user, token, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: CollaborationContextType = {
    socket,
    isConnected,
    currentProjectId,
    activeUsersInProject,
    activeUsersInFile,
    userCursors,
    userSelections,
    activityFeed,
    joinProject,
    leaveProject,
    openFile,
    closeFile,
    sendOperation,
    sendCursorMove,
    sendSelectionChange,
    connect,
    disconnect
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};