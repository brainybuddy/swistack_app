import {
  ProjectContext,
  FileContext,
  CodeContext,
  FileNode,
  CodeChange,
  CodeSymbol,
  Diagnostic
} from '@swistack/shared';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectModel } from '../../models/Project';
import { ProjectFileModel } from '../../models/ProjectFile';

export interface ContextCache {
  projectId: string;
  lastUpdated: Date;
  context: ProjectContext;
  fileContexts: Map<string, FileContext>;
  dependencies: Map<string, string[]>;
  symbols: Map<string, CodeSymbol[]>;
}

export class AIContextManager {
  private contextCache: Map<string, ContextCache> = new Map();
  private cacheExpiration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clean up expired cache entries every 10 minutes
    setInterval(() => this.cleanupExpiredCache(), 10 * 60 * 1000);
  }

  /**
   * Build comprehensive project context for AI operations
   */
  async buildProjectContext(
    projectId: string,
    forceRefresh = false
  ): Promise<ProjectContext> {
    // Check cache first
    const cached = this.contextCache.get(projectId);
    if (cached && !forceRefresh && !this.isCacheExpired(cached)) {
      return cached.context;
    }

    console.log(`Building project context for ${projectId}...`);

    try {
      // This would typically fetch from database
      // For now, we'll build context from available data
      const project = await this.fetchProjectData(projectId);
      const fileStructure = await this.buildFileStructure(projectId);
      const dependencies = await this.analyzeDependencies(projectId);
      const recentChanges = await this.getRecentChanges(projectId);

      const context: ProjectContext = {
        projectId,
        name: project.name,
        description: project.description,
        framework: project.framework || this.detectFramework(dependencies),
        language: project.language || this.detectPrimaryLanguage(fileStructure),
        dependencies,
        fileStructure,
        activeFiles: project.activeFiles || [],
        recentChanges,
        gitBranch: project.gitBranch,
        environment: project.environment || 'development',
      };

      // Cache the context
      await this.cacheProjectContext(projectId, context);

      console.log(`✅ Project context built for ${projectId}`);
      return context;
    } catch (error) {
      console.error(`❌ Failed to build project context for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Build file-specific context for code operations
   */
  async buildFileContext(
    projectId: string,
    filePath: string,
    fileContent?: string
  ): Promise<FileContext> {
    const cached = this.contextCache.get(projectId);
    if (cached?.fileContexts.has(filePath)) {
      const fileContext = cached.fileContexts.get(filePath)!;
      if (!this.isCacheExpired(cached)) {
        return fileContext;
      }
    }

    console.log(`Building file context for ${filePath}...`);

    try {
      const content = fileContent || await this.getFileContent(projectId, filePath);
      const language = this.detectLanguage(filePath);
      const imports = this.extractImports(content, language);
      const exports = this.extractExports(content, language);
      const symbols = this.extractSymbols(content, language);
      const dependencies = this.extractFileDependencies(imports, filePath);

      const fileContext: FileContext = {
        filePath,
        content,
        language,
        imports,
        exports,
        symbols,
        dependencies,
        lastModified: new Date(),
      };

      // Cache file context
      if (cached) {
        cached.fileContexts.set(filePath, fileContext);
      }

      return fileContext;
    } catch (error) {
      console.error(`❌ Failed to build file context for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Build complete code context for AI code operations
   */
  async buildCodeContext(
    projectId: string,
    filePath: string,
    options?: {
      fileContent?: string;
      selection?: {
        start: { line: number; character: number };
        end: { line: number; character: number };
        text: string;
      };
      cursor?: { line: number; character: number };
      diagnostics?: Diagnostic[];
    }
  ): Promise<CodeContext> {
    const [projectContext, fileContext] = await Promise.all([
      this.buildProjectContext(projectId),
      this.buildFileContext(projectId, filePath, options?.fileContent),
    ]);

    return {
      file: fileContext,
      project: projectContext,
      selection: options?.selection,
      cursor: options?.cursor,
      diagnostics: options?.diagnostics || [],
    };
  }

  /**
   * Update project context when files change
   */
  async updateContext(
    projectId: string,
    changes: CodeChange[]
  ): Promise<void> {
    console.log(`Updating context for ${projectId} with ${changes.length} changes`);

    const cached = this.contextCache.get(projectId);
    if (!cached) {
      // No cache to update, will be built fresh on next request
      return;
    }

    for (const change of changes) {
      switch (change.type) {
        case 'create':
        case 'modify':
          // Invalidate file context for modified files
          cached.fileContexts.delete(change.filePath);
          
          // Update file structure if needed
          if (change.type === 'create') {
            await this.addFileToStructure(cached.context, change.filePath);
          }
          break;
          
        case 'delete':
          // Remove from file contexts and structure
          cached.fileContexts.delete(change.filePath);
          await this.removeFileFromStructure(cached.context, change.filePath);
          break;
          
        case 'rename':
          // Handle file rename
          const oldContext = cached.fileContexts.get(change.filePath);
          if (oldContext) {
            cached.fileContexts.delete(change.filePath);
            // New path would be in change.newContent or similar
          }
          break;
      }
    }

    // Update recent changes
    cached.context.recentChanges = [
      ...changes,
      ...cached.context.recentChanges.slice(0, 50), // Keep last 50 changes
    ];

    cached.lastUpdated = new Date();
  }

  /**
   * Get related files based on imports/dependencies
   */
  async getRelatedFiles(
    projectId: string,
    filePath: string,
    maxDepth = 2
  ): Promise<string[]> {
    const fileContext = await this.buildFileContext(projectId, filePath);
    const relatedFiles = new Set<string>();
    
    // Add direct dependencies
    for (const dep of fileContext.dependencies) {
      if (dep.startsWith('./') || dep.startsWith('../')) {
        const resolvedPath = this.resolveRelativePath(filePath, dep);
        relatedFiles.add(resolvedPath);
      }
    }

    // Add files that import this file (reverse dependencies)
    const reverseDepFiles = await this.findFilesThatImport(projectId, filePath);
    reverseDepFiles.forEach(f => relatedFiles.add(f));

    return Array.from(relatedFiles);
  }

  /**
   * Analyze code quality and patterns in project
   */
  async analyzeCodeQuality(projectId: string): Promise<{
    score: number;
    issues: Diagnostic[];
    patterns: string[];
    suggestions: string[];
  }> {
    const context = await this.buildProjectContext(projectId);
    const issues: Diagnostic[] = [];
    const patterns: string[] = [];
    const suggestions: string[] = [];

    // Analyze each file
    for (const file of this.getAllFiles(context.fileStructure)) {
      if (this.isCodeFile(file.path)) {
        try {
          const fileContext = await this.buildFileContext(projectId, file.path);
          const analysis = this.analyzeFile(fileContext);
          
          issues.push(...analysis.issues);
          patterns.push(...analysis.patterns);
          suggestions.push(...analysis.suggestions);
        } catch (error) {
          console.warn(`Failed to analyze file ${file.path}:`, error);
        }
      }
    }

    // Calculate overall score
    const score = this.calculateQualityScore(issues, patterns, context);

    return {
      score,
      issues: issues.slice(0, 100), // Limit results
      patterns: [...new Set(patterns)],
      suggestions: [...new Set(suggestions)],
    };
  }

  // Private helper methods

  private async cacheProjectContext(
    projectId: string,
    context: ProjectContext
  ): Promise<void> {
    const cache: ContextCache = {
      projectId,
      lastUpdated: new Date(),
      context,
      fileContexts: new Map(),
      dependencies: new Map(),
      symbols: new Map(),
    };

    this.contextCache.set(projectId, cache);
  }

  private isCacheExpired(cache: ContextCache): boolean {
    return Date.now() - cache.lastUpdated.getTime() > this.cacheExpiration;
  }

  private cleanupExpiredCache(): void {
    for (const [projectId, cache] of this.contextCache.entries()) {
      if (this.isCacheExpired(cache)) {
        this.contextCache.delete(projectId);
        console.log(`Cleaned up expired cache for project ${projectId}`);
      }
    }
  }

  private async fetchProjectData(projectId: string): Promise<any> {
    try {
      // Get real project data from database
      const project = await ProjectModel.findById(projectId);
      
      if (project) {
        return {
          id: projectId,
          name: project.name,
          description: project.description,
          framework: this.detectFrameworkFromProject(project),
          language: 'typescript', // Can be detected from files
          activeFiles: [],
          gitBranch: 'main',
          environment: project.environment || 'development',
        };
      }
    } catch (error) {
      console.warn('Could not fetch real project data, using fallback:', error);
    }
    
    // Fallback to sensible defaults
    return {
      id: projectId,
      name: 'AI Project',
      description: 'A project analyzed by AI',
      framework: 'nextjs',
      language: 'typescript',
      activeFiles: [],
      gitBranch: 'main',
      environment: 'development',
    };
  }

  private async buildFileStructure(projectId: string): Promise<FileNode[]> {
    try {
      // Get real file data from database (same as projects route)
      const files = await ProjectFileModel.getProjectTree(projectId);
      
      console.log(`[AI Context] Found ${files.length} files for project ${projectId}`);
      
      // Show detailed file info like the projects route does
      const actualFiles = files.filter(f => f.type === 'file' && f.content);
      console.log(`[AI Context] Files with content: ${actualFiles.length}`);
      console.log('[AI Context] Sample file data:', actualFiles.slice(0, 3).map(f => ({
        path: f.path,
        type: f.type,
        hasContent: !!f.content,
        contentLength: f.content?.length || 0,
        storageKey: f.storageKey
      })));
      
      // Convert database files to FileNode structure with content
      const fileNodes: FileNode[] = files.map(file => ({
        name: file.name,
        path: file.path,
        type: file.type as 'file' | 'directory',
        content: file.content || undefined, // ✅ IMPORTANT: Include actual file content for AI
        size: file.size || undefined,
        mimeType: file.mimeType || undefined,
      }));
      
      console.log(`[AI Context] ✅ Built file structure with ${fileNodes.length} nodes, ${fileNodes.filter(f => f.content).length} with content`);
      return fileNodes;
      
    } catch (error) {
      console.error('[AI Context] Could not fetch real file structure:', error);
      
      // Fallback to basic structure
      return [
        { name: 'package.json', path: 'package.json', type: 'file' },
        { name: 'README.md', path: 'README.md', type: 'file' },
        {
          name: 'app',
          path: 'app',
          type: 'directory',
        },
      ];
    }
  }

  private async analyzeDependencies(projectId: string): Promise<Record<string, string>> {
    // This would read package.json or equivalent
    return {
      'react': '^18.0.0',
      'typescript': '^5.0.0',
      'next': '^14.0.0',
    };
  }

  private async getRecentChanges(projectId: string): Promise<CodeChange[]> {
    // This would typically fetch from git or database
    return [];
  }

  private detectFramework(dependencies: Record<string, string>): string {
    if (dependencies['next']) return 'nextjs';
    if (dependencies['react']) return 'react';
    if (dependencies['express']) return 'express';
    if (dependencies['flask']) return 'flask';
    if (dependencies['django']) return 'django';
    return 'javascript';
  }

  private detectPrimaryLanguage(fileStructure: FileNode[]): string {
    const files = this.getAllFiles(fileStructure);
    const extensions = files.map(f => path.extname(f.path));
    
    if (extensions.some(ext => ext === '.ts' || ext === '.tsx')) return 'typescript';
    if (extensions.some(ext => ext === '.js' || ext === '.jsx')) return 'javascript';
    if (extensions.some(ext => ext === '.py')) return 'python';
    if (extensions.some(ext => ext === '.go')) return 'go';
    
    return 'javascript';
  }

  private getAllFiles(structure: FileNode[]): FileNode[] {
    const files: FileNode[] = [];
    
    function traverse(nodes: FileNode[]) {
      for (const node of nodes) {
        if (node.type === 'file') {
          files.push(node);
        } else if (node.children) {
          traverse(node.children);
        }
      }
    }
    
    traverse(structure);
    return files;
  }

  private async getFileContent(projectId: string, filePath: string): Promise<string> {
    // This would typically read from file system or database
    return '// Sample file content';
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.json': 'json',
      '.md': 'markdown',
    };
    
    return languageMap[ext] || 'text';
  }

  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    if (language === 'javascript' || language === 'typescript') {
      // ES6 imports
      const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // CommonJS requires
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (language === 'python') {
      // Python imports
      const importRegex = /^(?:from\s+(\S+)\s+)?import\s+([^\n]+)/gm;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        if (match[1]) {
          imports.push(match[1]); // from X import Y
        } else {
          imports.push(match[2].split(',')[0].trim()); // import X
        }
      }
    }
    
    return imports;
  }

  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];
    
    if (language === 'javascript' || language === 'typescript') {
      // Named exports
      const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
      let match;
      while ((match = namedExportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
      
      // Default export
      if (content.includes('export default')) {
        exports.push('default');
      }
      
      // Export statements
      const exportStatementRegex = /export\s*{\s*([^}]+)\s*}/g;
      while ((match = exportStatementRegex.exec(content)) !== null) {
        const exportNames = match[1].split(',').map(name => name.trim());
        exports.push(...exportNames);
      }
    }
    
    return exports;
  }

  private extractSymbols(content: string, language: string): CodeSymbol[] {
    const symbols: CodeSymbol[] = [];
    const lines = content.split('\n');
    
    if (language === 'javascript' || language === 'typescript') {
      lines.forEach((line, index) => {
        // Functions
        const funcMatch = line.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*[=:]?\s*(?:function|\(.*\)\s*=>)/);
        if (funcMatch) {
          symbols.push({
            name: funcMatch[1],
            kind: 'function',
            line: index + 1,
            column: line.indexOf(funcMatch[1]),
            scope: line.includes('export') ? 'public' : 'local',
          });
        }
        
        // Classes
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          symbols.push({
            name: classMatch[1],
            kind: 'class',
            line: index + 1,
            column: line.indexOf(classMatch[1]),
            scope: line.includes('export') ? 'public' : 'local',
          });
        }
        
        // Interfaces (TypeScript)
        const interfaceMatch = line.match(/interface\s+(\w+)/);
        if (interfaceMatch) {
          symbols.push({
            name: interfaceMatch[1],
            kind: 'interface',
            line: index + 1,
            column: line.indexOf(interfaceMatch[1]),
            scope: line.includes('export') ? 'public' : 'local',
          });
        }
      });
    }
    
    return symbols;
  }

  private extractFileDependencies(imports: string[], currentFile: string): string[] {
    return imports.filter(imp => imp.startsWith('./') || imp.startsWith('../'));
  }

  private resolveRelativePath(currentFile: string, relativePath: string): string {
    const currentDir = path.dirname(currentFile);
    return path.resolve(currentDir, relativePath);
  }

  private async findFilesThatImport(projectId: string, targetFile: string): Promise<string[]> {
    // This would scan all files to find reverse dependencies
    // For now, return empty array
    return [];
  }

  private async addFileToStructure(context: ProjectContext, filePath: string): Promise<void> {
    // Add file to file structure
    const parts = filePath.split('/');
    // Implementation would add to the tree structure
  }

  private async removeFileFromStructure(context: ProjectContext, filePath: string): Promise<void> {
    // Remove file from file structure
    // Implementation would remove from the tree structure
  }

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.cpp', '.c'];
    return codeExtensions.some(ext => filePath.endsWith(ext));
  }

  private analyzeFile(fileContext: FileContext): {
    issues: Diagnostic[];
    patterns: string[];
    suggestions: string[];
  } {
    const issues: Diagnostic[] = [];
    const patterns: string[] = [];
    const suggestions: string[] = [];
    
    // Simple code analysis
    const lines = fileContext.content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for potential issues
      if (line.includes('console.log') && !line.includes('// TODO:')) {
        issues.push({
          severity: 'warning',
          message: 'Console.log statement found - consider removing in production',
          source: 'ai-analyzer',
          line: index + 1,
          column: line.indexOf('console.log'),
        });
      }
      
      if (line.includes('any') && fileContext.language === 'typescript') {
        issues.push({
          severity: 'info',
          message: 'Usage of "any" type - consider using more specific types',
          source: 'ai-analyzer',
          line: index + 1,
          column: line.indexOf('any'),
        });
      }
    });
    
    // Detect patterns
    if (fileContext.imports.includes('react')) {
      patterns.push('React Component');
    }
    if (fileContext.symbols.some(s => s.kind === 'class')) {
      patterns.push('Class-based');
    }
    if (fileContext.symbols.some(s => s.kind === 'function')) {
      patterns.push('Functional');
    }
    
    return { issues, patterns, suggestions };
  }

  private calculateQualityScore(
    issues: Diagnostic[],
    patterns: string[],
    context: ProjectContext
  ): number {
    let score = 100;
    
    // Deduct points for issues
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    score -= errorCount * 10;
    score -= warningCount * 2;
    
    // Bonus for good patterns
    if (patterns.includes('TypeScript')) score += 10;
    if (patterns.includes('Testing')) score += 10;
    if (patterns.includes('Documentation')) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private detectFrameworkFromProject(project: any): string {
    if (project.template) {
      if (project.template.includes('nextjs')) return 'nextjs';
      if (project.template.includes('react')) return 'react';
      if (project.template.includes('vue')) return 'vue';
      if (project.template.includes('angular')) return 'angular';
      if (project.template.includes('node')) return 'nodejs';
    }
    return 'nextjs'; // Default for most web projects
  }
}