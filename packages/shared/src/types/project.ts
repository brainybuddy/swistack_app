export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  template: string;
  status: 'active' | 'archived' | 'deleted';
  settings: ProjectSettings;
  repositoryUrl?: string;
  branch: string;
  environment: Record<string, string>;
  isPublic: boolean;
  slug: string;
  storageUsed: number;
  storageLimit: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  owner?: User;
  members?: ProjectMember[];
  files?: ProjectFile[];
}

export interface ProjectMember {
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
  
  // Relations
  user?: User;
  project?: Project;
}

export interface ProjectFile {
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
  
  // Relations
  parent?: ProjectFile;
  children?: ProjectFile[];
  project?: Project;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  key: string;
  description?: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'data' | 'ml' | 'game';
  language: string;
  framework?: string;
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  config: Record<string, any>;
  dockerImage?: string;
  files: TemplateFile[];
  icon?: string;
  version: string;
  isActive: boolean;
  isOfficial: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFile {
  path: string;
  content?: string;
  type: 'file' | 'directory';
  encoding?: string;
  isBinary?: boolean;
}

export interface ProjectSettings {
  autoSave?: boolean;
  tabSize?: number;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  linting?: boolean;
  formatting?: boolean;
  gitAutoCommit?: boolean;
  containerConfig?: ContainerConfig;
  buildConfig?: BuildConfig;
}

export interface ContainerConfig {
  image?: string;
  command?: string;
  workdir?: string;
  ports?: Record<string, number>;
  volumes?: Record<string, string>;
  environment?: Record<string, string>;
  memory?: string;
  cpu?: string;
}

export interface BuildConfig {
  buildCommand?: string;
  startCommand?: string;
  testCommand?: string;
  installCommand?: string;
  outputDir?: string;
  nodeVersion?: string;
  pythonVersion?: string;
}

// API Request/Response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  template: string;
  isPublic?: boolean;
  settings?: Partial<ProjectSettings>;
  environment?: Record<string, string>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  settings?: Partial<ProjectSettings>;
  environment?: Record<string, string>;
  status?: 'active' | 'archived';
}

export interface CreateProjectResponse {
  project: Project;
}

export interface GetProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface InviteMemberRequest {
  email: string;
  role: 'editor' | 'viewer';
}

export interface UpdateMemberRequest {
  role: 'editor' | 'viewer';
}

export interface FileUploadRequest {
  path: string;
  content?: string;
  encoding?: string;
}

export interface FileUploadResponse {
  file: ProjectFile;
  uploadUrl?: string; // for binary files
}

export interface GitOperationRequest {
  operation: 'clone' | 'pull' | 'push' | 'commit' | 'branch' | 'merge';
  message?: string;
  branch?: string;
  remote?: string;
}

export interface GitOperationResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Import User type from auth
import { User } from './auth';