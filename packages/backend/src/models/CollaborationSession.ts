import { Model } from 'objection';
import { User } from './User';
import { Project } from './Project';
import { ProjectFile } from './Project';

export class CollaborationSession extends Model {
  static tableName = 'collaboration_sessions';

  id!: string;
  projectId!: string;
  userId!: string;
  fileId?: string;
  joinedAt!: Date;
  lastActivity!: Date;
  cursorPosition?: {
    line: number;
    column: number;
  };
  selectionRange?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  sessionId!: string;
  isActive!: boolean;

  // Relations
  user?: User;
  project?: Project;
  file?: ProjectFile;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'collaboration_sessions.userId',
        to: 'users.id'
      }
    },
    project: {
      relation: Model.BelongsToOneRelation,
      modelClass: Project,
      join: {
        from: 'collaboration_sessions.projectId',
        to: 'projects.id'
      }
    },
    file: {
      relation: Model.BelongsToOneRelation,
      modelClass: ProjectFile,
      join: {
        from: 'collaboration_sessions.fileId',
        to: 'project_files.id'
      }
    }
  };

  $beforeInsert() {
    this.joinedAt = new Date();
    this.lastActivity = new Date();
  }

  $beforeUpdate() {
    this.lastActivity = new Date();
  }

  // Update user activity
  async updateActivity(cursorPosition?: { line: number; column: number }, selectionRange?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }) {
    return await this.$query().patch({
      lastActivity: new Date(),
      cursorPosition,
      selectionRange
    });
  }

  // Mark session as inactive
  async deactivate() {
    return await this.$query().patch({
      isActive: false
    });
  }

  // Get active sessions for a project
  static async getActiveSessionsForProject(projectId: string) {
    return await this.query()
      .where('projectId', projectId)
      .where('isActive', true)
      .withGraphFetched('user')
      .orderBy('lastActivity', 'desc');
  }

  // Get active sessions for a file
  static async getActiveSessionsForFile(fileId: string) {
    return await this.query()
      .where('fileId', fileId)
      .where('isActive', true)
      .withGraphFetched('user')
      .orderBy('lastActivity', 'desc');
  }

  // Cleanup old inactive sessions
  static async cleanupOldSessions(olderThanHours: number = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    return await this.query()
      .where('lastActivity', '<', cutoffTime)
      .orWhere('isActive', false)
      .delete();
  }
}