import { Server } from 'socket.io';
import { db } from '../config/database';

export interface ProjectUpdate {
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
  timestamp: Date;
  userInfo: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export class ProjectUpdateService {
  private static io: Server;

  static initialize(io: Server) {
    this.io = io;
  }

  /**
   * Emit a project update to all project members
   */
  static async emitProjectUpdate(update: Omit<ProjectUpdate, 'id' | 'timestamp' | 'userInfo'>) {
    try {
      // Get user info
      const user = await db('users')
        .select('id', 'first_name', 'last_name', 'avatar')
        .where('id', update.userId)
        .first();

      if (!user) return;

      const fullUpdate: ProjectUpdate = {
        ...update,
        id: this.generateUpdateId(),
        timestamp: new Date(),
        userInfo: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar
        }
      };

      // Store update in database for history
      await this.storeUpdate(fullUpdate);

      // Emit to project room
      this.io.to(`project:${update.projectId}`).emit('project_update', fullUpdate);

      // Also emit to specific update type listeners
      this.io.to(`project:${update.projectId}`).emit(`project_update:${update.type}`, fullUpdate);

      return fullUpdate;
    } catch (error) {
      console.error('Failed to emit project update:', error);
    }
  }

  /**
   * Get recent project updates
   */
  static async getRecentUpdates(projectId: string, limit: number = 50): Promise<ProjectUpdate[]> {
    try {
      const updates = await db('project_updates')
        .leftJoin('users', 'project_updates.user_id', 'users.id')
        .where('project_updates.project_id', projectId)
        .orderBy('project_updates.created_at', 'desc')
        .limit(limit)
        .select(
          'project_updates.*',
          'users.first_name',
          'users.last_name',
          'users.avatar'
        );

      return updates.map(row => ({
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        type: row.type,
        data: JSON.parse(row.data),
        timestamp: new Date(row.created_at),
        userInfo: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          avatar: row.avatar
        }
      }));
    } catch (error) {
      console.error('Failed to get recent updates:', error);
      return [];
    }
  }

  /**
   * File operation updates
   */
  static async emitFileCreated(projectId: string, userId: string, fileName: string, filePath: string) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'file_created',
      data: { fileName, filePath }
    });
  }

  static async emitFileUpdated(projectId: string, userId: string, fileName: string, filePath: string) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'file_updated',
      data: { fileName, filePath }
    });
  }

  static async emitFileDeleted(projectId: string, userId: string, fileName: string, filePath: string) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'file_deleted',
      data: { fileName, filePath }
    });
  }

  static async emitFileRenamed(projectId: string, userId: string, oldPath: string, newPath: string) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'file_renamed',
      data: { oldPath, newPath }
    });
  }

  /**
   * Member management updates
   */
  static async emitMemberAdded(projectId: string, userId: string, memberEmail: string, memberRole: string) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'member_added',
      data: { memberEmail, memberRole }
    });
  }

  static async emitMemberRemoved(projectId: string, userId: string, memberEmail: string) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'member_removed',
      data: { memberEmail }
    });
  }

  /**
   * Project setting updates
   */
  static async emitProjectUpdated(projectId: string, userId: string, projectName: string, changes: Record<string, any>) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'project_updated',
      data: { projectName, changes }
    });
  }

  /**
   * Collaboration updates
   */
  static async emitCollaborationJoined(projectId: string, userId: string) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'collaboration_joined',
      data: {}
    });
  }

  static async emitCollaborationLeft(projectId: string, userId: string) {
    return this.emitProjectUpdate({
      projectId,
      userId,
      type: 'collaboration_left',
      data: {}
    });
  }

  /**
   * Join project room for real-time updates
   */
  static async joinProjectRoom(socketId: string, projectId: string, userId: string) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      await socket.join(`project:${projectId}`);
      
      // Emit user joined event
      socket.to(`project:${projectId}`).emit('user_joined_project', {
        userId,
        timestamp: new Date()
      });

      return true;
    }
    return false;
  }

  /**
   * Leave project room
   */
  static async leaveProjectRoom(socketId: string, projectId: string, userId: string) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      await socket.leave(`project:${projectId}`);
      
      // Emit user left event
      socket.to(`project:${projectId}`).emit('user_left_project', {
        userId,
        timestamp: new Date()
      });

      return true;
    }
    return false;
  }

  /**
   * Get active users in project room
   */
  static async getActiveUsers(projectId: string): Promise<string[]> {
    try {
      const room = this.io.sockets.adapter.rooms.get(`project:${projectId}`);
      return room ? Array.from(room) : [];
    } catch (error) {
      console.error('Failed to get active users:', error);
      return [];
    }
  }

  /**
   * Clean up old updates (older than 30 days)
   */
  static async cleanupOldUpdates(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await db('project_updates')
        .where('created_at', '<', thirtyDaysAgo)
        .delete();

      return result;
    } catch (error) {
      console.error('Failed to cleanup old updates:', error);
      return 0;
    }
  }

  // Private helper methods

  private static generateUpdateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async storeUpdate(update: ProjectUpdate): Promise<void> {
    try {
      await db('project_updates').insert({
        id: update.id,
        project_id: update.projectId,
        user_id: update.userId,
        type: update.type,
        data: JSON.stringify(update.data),
        created_at: update.timestamp
      });
    } catch (error) {
      console.error('Failed to store project update:', error);
    }
  }
}