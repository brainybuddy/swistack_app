import { ProjectModel, DatabaseProject } from '../models/Project';
import { ProjectFileModel } from '../models/ProjectFile';
import { TemplateService } from './TemplateService';
import { storageService } from './StorageService';
import { CreateProjectRequest, UpdateProjectRequest } from '@swistack/shared';

export class ProjectService {
  static async createProject(
    userId: string,
    data: CreateProjectRequest
  ): Promise<DatabaseProject> {
    try {
      // Get template
      const template = await TemplateService.getByKey(data.template);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create project
      const project = await ProjectModel.create({
        name: data.name,
        description: data.description,
        ownerId: userId,
        template: data.template,
        isPublic: data.isPublic || false,
        settings: data.settings || {},
        environment: data.environment || {},
      });

      // Create project files from template
      await this.createProjectFromTemplate(project.id, template, userId);

      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  static async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectRequest
  ): Promise<DatabaseProject> {
    // Check permissions
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (!role || (role === 'viewer')) {
      throw new Error('Insufficient permissions to update project');
    }

    const project = await ProjectModel.updateById(projectId, data);
    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  static async deleteProject(projectId: string, userId: string): Promise<void> {
    // Check if user is owner
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (role !== 'owner') {
      throw new Error('Only project owners can delete projects');
    }

    // Delete files from storage
    await storageService.deleteProjectFiles(projectId);

    // Delete from database (soft delete)
    await ProjectModel.deleteById(projectId);
  }

  static async getProject(
    projectId: string,
    userId?: string
  ): Promise<DatabaseProject | null> {
    const project = await ProjectModel.findById(projectId, userId);
    if (!project) return null;

    // Update last accessed time
    if (userId) {
      await ProjectModel.updateLastAccessed(projectId);
    }

    return project;
  }

  static async getProjectBySlug(
    slug: string,
    userId?: string
  ): Promise<DatabaseProject | null> {
    const project = await ProjectModel.findBySlug(slug, userId);
    if (!project) return null;

    // Update last accessed time
    if (userId) {
      await ProjectModel.updateLastAccessed(project.id);
    }

    return project;
  }

  static async getUserProjects(
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
  ) {
    return await ProjectModel.findByUser(userId, options);
  }

  static async getPublicProjects(options: {
    page?: number;
    limit?: number;
    template?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    return await ProjectModel.findPublicProjects(options);
  }

  static async inviteMember(
    projectId: string,
    inviterId: string,
    email: string,
    role: 'editor' | 'viewer'
  ): Promise<void> {
    // Check if inviter has permission
    const inviterRole = await ProjectModel.getMemberRole(projectId, inviterId);
    if (!inviterRole || inviterRole === 'viewer') {
      throw new Error('Insufficient permissions to invite members');
    }

    // TODO: Implement user lookup by email and send invitation
    // For now, assuming user exists and is identified by email
    // This would typically involve:
    // 1. Find user by email
    // 2. Create invitation record
    // 3. Send email invitation
    
    throw new Error('Member invitation not implemented yet');
  }

  static async updateMemberRole(
    projectId: string,
    userId: string,
    targetUserId: string,
    role: 'editor' | 'viewer'
  ): Promise<void> {
    // Check permissions
    const userRole = await ProjectModel.getMemberRole(projectId, userId);
    if (userRole !== 'owner') {
      throw new Error('Only project owners can update member roles');
    }

    await ProjectModel.updateMember(projectId, targetUserId, { role });
  }

  static async removeMember(
    projectId: string,
    userId: string,
    targetUserId: string
  ): Promise<void> {
    // Check permissions
    const userRole = await ProjectModel.getMemberRole(projectId, userId);
    if (userRole !== 'owner' && userId !== targetUserId) {
      throw new Error('Insufficient permissions to remove member');
    }

    await ProjectModel.removeMember(projectId, targetUserId);
  }

  static async getProjectMembers(projectId: string, userId: string) {
    // Check if user has access to project
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (!role) {
      throw new Error('Access denied');
    }

    return await ProjectModel.getMembers(projectId);
  }

  static async duplicateProject(
    sourceProjectId: string,
    userId: string,
    newName?: string
  ): Promise<DatabaseProject> {
    // Check if user has access to source project
    const sourceProject = await this.getProject(sourceProjectId, userId);
    if (!sourceProject) {
      throw new Error('Source project not found or access denied');
    }

    // Create new project
    const newProject = await ProjectModel.create({
      name: newName || `${sourceProject.name} (Copy)`,
      description: sourceProject.description,
      ownerId: userId,
      template: sourceProject.template,
      isPublic: false, // Duplicated projects are private by default
      settings: JSON.parse(sourceProject.settings),
      environment: JSON.parse(sourceProject.environment),
    });

    // Copy files
    const sourceFiles = await ProjectFileModel.getProjectTree(sourceProjectId);
    for (const file of sourceFiles) {
      await ProjectFileModel.copyFile(
        file.id,
        newProject.id,
        file.path,
        file.parentId,
        userId
      );

      // Copy file content from storage if needed
      if (file.storageKey && !file.content) {
        try {
          const content = await storageService.downloadFile(file.storageKey);
          const newStorageKey = await storageService.uploadFile(
            newProject.id,
            file.path,
            content
          );
          
          await ProjectFileModel.updateById(
            file.id,
            { storageKey: newStorageKey },
            userId
          );
        } catch (error) {
          console.error(`Failed to copy file ${file.path}:`, error);
        }
      }
    }

    return newProject;
  }

  private static async createProjectFromTemplate(
    projectId: string,
    template: any,
    userId: string
  ): Promise<void> {
    try {
      const files = template.files || [];
      const createdDirectories = new Set<string>();

      // Sort files to create directories first
      const sortedFiles = files.sort((a: any, b: any) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.path.localeCompare(b.path);
      });

      for (const file of sortedFiles) {
        try {
          if (file.type === 'directory') {
            if (!createdDirectories.has(file.path)) {
              await ProjectFileModel.createDirectory(
                projectId,
                file.path,
                null,
                userId
              );
              createdDirectories.add(file.path);
            }
          } else {
            // Determine parent directory
            const pathParts = file.path.split('/');
            let parentId: string | null = null;
            
            if (pathParts.length > 1) {
              const parentPath = pathParts.slice(0, -1).join('/');
              if (!createdDirectories.has(parentPath)) {
                const parentDir = await ProjectFileModel.createDirectory(
                  projectId,
                  parentPath,
                  null,
                  userId
                );
                createdDirectories.add(parentPath);
                parentId = parentDir.id;
              } else {
                const parentDir = await ProjectFileModel.findByPath(projectId, parentPath);
                parentId = parentDir?.id || null;
              }
            }

            // Create file
            const fileName = pathParts[pathParts.length - 1];
            let storageKey: string | undefined;
            let content = file.content;

            // If file is binary or large, store in MinIO
            if (file.isBinary || (content && content.length > 1024 * 10)) { // 10KB threshold
              storageKey = await storageService.uploadFile(
                projectId,
                file.path,
                content || ''
              );
              content = undefined; // Don't store large content in database
            }

            await ProjectFileModel.create({
              projectId,
              path: file.path,
              name: fileName,
              type: 'file',
              mimeType: this.getMimeType(fileName),
              size: content ? Buffer.byteLength(content, 'utf8') : 0,
              storageKey,
              content,
              encoding: file.encoding || 'utf8',
              isBinary: file.isBinary || false,
              parentId: parentId || undefined,
              createdBy: userId,
            });
          }
        } catch (error) {
          console.error(`Failed to create file ${file.path}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to create project from template:', error);
      throw error;
    }
  }

  private static getMimeType(fileName: string): string | undefined {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'jsx': 'text/jsx',
      'tsx': 'text/tsx',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'scss': 'text/scss',
      'sass': 'text/sass',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'py': 'text/x-python',
      'java': 'text/x-java-source',
      'cpp': 'text/x-c++src',
      'c': 'text/x-csrc',
      'php': 'text/x-php',
      'rb': 'text/x-ruby',
      'go': 'text/x-go',
      'rs': 'text/x-rustsrc',
      'xml': 'application/xml',
      'svg': 'image/svg+xml',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
    };
    
    return ext ? mimeTypes[ext] : undefined;
  }
}