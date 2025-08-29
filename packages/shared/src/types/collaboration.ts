export interface CollaborativeUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  lastActivity: Date;
}

import { TextOperation } from '../utils/operational-transform';

export interface CollaborationEvent {
  type: 'user-joined' | 'user-left' | 'user-joined-file' | 'user-left-file' | 
        'operation-applied' | 'cursor-moved' | 'selection-changed';
  data: any;
}

export interface ProjectPresence {
  projectId: string;
  activeUsers: CollaborativeUser[];
}

export interface FilePresence {
  fileId: string;
  projectId: string;
  activeUsers: CollaborativeUser[];
  version: number;
}

export interface CursorPosition {
  userId: string;
  line: number;
  column: number;
}

export interface SelectionRange {
  userId: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface OperationTransform {
  operation: TextOperation;
  transformedOperation: TextOperation;
  conflicts?: TextOperation[];
}

export interface ActivityFeedItem {
  id: string;
  type: 'file-edit' | 'file-create' | 'file-delete' | 'user-join' | 'user-leave';
  userId: string;
  username: string;
  projectId: string;
  fileId?: string;
  fileName?: string;
  message: string;
  timestamp: Date;
}

export interface CollaborationPermissions {
  canEdit: boolean;
  canView: boolean;
  canComment: boolean;
  canManageUsers: boolean;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

// Socket.io event types
export interface ServerToClientEvents {
  'user-joined': (data: { user: CollaborativeUser }) => void;
  'user-left': (data: { userId: string }) => void;
  'user-joined-file': (data: { fileId: string; user: CollaborativeUser }) => void;
  'user-left-file': (data: { fileId: string; userId: string }) => void;
  'operation-applied': (data: { 
    fileId: string; 
    operation: TextOperation; 
    version: number; 
    userId: string 
  }) => void;
  'cursor-moved': (data: { 
    fileId: string; 
    userId: string; 
    line: number; 
    column: number 
  }) => void;
  'selection-changed': (data: {
    fileId: string;
    userId: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }) => void;
  'project-joined': (data: { projectId: string; activeUsers: CollaborativeUser[] }) => void;
  'file-opened': (data: {
    fileId: string;
    projectId: string;
    content: string;
    version: number;
    activeUsers: CollaborativeUser[];
  }) => void;
  'activity-update': (data: { activity: ActivityFeedItem }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join-project': (projectId: string) => void;
  'leave-project': (projectId: string) => void;
  'open-file': (data: { projectId: string; fileId: string }) => void;
  'close-file': (data: { projectId: string; fileId: string }) => void;
  'operation': (data: { fileId: string; operation: TextOperation }) => void;
  'cursor-move': (data: { fileId: string; line: number; column: number }) => void;
  'selection-change': (data: { 
    fileId: string; 
    startLine: number; 
    startColumn: number; 
    endLine: number; 
    endColumn: number 
  }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}