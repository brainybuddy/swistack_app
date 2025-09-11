import { ProjectModel, DatabaseProject } from '../models/Project';
import { ProjectFileModel } from '../models/ProjectFile';
import { TemplateService } from './TemplateService';
import { storageService } from './StorageService';
import { CreateProjectRequest, UpdateProjectRequest } from '@swistack/shared';
import { portAllocationManager } from './PortAllocationManager';
import { nixDevServerManager } from './NixDevServerManager';
import { randomUUID } from 'crypto';

export class ProjectService {
  static async createProject(
    userId: string,
    data: CreateProjectRequest
  ): Promise<DatabaseProject> {
    try {
      // Get template - use templateData from request if available to avoid 431 errors
      let template = data.templateData;
      
      if (!template) {
        // Fallback to database lookup for backward compatibility
        template = await TemplateService.getByKey(data.template);
        if (!template) {
          throw new Error('Template not found');
        }
      }
      
      // DEBUG: Log what template we're creating from
      console.log('🏗️ Creating project from template:', template.name, 'with', template.files?.length, 'files');
      console.log('📦 Template data source:', data.templateData ? 'POST body' : 'database lookup');

      // Allocate ports for the project BEFORE creating it
      console.log('🔌 Allocating ports for project:', data.name);
      const tempProjectId = randomUUID(); // Temporary ID for port allocation
      const portAllocation = await portAllocationManager.allocatePortsForProject(
        tempProjectId, 
        data.name, 
        'spaced'
      );

      // Create project with allocated ports
      const project = await ProjectModel.create({
        name: data.name,
        description: data.description,
        ownerId: userId,
        template: data.template,
        isPublic: data.isPublic || false,
        settings: data.settings || {},
        environment: data.environment || {},
        frontendPort: portAllocation?.frontendPort,
        backendPort: portAllocation?.backendPort,
      });

      // Update port allocation with the actual project ID
      if (portAllocation) {
        await portAllocationManager.updateProjectId(tempProjectId, project.id);
      }

      // Create project files from template with port allocation
      await this.createProjectFromTemplate(project.id, template, userId, portAllocation);

      // Auto-start NixDevServer for the new project
      console.log('🚀 Auto-starting NixDevServer for project:', project.name);
      try {
        const startResult = await nixDevServerManager.start(project.id, userId);
        if (startResult.success) {
          console.log('✅ NixDevServer auto-started successfully on port:', startResult.port);
        } else {
          console.warn('⚠️ NixDevServer auto-start failed:', startResult.error);
        }
      } catch (error) {
        console.error('❌ Error auto-starting NixDevServer:', error);
        // Don't fail project creation if dev server fails to start
      }

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
    userId: string,
    portAllocation?: any
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

            // Inject port configurations if port allocation is available
            if (portAllocation && content) {
              content = this.injectPortConfigurations(file.path, content, portAllocation);
            }

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

    // Also materialize files to repositories/<projectId> for local dev workflows
    try {
      await this.materializeProjectToRepository(projectId);
    } catch (e) {
      console.warn('⚠️ Materialize to repository failed (non-blocking):', e);
    }
  }

  /**
   * Write current project files to repositories/<projectId> folder so dev servers can run from disk.
   */
  public static async materializeProjectToRepository(projectId: string): Promise<void> {
    const path = await import('path');
    const fs = await import('fs/promises');
    const { storageService } = await import('./StorageService');
    const base = process.env.WORKSPACE_BASE_PATH || '/Applications/swistack_app';
    const repoDir = path.join(base, 'repositories', projectId);
    await fs.mkdir(repoDir, { recursive: true });

    const tree = await ProjectFileModel.getProjectTree(projectId);
    for (const f of tree) {
      const dest = path.join(repoDir, f.path);
      if (f.type === 'directory') {
        await fs.mkdir(dest, { recursive: true });
      } else if (f.type === 'file') {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        let content = f.content || '';
        if (!content && f.storageKey) {
          try { content = await storageService.downloadFile(f.storageKey); } catch {}
        }
        await fs.writeFile(dest, content || '', 'utf8');
      }
    }
  }

  /**
   * Inject port configurations into project files
   */
  private static injectPortConfigurations(
    filePath: string, 
    content: string, 
    portAllocation: any
  ): string {
    const fileName = filePath.split('/').pop()?.toLowerCase();

    try {
      // Handle package.json files
      if (fileName === 'package.json') {
        return this.updatePackageJsonWithPorts(content, portAllocation);
      }

      // Handle environment files
      if (fileName === '.env' || fileName === '.env.local' || fileName === '.env.development') {
        return this.updateEnvFileWithPorts(content, portAllocation);
      }

      // Handle Next.js configuration
      if (fileName === 'next.config.js' || fileName === 'next.config.mjs') {
        return this.updateNextConfigWithPorts(content, portAllocation);
      }

      // Handle Docker files
      if (fileName === 'dockerfile' || fileName === 'docker-compose.yml') {
        return this.updateDockerConfigWithPorts(content, portAllocation);
      }

      // Handle README files with port instructions
      if (fileName === 'readme.md') {
        return this.updateReadmeWithPorts(content, portAllocation);
      }

      // No modifications needed for other files
      return content;
    } catch (error) {
      console.error(`❌ Failed to inject ports into ${filePath}:`, error);
      return content; // Return original content on error
    }
  }

  /**
   * Update package.json with allocated ports
   */
  private static updatePackageJsonWithPorts(content: string, portAllocation: any): string {
    try {
      const packageJson = JSON.parse(content);
      const scripts = portAllocation ? portAllocationManager.generatePackageJsonScripts(portAllocation) : {};
      
      // Merge with existing scripts, prioritizing allocated port scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        ...scripts
      };

      console.log(`✅ Updated package.json with ports: frontend=${portAllocation.frontendPort}, backend=${portAllocation.backendPort}`);
      return JSON.stringify(packageJson, null, 2);
    } catch (error) {
      console.error('❌ Failed to update package.json:', error);
      return content;
    }
  }

