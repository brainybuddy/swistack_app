import { Model } from 'objection';
import { User } from './User';
import { ProjectFile } from './Project';

export type LockType = 'exclusive' | 'shared';

export class FileLock extends Model {
  static tableName = 'file_locks';

  id!: string;
  fileId!: string;
  userId!: string;
  lockType!: LockType;
  lockedAt!: Date;
  expiresAt?: Date;
  sessionId!: string;
  isActive!: boolean;

  // Relations
  user?: User;
  file?: ProjectFile;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'file_locks.userId',
        to: 'users.id'
      }
    },
    file: {
      relation: Model.BelongsToOneRelation,
      modelClass: ProjectFile,
      join: {
        from: 'file_locks.fileId',
        to: 'project_files.id'
      }
    }
  };

  $beforeInsert() {
    this.lockedAt = new Date();
  }

  // Acquire a lock on a file
  static async acquireLock(
    fileId: string, 
    userId: string, 
    sessionId: string, 
    lockType: LockType = 'shared',
    expirationMinutes?: number
  ) {
    // Check if user already has a lock
    const existingLock = await this.query()
      .where('fileId', fileId)
      .where('userId', userId)
      .where('sessionId', sessionId)
      .where('isActive', true)
      .first();

    if (existingLock) {
      return existingLock;
    }

    // Check for conflicting locks
    if (lockType === 'exclusive') {
      const conflictingLocks = await this.query()
        .where('fileId', fileId)
        .where('isActive', true)
        .where('userId', '!=', userId);

      if (conflictingLocks.length > 0) {
        throw new Error('File is currently locked by another user');
      }
    } else {
      // For shared locks, check for exclusive locks
      const exclusiveLock = await this.query()
        .where('fileId', fileId)
        .where('lockType', 'exclusive')
        .where('isActive', true)
        .where('userId', '!=', userId)
        .first();

      if (exclusiveLock) {
        throw new Error('File is exclusively locked by another user');
      }
    }

    const expiresAt = expirationMinutes 
      ? new Date(Date.now() + expirationMinutes * 60 * 1000)
      : undefined;

    return await this.query().insert({
      fileId,
      userId,
      lockType,
      sessionId,
      expiresAt,
      isActive: true
    });
  }

  // Release a lock
  static async releaseLock(fileId: string, userId: string, sessionId: string) {
    return await this.query()
      .where('fileId', fileId)
      .where('userId', userId)
      .where('sessionId', sessionId)
      .where('isActive', true)
      .patch({ isActive: false });
  }

  // Release all locks for a session
  static async releaseAllLocksForSession(sessionId: string) {
    return await this.query()
      .where('sessionId', sessionId)
      .where('isActive', true)
      .patch({ isActive: false });
  }

  // Release all locks for a user
  static async releaseAllLocksForUser(userId: string) {
    return await this.query()
      .where('userId', userId)
      .where('isActive', true)
      .patch({ isActive: false });
  }

  // Get active locks for a file
  static async getActiveLocksForFile(fileId: string) {
    return await this.query()
      .where('fileId', fileId)
      .where('isActive', true)
      .where(function() {
        this.whereNull('expiresAt')
          .orWhere('expiresAt', '>', new Date());
      })
      .withGraphFetched('user')
      .orderBy('lockedAt', 'desc');
  }

  // Check if a file is locked
  static async isFileLocked(fileId: string, excludeUserId?: string) {
    const query = this.query()
      .where('fileId', fileId)
      .where('isActive', true)
      .where(function() {
        this.whereNull('expiresAt')
          .orWhere('expiresAt', '>', new Date());
      });

    if (excludeUserId) {
      query.where('userId', '!=', excludeUserId);
    }

    const locks = await query;
    return locks.length > 0;
  }

  // Check if a user can edit a file
  static async canUserEdit(fileId: string, userId: string) {
    const activeLocks = await this.getActiveLocksForFile(fileId);
    
    if (activeLocks.length === 0) {
      return true; // No locks, user can edit
    }

    // Check if user has a lock
    const userHasLock = activeLocks.some(lock => lock.userId === userId);
    if (userHasLock) {
      return true;
    }

    // Check for exclusive locks by other users
    const exclusiveLocks = activeLocks.filter(lock => 
      lock.lockType === 'exclusive' && lock.userId !== userId
    );

    return exclusiveLocks.length === 0;
  }

  // Cleanup expired locks
  static async cleanupExpiredLocks() {
    return await this.query()
      .where('is_active', true)
      .whereNotNull('expires_at')
      .where('expires_at', '<', new Date())
      .patch({ is_active: false });
  }

  // Auto-extend lock expiration
  async extendExpiration(additionalMinutes: number) {
    const newExpiration = this.expiresAt 
      ? new Date(this.expiresAt.getTime() + additionalMinutes * 60 * 1000)
      : new Date(Date.now() + additionalMinutes * 60 * 1000);

    return await this.$query().patch({
      expiresAt: newExpiration
    });
  }
}