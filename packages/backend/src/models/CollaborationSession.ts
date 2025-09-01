import { Model } from 'objection';
import { User } from './User';
import { Project } from './Project';
import { ProjectFile } from './Project';

export class CollaborationSession extends Model {
  static tableName = 'collaboration_sessions';

  // Map camelCase properties to snake_case database columns
  static columnNameMappers = {
    format(model: any) {
      return Object.keys(model).reduce((mapped: any, key) => {
        // Convert camelCase to snake_case for database
        const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        mapped[dbKey] = model[key];
        return mapped;
      }, {});
    },
    parse(row: any) {
      return Object.keys(row).reduce((parsed: any, key) => {
        // Convert snake_case to camelCase for model
        const modelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        parsed[modelKey] = row[key];
        return parsed;
      }, {});
    }
  };

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
      last_activity: new Date(),
      cursor_position: cursorPosition,
      selection_range: selectionRange
    });
  }

  // Mark session as inactive
  async deactivate() {
    return await this.$query().patch({
      is_active: false
    });
  }

  // Get active sessions for a project
  static async getActiveSessionsForProject(projectId: string) {
    return await this.query()
      .where('project_id', projectId)
      .where('is_active', true)
      .withGraphFetched('user')
      .orderBy('last_activity', 'desc');
  }

  // Get active sessions for a file
  static async getActiveSessionsForFile(fileId: string) {
    return await this.query()
      .where('file_id', fileId)
      .where('is_active', true)
      .withGraphFetched('user')
      .orderBy('last_activity', 'desc');
  }

  // Cleanup old inactive sessions
  static async cleanupOldSessions(olderThanHours: number = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    return await this.query()
      .where('last_activity', '<', cutoffTime)
      .orWhere('is_active', false)
      .delete();
  }
}