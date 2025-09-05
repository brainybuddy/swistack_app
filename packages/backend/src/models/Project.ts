import { Model } from 'objection';
import { db } from '../config/database';
import { Project as ProjectType, ProjectMember as ProjectMemberType, ProjectFile as ProjectFileType, ProjectTemplate } from '@swistack/shared';
import slugify from 'slugify';
import { User } from './User';

export interface DatabaseProject {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  template: string;
  status: 'active' | 'archived' | 'deleted';
  settings: any;
  repositoryUrl?: string;
  branch: string;
  environment: any;
  isPublic: boolean;
  slug: string;
  storageUsed: number;
  storageLimit: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  invitedAt: Date;
  joinedAt?: Date;
  invitedBy?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseProjectFile {
  id: string;
  projectId: string;
  path: string;
  name: string;
  type: 'file' | 'directory';
  mimeType?: string;
  size: number;
  storageKey?: string;
  content?: string;
  encoding: string;
  isBinary: boolean;
  parentId?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Objection.js Models
export class Project extends Model {
  static tableName = 'projects';

  id!: string;
  name!: string;
  description?: string;
  ownerId!: string;
  template!: string;
  status!: 'active' | 'archived' | 'deleted';
  settings!: any;
  repositoryUrl?: string;
  branch!: string;
  environment!: any;
  isPublic!: boolean;
  slug!: string;
  storageUsed!: number;
  storageLimit!: number;
  lastAccessedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  owner?: User;
  members?: ProjectMember[];
  files?: ProjectFile[];

  static relationMappings = {
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'projects.ownerId',
        to: 'users.id'
      }
    },
    members: {
      relation: Model.HasManyRelation,
      modelClass: 'ProjectMember',
      join: {
        from: 'projects.id',
        to: 'project_members.projectId'
      }
    },
    files: {
      relation: Model.HasManyRelation,
      modelClass: 'ProjectFile',
      join: {
        from: 'projects.id',
        to: 'project_files.projectId'
      }
    }
  };

  $beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }
}

export class ProjectMember extends Model {
  static tableName = 'project_members';

  id!: string;
  projectId!: string;
  userId!: string;
  role!: 'owner' | 'editor' | 'viewer';
  collaborationRole!: 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter';
  canEdit!: boolean;
  canComment!: boolean;
  canViewActivity!: boolean;
  canManagePermissions!: boolean;
  invitedAt!: Date;
  joinedAt?: Date;
  invitedBy?: string;
  status!: 'pending' | 'accepted' | 'declined';
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  user?: User;
  project?: Project;
  invitedByUser?: User;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'project_members.userId',
        to: 'users.id'
      }
    },
    project: {
      relation: Model.BelongsToOneRelation,
      modelClass: 'Project',
      join: {
        from: 'project_members.projectId',
        to: 'projects.id'
      }
    },
    invitedByUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'project_members.invitedBy',
        to: 'users.id'
      }
    }
  };

  $beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.invitedAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }

  // Check if user has permission for an action
  hasPermission(action: 'edit' | 'comment' | 'view_activity' | 'manage_permissions'): boolean {
    switch (action) {
      case 'edit':
        return this.canEdit;
      case 'comment':
        return this.canComment;
      case 'view_activity':
        return this.canViewActivity;
      case 'manage_permissions':
        return this.canManagePermissions;
      default:
        return false;
    }
  }

  // Get collaboration permissions
  getCollaborationPermissions() {
    return {
      canEdit: this.canEdit,
      canView: true, // All members can view
      canComment: this.canComment,
      canManageUsers: this.canManagePermissions,
      role: this.collaborationRole
    };
  }
}

export class ProjectFile extends Model {
  static tableName = 'project_files';

  id!: string;
  projectId!: string;
  path!: string;
  name!: string;
  type!: 'file' | 'directory';
  mimeType?: string;
  size!: number;
  storageKey?: string;
  content?: string;
  encoding!: string;
  isBinary!: boolean;
  parentId?: string;
  createdBy!: string;
  updatedBy?: string;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  project?: Project;
  parent?: ProjectFile;
  children?: ProjectFile[];
  creator?: User;
  updater?: User;

