import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { ProjectFile, ProjectMember } from '../models/Project';
import { OperationalTransform, TextOperation } from '@swistack/shared/utils/operational-transform';
import ConflictResolver, { ConflictResolution, ConflictUtils } from '@swistack/shared/utils/conflict-resolution';
import { CollaborationActivity, ActivityType } from '../models/CollaborationActivity';
import { CollaborationSession } from '../models/CollaborationSession';
import { FileLock } from '../models/FileLock';
import { ProjectUpdateService } from './ProjectUpdateService';

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

export interface CollaborativeDocument {
  fileId: string;
  projectId: string;
  content: string;
  version: number;
  activeUsers: Map<string, CollaborativeUser>;
  locks: Set<string>;
  pendingOperations: Map<string, TextOperation[]>; // userId -> operations
}

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: Date;
}

export interface OperationTransform {
  operation: Operation;
  transformedOperation: Operation;
}

class CollaborationService {
  private io: Server;
  private documents: Map<string, CollaborativeDocument> = new Map();
  private userSockets: Map<string, Socket> = new Map();
  private activeRooms: Map<string, Set<string>> = new Map(); // projectId -> Set of userIds
  private conflictResolver: ConflictResolver = new ConflictResolver();
  private userPriorities: Map<string, number> = new Map(); // userId -> priority level

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        console.log('WebSocket auth attempt:', { 
          auth: socket.handshake.auth, 
          query: socket.handshake.query 
        });
        
        const token = socket.handshake.auth.token;
        if (!token) {
          console.log('WebSocket auth failed: No token provided');
          return next(new Error('Authentication token required'));
        }

        console.log('About to verify JWT with secret length:', process.env.JWT_SECRET?.length);
        console.log('JWT secret starts with:', process.env.JWT_SECRET?.substring(0, 50) + '...');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        console.log('JWT decoded successfully:', { userId: decoded.userId || decoded.id, email: decoded.email });
        
        console.log('Looking up user with ID:', decoded.userId || decoded.id);
        const user = await User.query().findById(decoded.userId || decoded.id);
        console.log('User lookup result:', user ? { id: user.id, email: user.email } : 'not found');
        
        if (!user) {
          console.log('WebSocket auth failed: User not found for ID', decoded.userId || decoded.id);
          return next(new Error('User not found'));
        }
        
        console.log('WebSocket auth successful for user:', user.email);

