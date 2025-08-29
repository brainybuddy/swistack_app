import { db } from '../config/database';
import { DatabaseProjectFile } from './Project';
import path from 'path';

export class ProjectFileModel {
  static async create(data: {
    projectId: string;
    path: string;
    name: string;
    type: 'file' | 'directory';
    mimeType?: string;
    size?: number;
    storageKey?: string;
    content?: string;
    encoding?: string;
    isBinary?: boolean;
    parentId?: string;
    createdBy: string;
  }): Promise<DatabaseProjectFile> {
    const [file] = await db('project_files')
      .insert({
        projectId: data.projectId,
        path: data.path,
        name: data.name,
        type: data.type,
        mimeType: data.mimeType,
        size: data.size || 0,
        storageKey: data.storageKey,
        content: data.content,
        encoding: data.encoding || 'utf8',
        isBinary: data.isBinary || false,
        parentId: data.parentId,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      })
      .returning('*');

    return file;
  }

  static async findById(id: string): Promise<DatabaseProjectFile | null> {
    const file = await db('project_files').where('id', id).first();
    return file || null;
  }

  static async findByPath(projectId: string, filePath: string): Promise<DatabaseProjectFile | null> {
    const file = await db('project_files')
      .where({ projectId, path: filePath })
      .first();
    return file || null;
  }

  static async findByProject(
    projectId: string,
    parentId?: string
  ): Promise<DatabaseProjectFile[]> {
    let query = db('project_files').where('projectId', projectId);
    
    if (parentId === null || parentId === undefined) {
      query = query.whereNull('parentId');
    } else {
      query = query.where('parentId', parentId);
    }
    
    return await query.orderBy('type').orderBy('name');
  }

  static async getProjectTree(projectId: string): Promise<DatabaseProjectFile[]> {
    return await db('project_files')
      .where('projectId', projectId)
      .orderBy('path');
  }

  static async updateById(
    id: string,
    data: Partial<DatabaseProjectFile>,
    updatedBy: string
  ): Promise<DatabaseProjectFile | null> {
    const [file] = await db('project_files')
      .where('id', id)
      .update({
        ...data,
        updatedBy,
        updatedAt: new Date(),
      })
      .returning('*');

    return file || null;
  }

  static async updateContent(
    id: string,
    content: string,
    size: number,
    updatedBy: string
  ): Promise<DatabaseProjectFile | null> {
    const [file] = await db('project_files')
      .where('id', id)
      .update({
        content,
        size,
        updatedBy,
        updatedAt: new Date(),
      })
      .returning('*');

    return file || null;
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await db('project_files').where('id', id).del();
    return result > 0;
  }

  static async deleteByPath(projectId: string, filePath: string): Promise<boolean> {
    const result = await db('project_files')
      .where({ projectId, path: filePath })
      .del();
    return result > 0;
  }

  static async deleteProjectFiles(projectId: string): Promise<number> {
    return await db('project_files').where('projectId', projectId).del();
  }

  static async moveFile(
    id: string,
    newPath: string,
    newParentId?: string
  ): Promise<DatabaseProjectFile | null> {
    const newName = path.basename(newPath);
    
    const [file] = await db('project_files')
      .where('id', id)
      .update({
        path: newPath,
        name: newName,
        parentId: newParentId,
        updatedAt: new Date(),
      })
      .returning('*');

    return file || null;
  }

  static async copyFile(
    sourceId: string,
    newProjectId: string,
    newPath: string,
    newParentId?: string,
    createdBy?: string
  ): Promise<DatabaseProjectFile | null> {
    const sourceFile = await this.findById(sourceId);
    if (!sourceFile) return null;

    const newName = path.basename(newPath);
    
    const [file] = await db('project_files')
      .insert({
        projectId: newProjectId,
        path: newPath,
        name: newName,
        type: sourceFile.type,
        mimeType: sourceFile.mimeType,
        size: sourceFile.size,
        content: sourceFile.content,
        encoding: sourceFile.encoding,
        isBinary: sourceFile.isBinary,
        parentId: newParentId,
        createdBy: createdBy || sourceFile.createdBy,
        updatedBy: createdBy || sourceFile.createdBy,
      })
      .returning('*');

    return file;
  }

  static async getProjectStorageUsage(projectId: string): Promise<number> {
    const result = await db('project_files')
      .where('projectId', projectId)
      .sum('size as totalSize')
      .first();

    return parseInt(result?.totalSize as string) || 0;
  }

  static async searchFiles(
    projectId: string,
    searchTerm: string,
    limit: number = 50
  ): Promise<DatabaseProjectFile[]> {
    return await db('project_files')
      .where('projectId', projectId)
      .where(function() {
        this.whereILike('name', `%${searchTerm}%`)
          .orWhereILike('path', `%${searchTerm}%`)
          .orWhereILike('content', `%${searchTerm}%`);
      })
      .where('type', 'file')
      .limit(limit)
      .orderBy('name');
  }

  static async getFilesByType(
    projectId: string,
    mimeType: string
  ): Promise<DatabaseProjectFile[]> {
    return await db('project_files')
      .where({ projectId, mimeType })
      .where('type', 'file')
      .orderBy('name');
  }

  static async getRecentFiles(
    projectId: string,
    limit: number = 10
  ): Promise<DatabaseProjectFile[]> {
    return await db('project_files')
      .where('projectId', projectId)
      .where('type', 'file')
      .orderBy('updatedAt', 'desc')
      .limit(limit);
  }

  static async createDirectory(
    projectId: string,
    dirPath: string,
    parentId: string | null,
    createdBy: string
  ): Promise<DatabaseProjectFile> {
    const dirName = path.basename(dirPath);
    
    const [directory] = await db('project_files')
      .insert({
        projectId,
        path: dirPath,
        name: dirName,
        type: 'directory',
        size: 0,
        encoding: 'utf8',
        isBinary: false,
        parentId,
        createdBy,
        updatedBy: createdBy,
      })
      .returning('*');

    return directory;
  }

  static async validateFilePath(
    projectId: string,
    filePath: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = db('project_files')
      .where({ projectId, path: filePath });
    
    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }
    
    const existing = await query.first();
    return !existing;
  }

  static async getChildren(fileId: string): Promise<DatabaseProjectFile[]> {
    return await db('project_files')
      .where('parentId', fileId)
      .orderBy('type')
      .orderBy('name');
  }

  static async hasChildren(fileId: string): Promise<boolean> {
    const count = await db('project_files')
      .where('parentId', fileId)
      .count('* as count')
      .first();
    
    return parseInt(count?.count as string) > 0;
  }
}