  static relationMappings = {
    project: {
      relation: Model.BelongsToOneRelation,
      modelClass: 'Project',
      join: {
        from: 'project_files.projectId',
        to: 'projects.id'
      }
    },
    parent: {
      relation: Model.BelongsToOneRelation,
      modelClass: 'ProjectFile',
      join: {
        from: 'project_files.parentId',
        to: 'project_files.id'
      }
    },
    children: {
      relation: Model.HasManyRelation,
      modelClass: 'ProjectFile',
      join: {
        from: 'project_files.id',
        to: 'project_files.parentId'
      }
    },
    creator: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'project_files.createdBy',
        to: 'users.id'
      }
    },
    updater: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'project_files.updatedBy',
        to: 'users.id'
      }
    }
  };

  $beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }
}

export class ProjectModel {
  static async create(data: {
    name: string;
    description?: string;
    ownerId: string;
    template: string;
    isPublic?: boolean;
    settings?: any;
    environment?: any;
  }): Promise<DatabaseProject> {
    const slug = await this.generateUniqueSlug(data.name);
    
    const [project] = await db('projects')
      .insert({
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        template: data.template,
        isPublic: data.isPublic || false,
        settings: JSON.stringify(data.settings || {}),
        environment: JSON.stringify(data.environment || {}),
        slug,
      })
      .returning('*');

    // Create owner membership
    await db('project_members').insert({
      projectId: project.id,
      userId: data.ownerId,
      role: 'owner',
      status: 'accepted',
      joinedAt: new Date(),
    });

    return project;
  }

