import { Model } from 'objection';
import { User } from './User';
import { Project } from './Project';
import { ProjectFile } from './Project';

export type ActivityType = 
  | 'file_edit' 
  | 'file_create' 
  | 'file_delete' 
  | 'file_rename'
  | 'user_join' 
  | 'user_leave' 
  | 'user_invite' 
  | 'permission_change'
  | 'comment_add' 
  | 'comment_edit' 
  | 'comment_delete';

export class CollaborationActivity extends Model {
  static tableName = 'collaboration_activities';

  id!: string;
  projectId!: string;
  userId!: string;
  fileId?: string;
  activityType!: ActivityType;
  message!: string;
  metadata?: any;
  createdAt!: Date;

  // Relations
  user?: User;
  project?: Project;
  file?: ProjectFile;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'collaboration_activities.userId',
        to: 'users.id'
      }
    },
    project: {
      relation: Model.BelongsToOneRelation,
      modelClass: Project,
      join: {
        from: 'collaboration_activities.projectId',
        to: 'projects.id'
      }
    },
    file: {
      relation: Model.BelongsToOneRelation,
      modelClass: ProjectFile,
      join: {
        from: 'collaboration_activities.fileId',
        to: 'project_files.id'
      }
    }
  };

  $beforeInsert() {
    this.createdAt = new Date();
  }

  // Create a new activity
  static async createActivity(data: {
    projectId: string;
    userId: string;
    fileId?: string;
    activityType: ActivityType;
    message: string;
    metadata?: any;
  }) {
    return await this.query().insert({
      ...data,
      createdAt: new Date()
    });
  }

  // Get activities for a project
  static async getActivitiesForProject(projectId: string, limit: number = 50, offset: number = 0) {
    return await this.query()
      .where('projectId', projectId)
      .withGraphFetched('[user, file]')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Get activities for a file
  static async getActivitiesForFile(fileId: string, limit: number = 20, offset: number = 0) {
    return await this.query()
      .where('fileId', fileId)
      .withGraphFetched('[user, file]')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Get activities for a user
  static async getActivitiesForUser(userId: string, limit: number = 50, offset: number = 0) {
    return await this.query()
      .where('userId', userId)
      .withGraphFetched('[user, project, file]')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Cleanup old activities
  static async cleanupOldActivities(olderThanDays: number = 30) {
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - olderThanDays);

    return await this.query()
      .where('createdAt', '<', cutoffTime)
      .delete();
  }

  // Helper methods for creating specific activity types
  static async logFileEdit(projectId: string, userId: string, fileId: string, fileName: string) {
    return await this.createActivity({
      projectId,
      userId,
      fileId,
      activityType: 'file_edit',
      message: `edited ${fileName}`,
      metadata: { fileName }
    });
  }

  static async logFileCreate(projectId: string, userId: string, fileId: string, fileName: string) {
    return await this.createActivity({
      projectId,
      userId,
      fileId,
      activityType: 'file_create',
      message: `created ${fileName}`,
      metadata: { fileName }
    });
  }

  static async logFileDelete(projectId: string, userId: string, fileName: string) {
    return await this.createActivity({
      projectId,
      userId,
      activityType: 'file_delete',
      message: `deleted ${fileName}`,
      metadata: { fileName }
    });
  }

  static async logUserJoin(projectId: string, userId: string, username: string) {
    return await this.createActivity({
      projectId,
      userId,
      activityType: 'user_join',
      message: `${username} joined the project`,
      metadata: { username }
    });
  }

  static async logUserLeave(projectId: string, userId: string, username: string) {
    return await this.createActivity({
      projectId,
      userId,
      activityType: 'user_leave',
      message: `${username} left the project`,
      metadata: { username }
    });
  }

  static async logPermissionChange(projectId: string, userId: string, targetUserId: string, targetUsername: string, newRole: string) {
    return await this.createActivity({
      projectId,
      userId,
      activityType: 'permission_change',
      message: `changed ${targetUsername}'s role to ${newRole}`,
      metadata: { targetUserId, targetUsername, newRole }
    });
  }
}