  /**
   * Update environment files with allocated ports
   */
  private static updateEnvFileWithPorts(content: string, portAllocation: any): string {
    const envVars = portAllocation ? portAllocationManager.generateEnvironmentVariables(portAllocation) : {};
    
    let updatedContent = content;
    Object.entries(envVars).forEach(([key, value]) => {
      // Escape special regex characters in key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escapedKey}=.*$`, 'm');
      
      if (regex.test(updatedContent)) {
        updatedContent = updatedContent.replace(regex, `${key}=${value}`);
      } else {
        // Add with proper newline handling
        if (updatedContent && !updatedContent.endsWith('\n')) {
          updatedContent += '\n';
        }
        updatedContent += `${key}=${value}\n`;
      }
    });

    console.log(`✅ Updated environment file with port variables`);
    return updatedContent.trim(); // Remove trailing newlines
  }

  /**
   * Update Next.js config with allocated ports
   */
  private static updateNextConfigWithPorts(content: string, portAllocation: any): string {
    // For now, just add a comment about the allocated ports
    const portComment = `
// Allocated ports for this project:
// Frontend: ${portAllocation.frontendPort}
// Backend: ${portAllocation.backendPort}
// Reserved: ${portAllocation.reservedPorts.join(', ')}

`;
    return portComment + content;
  }

  /**
   * Update Docker configuration with allocated ports
   */
  private static updateDockerConfigWithPorts(content: string, portAllocation: any): string {
    // Replace port mappings in Docker files
    let updatedContent = content;
    
    // Replace common Docker port patterns
    updatedContent = updatedContent.replace(/3000:3000/g, `${portAllocation.frontendPort}:${portAllocation.frontendPort}`);
    updatedContent = updatedContent.replace(/3001:3001/g, `${portAllocation.backendPort}:${portAllocation.backendPort}`);
    
    console.log(`✅ Updated Docker configuration with allocated ports`);
    return updatedContent;
  }

  /**
   * Update README with port information
   */
  private static updateReadmeWithPorts(content: string, portAllocation: any): string {
    const portInfo = `
## 🔌 Port Allocation

This project has been automatically allocated the following ports:

- **Frontend**: http://localhost:${portAllocation.frontendPort}
- **Backend**: http://localhost:${portAllocation.backendPort}
- **Reserved Ports**: ${portAllocation.reservedPorts.join(', ')} (for future use)

To start the development servers:
\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at http://localhost:${portAllocation.frontendPort}
The backend API will be available at http://localhost:${portAllocation.backendPort}

`;

    // Add port info after the main title or at the beginning
    if (content.includes('# ')) {
      const titleMatch = content.match(/(# [^\n]+\n)/);
      if (titleMatch) {
        return content.replace(titleMatch[1], titleMatch[1] + portInfo);
      }
    }
    
    return portInfo + content;
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