  static async findById(id: string, userId?: string): Promise<DatabaseProject | null> {
    try {
      // Validate UUID format first
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return null; // Not a valid UUID, return null so slug lookup can be tried
      }
      
      let query = db('projects').where('id', id);
    
    // If userId provided, check if user has access
    if (userId) {
      try {
        const tableExists = await db.schema.hasTable('project_members');
        
        query = query.andWhere(function() {
          this.where('isPublic', true)
            .orWhere('ownerId', userId);
            
          if (tableExists) {
            this.orWhereExists(function() {
              this.select('*')
                .from('project_members')
                .whereRaw('project_members."projectId" = projects.id')
                .where('userId', userId)
                .where('status', 'accepted');
            });
          }
        });
      } catch (error) {
        // Fallback to basic access check
        query = query.andWhere(function() {
          this.where('isPublic', true)
            .orWhere('ownerId', userId);
        });
      }
    }
    
    const project = await query.first();
    return project || null;
    } catch (error) {
      // If UUID parsing fails or any other error, return null
      console.log('findById error (expected for non-UUID identifiers):', error.message);
      return null;
    }
  }

  static async findBySlug(slug: string, userId?: string): Promise<DatabaseProject | null> {
    let query = db('projects').where('slug', slug);
    
    if (userId) {
      try {
        const tableExists = await db.schema.hasTable('project_members');
        
        query = query.andWhere(function() {
          this.where('isPublic', true)
            .orWhere('ownerId', userId);
            
          if (tableExists) {
            this.orWhereExists(function() {
              this.select('*')
                .from('project_members')
                .whereRaw('project_members."projectId" = projects.id')
                .where('userId', userId)
                .where('status', 'accepted');
            });
          }
        });
      } catch (error) {
        // Fallback to basic access check
        query = query.andWhere(function() {
          this.where('isPublic', true)
            .orWhere('ownerId', userId);
        });
      }
    }
    
    const project = await query.first();
    return project || null;
  }

  static async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      template?: string;
      status?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ projects: DatabaseProject[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      template,
      status = 'active',
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = options;

    try {
      // Check if project_members table exists
      const tableExists = await db.schema.hasTable('project_members');
      
      let query = db('projects');
      
      if (tableExists) {
        query = query.where(function() {
          this.where('ownerId', userId)
            .orWhereExists(function() {
              this.select('*')
                .from('project_members')
                .whereRaw('project_members."projectId" = projects.id')
                .where('userId', userId)
                .where('status', 'accepted');
            });
        });
      } else {
        // Fallback: only show owned projects if project_members table doesn't exist
        query = query.where('ownerId', userId);
      }
      
      query = query.where('status', status);

      if (template) {
        query = query.where('template', template);
      }

      if (search) {
        query = query.where(function() {
          this.whereILike('name', `%${search}%`)
            .orWhereILike('description', `%${search}%`);
        });
      }

      const total = await query.clone().count('* as count').first();
      const projects = await query
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset((page - 1) * limit)
        .select('*');

      return {
        projects,
        total: parseInt(total?.count as string) || 0,
      };
    } catch (error) {
      console.error('Error in findByUser:', error);
      // Fallback to owned projects only if there's any database error
      let query = db('projects')
        .where('ownerId', userId)
        .where('status', status);

      if (template) {
        query = query.where('template', template);
      }

      if (search) {
        query = query.where(function() {
          this.whereILike('name', `%${search}%`)
            .orWhereILike('description', `%${search}%`);
        });
      }

      const total = await query.clone().count('* as count').first();
      const projects = await query
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset((page - 1) * limit)
        .select('*');

      return {
        projects,
        total: parseInt(total?.count as string) || 0,
      };
    }
  }

  static async updateById(id: string, data: Partial<DatabaseProject>): Promise<DatabaseProject | null> {
    const [project] = await db('projects')
      .where('id', id)
      .update({
        ...data,
        settings: data.settings ? JSON.stringify(data.settings) : undefined,
        environment: data.environment ? JSON.stringify(data.environment) : undefined,
        updatedAt: new Date(),
      })
      .returning('*');

    return project || null;
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await db('projects')
      .where('id', id)
      .update({
        status: 'deleted',
        updatedAt: new Date(),
      });

    return result > 0;
  }

  static async updateLastAccessed(id: string): Promise<void> {
    await db('projects')
      .where('id', id)
      .update({
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
      });
  }

  static async updateStorageUsage(id: string, storageUsed: number): Promise<void> {
    await db('projects')
      .where('id', id)
      .update({
        storageUsed,
        updatedAt: new Date(),
      });
  }

  // Project Members
  static async addMember(data: {
    projectId: string;
    userId: string;
    role: 'editor' | 'viewer';
    invitedBy: string;
  }): Promise<DatabaseProjectMember> {
    const [member] = await db('project_members')
      .insert({
        projectId: data.projectId,
        userId: data.userId,
        role: data.role,
        invitedBy: data.invitedBy,
        status: 'pending',
      })
      .returning('*');

    return member;
  }

  static async updateMember(
    projectId: string,
    userId: string,
    data: { role?: string; status?: string }
  ): Promise<DatabaseProjectMember | null> {
    const [member] = await db('project_members')
      .where({ projectId, userId })
      .update({
        ...data,
        joinedAt: data.status === 'accepted' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .returning('*');

    return member || null;
  }

  static async removeMember(projectId: string, userId: string): Promise<boolean> {
    const result = await db('project_members')
      .where({ projectId, userId })
      .del();

    return result > 0;
  }

  static async getMembers(projectId: string): Promise<DatabaseProjectMember[]> {
    return await db('project_members')
      .where('projectId', projectId)
      .orderBy('role')
      .orderBy('createdAt');
  }

  static async getMemberRole(projectId: string, userId: string): Promise<string | null> {
    const member = await db('project_members')
      .where({ projectId, userId, status: 'accepted' })
      .first();

    if (member) return member.role;

    // Check if user is owner
    const project = await db('projects')
      .where({ id: projectId, ownerId: userId })
      .first();

    return project ? 'owner' : null;
  }

  // Helper methods
  private static async generateUniqueSlug(name: string): Promise<string> {
    let baseSlug = slugify(name, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g 
    });
    
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db('projects').where('slug', slug).first();
      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  static async findPublicProjects(options: {
    page?: number;
    limit?: number;
    template?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ projects: DatabaseProject[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      template,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = options;

    let query = db('projects')
      .where('isPublic', true)
      .where('status', 'active');

    if (template) {
      query = query.where('template', template);
    }

    if (search) {
      query = query.where(function() {
        this.whereILike('name', `%${search}%`)
          .orWhereILike('description', `%${search}%`);
      });
    }

    const total = await query.clone().count('* as count').first();
    const projects = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset((page - 1) * limit)
      .select('*');

    return {
      projects,
      total: parseInt(total?.count as string) || 0,
    };
  }

}