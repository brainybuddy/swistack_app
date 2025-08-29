import { z } from 'zod';

// Project validation schemas
export const projectSettingsSchema = z.object({
  autoSave: z.boolean().optional(),
  tabSize: z.number().min(1).max(8).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().optional(),
  linting: z.boolean().optional(),
  formatting: z.boolean().optional(),
  gitAutoCommit: z.boolean().optional(),
  containerConfig: z.object({
    image: z.string().optional(),
    command: z.string().optional(),
    workdir: z.string().optional(),
    ports: z.record(z.number()).optional(),
    volumes: z.record(z.string()).optional(),
    environment: z.record(z.string()).optional(),
    memory: z.string().optional(),
    cpu: z.string().optional(),
  }).optional(),
  buildConfig: z.object({
    buildCommand: z.string().optional(),
    startCommand: z.string().optional(),
    testCommand: z.string().optional(),
    installCommand: z.string().optional(),
    outputDir: z.string().optional(),
    nodeVersion: z.string().optional(),
    pythonVersion: z.string().optional(),
  }).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  template: z.string().min(1, 'Template is required'),
  isPublic: z.boolean().optional(),
  settings: projectSettingsSchema.optional(),
  environment: z.record(z.string()).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().optional(),
  settings: projectSettingsSchema.optional(),
  environment: z.record(z.string()).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['editor', 'viewer']),
});

export const updateMemberSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});

export const fileUploadSchema = z.object({
  path: z.string().min(1, 'File path is required').max(500, 'File path too long'),
  content: z.string().optional(),
  encoding: z.string().optional(),
});

export const gitOperationSchema = z.object({
  operation: z.enum(['clone', 'pull', 'push', 'commit', 'branch', 'merge']),
  message: z.string().optional(),
  branch: z.string().optional(),
  remote: z.string().optional(),
});

export const projectQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  template: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
  isPublic: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'lastAccessedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Template validation schemas
export const templateFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string().optional(),
  type: z.enum(['file', 'directory']),
  encoding: z.string().optional(),
  isBinary: z.boolean().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
  key: z.string().min(1, 'Template key is required').max(50, 'Template key too long').regex(/^[a-z0-9-]+$/, 'Template key must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.enum(['frontend', 'backend', 'fullstack', 'mobile', 'desktop', 'data', 'ml', 'game']),
  language: z.string().min(1, 'Language is required'),
  framework: z.string().optional(),
  dependencies: z.record(z.string()),
  scripts: z.record(z.string()),
  config: z.record(z.any()),
  dockerImage: z.string().optional(),
  files: z.array(templateFileSchema),
  icon: z.string().optional(),
  version: z.string().min(1, 'Version is required'),
});

// Validation helper functions
export function validateProjectName(name: string): boolean {
  return name.length >= 1 && name.length <= 100;
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 1 && slug.length <= 50;
}

export function validateFilePath(path: string): boolean {
  // Validate that path doesn't contain dangerous patterns
  const dangerousPatterns = [
    '../', 
    '..\\', 
    '//', 
    '\\\\',
    /^\//, // absolute paths
    /\0/, // null bytes
  ];
  
  return !dangerousPatterns.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }
    return path.includes(pattern);
  });
}

export function validateEnvironmentKey(key: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(key);
}