        socket.data.user = user;
        next();
      } catch (error) {
        console.log('WebSocket auth error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.name === 'TokenExpiredError') {
          console.log('JWT token expired');
          return next(new Error('Token expired'));
        }
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
          console.log('Invalid JWT token');
          return next(new Error('Invalid token'));
        }
        console.log('Other JWT/auth error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleUserConnection(socket);
    });
  }

  private handleUserConnection(socket: Socket) {
    const user = socket.data.user as User;
    console.log(`User ${user.username} connected to collaboration`);

    this.userSockets.set(user.id, socket);

    socket.on('join-project', async (projectId: string) => {
      await this.handleJoinProject(socket, user, projectId);
    });

    socket.on('leave-project', (projectId: string) => {
      this.handleLeaveProject(socket, user, projectId);
    });

    socket.on('open-file', async (data: { projectId: string; fileId: string }) => {
      await this.handleOpenFile(socket, user, data.projectId, data.fileId);
    });

    socket.on('close-file', (data: { projectId: string; fileId: string }) => {
      this.handleCloseFile(socket, user, data.projectId, data.fileId);
    });

    socket.on('operation', (data: { fileId: string; operation: TextOperation }) => {
      this.handleOperation(socket, user, data.fileId, data.operation);
    });

    socket.on('cursor-move', (data: { fileId: string; line: number; column: number }) => {
      this.handleCursorMove(socket, user, data.fileId, data.line, data.column);
    });

    socket.on('selection-change', (data: { 
      fileId: string; 
      startLine: number; 
      startColumn: number; 
      endLine: number; 
      endColumn: number 
    }) => {
      this.handleSelectionChange(socket, user, data);
    });

    socket.on('disconnect', () => {
      this.handleUserDisconnection(socket, user);
    });
  }

  private async handleJoinProject(socket: Socket, user: User, projectId: string) {
    try {
      // Verify user has access to project
      const project = await Project.query()
        .findById(projectId)
        .withGraphFetched('members')
        .where('members.userId', user.id)
        .orWhere('ownerId', user.id);

      if (!project) {
        socket.emit('error', { message: 'Project not found or access denied' });
        return;
      }

      socket.join(projectId);

      if (!this.activeRooms.has(projectId)) {
        this.activeRooms.set(projectId, new Set());
      }
      this.activeRooms.get(projectId)!.add(user.id);

      // Notify other users in the project
      socket.to(projectId).emit('user-joined', {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatarUrl
        }
      });

      // Send current active users to the joining user
      const activeUsers = Array.from(this.activeRooms.get(projectId) || [])
        .map(userId => this.userSockets.get(userId)?.data.user)
        .filter(Boolean)
        .map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          avatar: u.avatarUrl
        }));

      socket.emit('project-joined', { projectId, activeUsers });
      
      console.log(`User ${user.username} joined project ${projectId}`);
    } catch (error) {
      console.error('Error joining project:', error);
      socket.emit('error', { message: 'Failed to join project' });
    }
  }

  private handleLeaveProject(socket: Socket, user: User, projectId: string) {
    socket.leave(projectId);
    
    const activeUsers = this.activeRooms.get(projectId);
    if (activeUsers) {
      activeUsers.delete(user.id);
      if (activeUsers.size === 0) {
        this.activeRooms.delete(projectId);
      }
    }

    socket.to(projectId).emit('user-left', {
      userId: user.id
    });

    console.log(`User ${user.username} left project ${projectId}`);
  }

  private async handleOpenFile(socket: Socket, user: User, projectId: string, fileId: string) {
    try {
      const file = await ProjectFile.query()
        .findById(fileId)
        .where('projectId', projectId);

      if (!file) {
        socket.emit('error', { message: 'File not found' });
        return;
      }

      const documentKey = `${projectId}-${fileId}`;
      
      if (!this.documents.has(documentKey)) {
        this.documents.set(documentKey, {
          fileId,
          projectId,
          content: file.content || '',
          version: 0,
          activeUsers: new Map(),
          locks: new Set(),
          pendingOperations: new Map()
        });
      }

      const document = this.documents.get(documentKey)!;
      document.activeUsers.set(user.id, {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatarUrl,
        lastActivity: new Date()
      });

      socket.join(documentKey);

      // Send current document state to user
      socket.emit('file-opened', {
        fileId,
        projectId,
        content: document.content,
        version: document.version,
        activeUsers: Array.from(document.activeUsers.values())
      });

      // Notify other users in the document
      socket.to(documentKey).emit('user-joined-file', {
        fileId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatarUrl
        }
      });

      console.log(`User ${user.username} opened file ${fileId} in project ${projectId}`);
    } catch (error) {
      console.error('Error opening file:', error);
      socket.emit('error', { message: 'Failed to open file' });
    }
  }

  private handleCloseFile(socket: Socket, user: User, projectId: string, fileId: string) {
    const documentKey = `${projectId}-${fileId}`;
    const document = this.documents.get(documentKey);
    
    if (document) {
      document.activeUsers.delete(user.id);
      
      // If no users left, clean up the document after a delay
      if (document.activeUsers.size === 0) {
        setTimeout(() => {
          const doc = this.documents.get(documentKey);
          if (doc && doc.activeUsers.size === 0) {
            this.documents.delete(documentKey);
          }
        }, 30000); // Keep document for 30 seconds after last user leaves
      }
    }

    socket.leave(documentKey);
    socket.to(documentKey).emit('user-left-file', {
      fileId,
      userId: user.id
    });

    console.log(`User ${user.username} closed file ${fileId} in project ${projectId}`);
  }

  private async handleOperation(socket: Socket, user: User, fileId: string, operation: TextOperation) {
    // Find document by fileId across all projects
    let documentKey = '';
    let document: CollaborativeDocument | undefined;
    
    for (const [key, doc] of this.documents) {
      if (doc.fileId === fileId) {
        documentKey = key;
        document = doc;
        break;
      }
    }

    if (!document) {
      socket.emit('error', { message: 'Document not found' });
      return;
    }

    try {
      // Check if user has permission to edit
      const canEdit = await this.checkEditPermission(user.id, document.projectId, fileId);
      if (!canEdit) {
        socket.emit('error', { message: 'Insufficient permissions to edit this file' });
        return;
      }

      // Collect all pending operations from other users that might conflict
      const conflictingOperations: TextOperation[] = [];
      const allPendingOps: TextOperation[] = [];
      
      for (const [otherUserId, operations] of document.pendingOperations) {
        if (otherUserId !== user.id) {
          allPendingOps.push(...operations);
          // Check for potential conflicts
          for (const otherOp of operations) {
            if (ConflictResolver.detectConflict(operation, otherOp, document.content)) {
              conflictingOperations.push(otherOp);
            }
          }
        }
      }

      let transformedOperation = operation;
      let resolution: ConflictResolution | null = null;

      // If there are conflicts, try to resolve them
      if (conflictingOperations.length > 0) {
        const allConflictedOps = [operation, ...conflictingOperations];
        resolution = this.conflictResolver.resolveConflict(allConflictedOps, {
          baseContent: document.content,
          userPriorities: this.userPriorities,
          documentVersion: document.version
        });

        if (resolution.resolved && resolution.finalOperation) {
          transformedOperation = resolution.finalOperation;
          
          // Log conflict resolution
          await this.logActivity(document.projectId, user.id, fileId, 'file_edit', 
            `Resolved editing conflict using ${resolution.resolutionStrategy} strategy`);

          // Notify affected users about conflict resolution
          if (ConflictUtils.shouldNotifyUsers(resolution)) {
            const affectedUsers = ConflictUtils.getAffectedUsers(allConflictedOps);
            this.notifyConflictResolution(documentKey, affectedUsers, resolution);
          }
        } else {
          // Manual conflict resolution required
          socket.emit('conflict-detected', {
            fileId,
            conflictedOperations: resolution.conflictedOperations,
            resolutionRequired: true,
            message: 'Manual conflict resolution required'
          });
          return;
        }
      } else {
        // No conflicts, apply standard operational transformation
        for (const otherOp of allPendingOps) {
          const [transformed, ] = OperationalTransform.transform(transformedOperation, otherOp, 'left');
          transformedOperation = transformed;
        }
      }

      // Apply the transformed operation to document content
      const newContent = OperationalTransform.apply(document.content, transformedOperation);
      document.content = newContent;
      document.version++;

      // Store operation in pending operations for this user
      if (!document.pendingOperations.has(user.id)) {
        document.pendingOperations.set(user.id, []);
      }
      document.pendingOperations.get(user.id)!.push(transformedOperation);

      // Clean up old operations (keep only last 10 operations per user)
      const userOps = document.pendingOperations.get(user.id)!;
      if (userOps.length > 10) {
        document.pendingOperations.set(user.id, userOps.slice(-10));
      }

      // Update user activity
      const userInfo = document.activeUsers.get(user.id);
      if (userInfo) {
        userInfo.lastActivity = new Date();
      }

      // Broadcast transformed operation to other users in the document
      socket.to(documentKey).emit('operation-applied', {
        fileId,
        operation: transformedOperation,
        version: document.version,
        userId: user.id,
        conflictResolution: resolution ? {
          strategy: resolution.resolutionStrategy,
          summary: ConflictUtils.createResolutionSummary(resolution)
        } : undefined
      });

      // Acknowledge operation to sender
      socket.emit('operation-acknowledged', {
        fileId,
        version: document.version,
        conflictResolved: resolution?.resolved || false
      });

      // Log activity
      await this.logActivity(document.projectId, user.id, fileId, 'file_edit', 
        `edited ${document.fileId}`);

      // Persist changes to database (debounced)
      this.debouncedSave(fileId, document.content);
    } catch (error: any) {
      console.error('Error handling operation:', error);
      socket.emit('error', { message: 'Failed to apply operation' });
    }
  }

  private handleCursorMove(socket: Socket, user: User, fileId: string, line: number, column: number) {
    // Find document by fileId
    let documentKey = '';
    let document: CollaborativeDocument | undefined;
    
    for (const [key, doc] of this.documents) {
      if (doc.fileId === fileId) {
        documentKey = key;
        document = doc;
        break;
      }
    }

    if (!document) return;

    const userInfo = document.activeUsers.get(user.id);
    if (userInfo) {
      userInfo.cursor = { line, column };
      userInfo.lastActivity = new Date();
    }

    socket.to(documentKey).emit('cursor-moved', {
      fileId,
      userId: user.id,
      line,
      column
    });
  }

  private handleSelectionChange(socket: Socket, user: User, data: {
    fileId: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }) {
    // Find document by fileId
    let documentKey = '';
    let document: CollaborativeDocument | undefined;
    
    for (const [key, doc] of this.documents) {
      if (doc.fileId === data.fileId) {
        documentKey = key;
        document = doc;
        break;
      }
    }

    if (!document) return;

    const userInfo = document.activeUsers.get(user.id);
    if (userInfo) {
      userInfo.selection = {
        startLine: data.startLine,
        startColumn: data.startColumn,
        endLine: data.endLine,
        endColumn: data.endColumn
      };
      userInfo.lastActivity = new Date();
    }

    socket.to(documentKey).emit('selection-changed', {
      fileId: data.fileId,
      userId: user.id,
      startLine: data.startLine,
      startColumn: data.startColumn,
      endLine: data.endLine,
      endColumn: data.endColumn
    });
  }

  private handleUserDisconnection(socket: Socket, user: User) {
    console.log(`User ${user.username} disconnected from collaboration`);
    
    this.userSockets.delete(user.id);

    // Remove user from all active rooms and documents
    for (const [projectId, userIds] of this.activeRooms) {
      if (userIds.has(user.id)) {
        userIds.delete(user.id);
        socket.to(projectId).emit('user-left', { userId: user.id });
        
        if (userIds.size === 0) {
          this.activeRooms.delete(projectId);
        }
      }
    }

    // Remove user from all documents
    for (const [documentKey, document] of this.documents) {
      if (document.activeUsers.has(user.id)) {
        document.activeUsers.delete(user.id);
        socket.to(documentKey).emit('user-left-file', {
          fileId: document.fileId,
          userId: user.id
        });
      }
    }
  }


  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private debouncedSave(fileId: string, content: string) {
    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(fileId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to save after 2 seconds of inactivity
    const timeout = setTimeout(async () => {
      try {
        await ProjectFile.query()
          .patch({ content })
          .where('id', fileId);
        
        console.log(`Auto-saved file ${fileId}`);
        this.saveTimeouts.delete(fileId);
      } catch (error) {
        console.error(`Failed to auto-save file ${fileId}:`, error);
      }
    }, 2000);

    this.saveTimeouts.set(fileId, timeout);
  }

  // Public method to get active users in a project
  public getActiveUsersInProject(projectId: string): string[] {
    return Array.from(this.activeRooms.get(projectId) || []);
  }

  // Public method to get active users in a document
  public getActiveUsersInDocument(projectId: string, fileId: string): CollaborativeUser[] {
    const documentKey = `${projectId}-${fileId}`;
    const document = this.documents.get(documentKey);
    return document ? Array.from(document.activeUsers.values()) : [];
  }

  // Method to force save all documents
  public async saveAllDocuments(): Promise<void> {
    const savePromises: Promise<void>[] = [];
    
    for (const [documentKey, document] of this.documents) {
      const savePromise = ProjectFile.query()
        .patch({ content: document.content })
        .where('id', document.fileId)
        .then(() => {
          console.log(`Force saved document ${documentKey}`);
        })
        .catch((error) => {
          console.error(`Failed to force save document ${documentKey}:`, error);
        });
      
      savePromises.push(savePromise);
    }

    await Promise.all(savePromises);
  }

  // Check if user has edit permissions for a file
  private async checkEditPermission(userId: string, projectId: string, fileId: string): Promise<boolean> {
    try {
      // Check project membership and permissions
      const membership = await ProjectMember.query()
        .where('projectId', projectId)
        .where('userId', userId)
        .where('status', 'accepted')
        .first();

      if (!membership) {
        return false; // User is not a project member
      }

      if (!membership.canEdit) {
        return false; // User doesn't have edit permissions
      }

      // Check if file is locked by another user
      const canEdit = await FileLock.canUserEdit(fileId, userId);
      return canEdit;
    } catch (error) {
      console.error('Error checking edit permission:', error);
      return false;
    }
  }

  // Log collaboration activity
  private async logActivity(
    projectId: string, 
    userId: string, 
    fileId: string, 
    type: ActivityType, 
    message: string
  ): Promise<void> {
    try {
      await CollaborationActivity.createActivity({
        projectId,
        userId,
        fileId,
        activityType: type,
        message
      });

      // Broadcast activity to project members
      this.io.to(projectId).emit('activity-update', {
        projectId,
        userId,
        fileId,
        type,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Notify users about conflict resolution
  private notifyConflictResolution(
    documentKey: string, 
    affectedUserIds: string[], 
    resolution: ConflictResolution
  ): void {
    this.io.to(documentKey).emit('conflict-resolved', {
      resolution: {
        strategy: resolution.resolutionStrategy,
        summary: ConflictUtils.createResolutionSummary(resolution),
        affectedUsers: affectedUserIds,
        timestamp: new Date()
      }
    });
  }

  // Set user priority for conflict resolution
  public setUserPriority(userId: string, priority: number): void {
    this.userPriorities.set(userId, priority);
  }

  // Get user priority
  public getUserPriority(userId: string): number {
    return this.userPriorities.get(userId) || 0;
  }

  // Auto-cleanup old sessions and locks
  private startCleanupScheduler(): void {
    // Clean up every 5 minutes
    setInterval(async () => {
      try {
        await CollaborationSession.cleanupOldSessions(24);
        await FileLock.cleanupExpiredLocks();
        console.log('Cleaned up old collaboration sessions and locks');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Initialize collaboration service
  public initialize(): void {
    this.startCleanupScheduler();
    console.log('Collaboration service initialized');
  }
}

export { CollaborationService };