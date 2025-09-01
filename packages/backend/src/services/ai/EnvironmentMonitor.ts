import { EventEmitter } from 'events';
import { ProjectFileModel } from '../../models/ProjectFile';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as chokidar from 'chokidar';

interface FileChange {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  filePath: string;
  timestamp: Date;
  size?: number;
  content?: string;
  previousPath?: string;
}

interface BuildStatus {
  status: 'success' | 'failure' | 'in_progress';
  timestamp: Date;
  duration?: number;
  errors?: string[];
  warnings?: string[];
  output?: string;
}

interface ProjectMetrics {
  filesCount: number;
  linesOfCode: number;
  testCoverage?: number;
  buildStatus?: BuildStatus;
  lastCommit?: {
    hash: string;
    message: string;
    timestamp: Date;
  };
  dependencies: {
    production: number;
    development: number;
    outdated: number;
  };
}

export class EnvironmentMonitor extends EventEmitter {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private projectMetrics: Map<string, ProjectMetrics> = new Map();
  private isMonitoring = false;

  constructor() {
    super();
  }

  /**
   * Start monitoring a project environment
   */
  async start(projectId: string): Promise<void> {
    if (this.isMonitoring) {
      console.log('[EnvironmentMonitor] Already monitoring');
      return;
    }

    console.log(`[EnvironmentMonitor] Starting monitoring for project ${projectId}`);
    this.isMonitoring = true;

    // Get project base path
    const projectPath = await this.getProjectPath(projectId);
    
    if (await this.pathExists(projectPath)) {
      await this.startFileWatching(projectId, projectPath);
      await this.startBuildMonitoring(projectId, projectPath);
      await this.collectInitialMetrics(projectId, projectPath);
    } else {
      console.log(`[EnvironmentMonitor] Project path does not exist: ${projectPath}`);
    }
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    console.log('[EnvironmentMonitor] Stopping monitoring');
    this.isMonitoring = false;

    // Close all watchers
    for (const [projectId, watcher] of this.watchers) {
      await watcher.close();
      this.watchers.delete(projectId);
    }

    this.projectMetrics.clear();
  }

  /**
   * Get current project context
   */
  async getProjectContext(projectId: string): Promise<any> {
    const metrics = this.projectMetrics.get(projectId);
    const files = await this.getProjectFiles(projectId);
    
    return {
      projectId,
      metrics,
      files: {
        count: files.length,
        types: this.analyzeFileTypes(files),
        recent: files
          .filter(f => f.updatedAt && new Date().getTime() - f.updatedAt.getTime() < 24 * 60 * 60 * 1000)
          .map(f => ({ path: f.path, type: f.type, updatedAt: f.updatedAt }))
      },
      health: await this.assessProjectHealth(projectId),
      lastUpdated: new Date()
    };
  }

  /**
   * Detect changes that might require agent attention
   */
  async detectIssues(projectId: string): Promise<Array<{
    type: 'build_failure' | 'test_failure' | 'security_vulnerability' | 'performance_regression' | 'dependency_issue';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedFiles?: string[];
    recommendedAction: string;
  }>> {
    const issues: any[] = [];
    const metrics = this.projectMetrics.get(projectId);
    
    if (!metrics) return issues;

    // Check build status
    if (metrics.buildStatus?.status === 'failure') {
      issues.push({
        type: 'build_failure',
        severity: 'high',
        description: 'Build is failing',
        affectedFiles: [],
        recommendedAction: 'Fix build errors and warnings'
      });
    }

    // Check for outdated dependencies
    if (metrics.dependencies.outdated > 5) {
      issues.push({
        type: 'dependency_issue',
        severity: 'medium',
        description: `${metrics.dependencies.outdated} dependencies are outdated`,
        recommendedAction: 'Update dependencies to latest stable versions'
      });
    }

    // Check test coverage
    if (metrics.testCoverage !== undefined && metrics.testCoverage < 60) {
      issues.push({
        type: 'test_failure',
        severity: 'medium',
        description: `Low test coverage: ${metrics.testCoverage}%`,
        recommendedAction: 'Add more unit tests to improve coverage'
      });
    }

    return issues;
  }

  // Private methods
  private async startFileWatching(projectId: string, projectPath: string): Promise<void> {
    const watcher = chokidar.watch(projectPath, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**'
      ],
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', (filePath) => this.handleFileChange(projectId, 'created', filePath))
      .on('change', (filePath) => this.handleFileChange(projectId, 'modified', filePath))
      .on('unlink', (filePath) => this.handleFileChange(projectId, 'deleted', filePath))
      .on('error', (error) => console.error('[EnvironmentMonitor] Watcher error:', error));

    this.watchers.set(projectId, watcher);
    console.log(`[EnvironmentMonitor] File watching started for ${projectPath}`);
  }

  private async handleFileChange(projectId: string, type: FileChange['type'], filePath: string): Promise<void> {
    const change: FileChange = {
      type,
      filePath,
      timestamp: new Date()
    };

    // Add file details for created/modified files
    if (type !== 'deleted') {
      try {
        const stats = await fs.stat(filePath);
        change.size = stats.size;
        
        // Read content for small text files
        if (stats.size < 100 * 1024 && this.isTextFile(filePath)) {
          change.content = await fs.readFile(filePath, 'utf-8');
        }
      } catch (error) {
        // File might have been deleted between events
      }
    }

    console.log(`[EnvironmentMonitor] File ${type}: ${filePath}`);
    this.emit('file_changed', change);

    // Update project metrics
    await this.updateProjectMetrics(projectId);

    // Check for critical issues
    await this.checkForCriticalIssues(projectId, change);
  }

  private async startBuildMonitoring(projectId: string, projectPath: string): Promise<void> {
    // Monitor for build-related files
    const buildFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', 'next.config.js'];
    
    // This is a simplified implementation
    // In a full implementation, this would integrate with actual build systems
    console.log(`[EnvironmentMonitor] Build monitoring started for ${projectPath}`);
  }

  private async collectInitialMetrics(projectId: string, projectPath: string): Promise<void> {
    try {
      const metrics: ProjectMetrics = {
        filesCount: 0,
        linesOfCode: 0,
        dependencies: {
          production: 0,
          development: 0,
          outdated: 0
        }
      };

      // Count files and lines of code
      const files = await this.getProjectFiles(projectId);
      metrics.filesCount = files.length;
      
      let totalLines = 0;
      for (const file of files.slice(0, 100)) { // Limit to first 100 files for performance
        if (this.isCodeFile(file.path) && file.content) {
          totalLines += file.content.split('\n').length;
        }
      }
      metrics.linesOfCode = totalLines;

      // Analyze package.json if it exists
      const packageJsonFile = files.find(f => f.name === 'package.json');
      if (packageJsonFile && packageJsonFile.content) {
        try {
          const packageJson = JSON.parse(packageJsonFile.content);
          metrics.dependencies.production = Object.keys(packageJson.dependencies || {}).length;
          metrics.dependencies.development = Object.keys(packageJson.devDependencies || {}).length;
        } catch (error) {
          console.error('[EnvironmentMonitor] Failed to parse package.json:', error);
        }
      }

      this.projectMetrics.set(projectId, metrics);
      console.log(`[EnvironmentMonitor] Initial metrics collected for ${projectId}:`, metrics);
    } catch (error) {
      console.error('[EnvironmentMonitor] Failed to collect initial metrics:', error);
    }
  }

  private async updateProjectMetrics(projectId: string): Promise<void> {
    // Debounced metrics update
    // In a real implementation, this would be more sophisticated
    setTimeout(() => {
      this.collectInitialMetrics(projectId, ''); // Path would be retrieved
    }, 5000);
  }

  private async checkForCriticalIssues(projectId: string, change: FileChange): Promise<void> {
    // Check for syntax errors in modified code files
    if (change.type === 'modified' && change.content && this.isCodeFile(change.filePath)) {
      const issues = await this.detectSyntaxErrors(change.filePath, change.content);
      
      if (issues.length > 0) {
        this.emit('syntax_errors', {
          projectId,
          filePath: change.filePath,
          errors: issues
        });
      }
    }

    // Check for breaking changes in package.json
    if (change.filePath.endsWith('package.json') && change.content) {
      try {
        const packageJson = JSON.parse(change.content);
        // Emit event for dependency changes
        this.emit('dependencies_changed', {
          projectId,
          packageJson
        });
      } catch (error) {
        this.emit('build_failed', {
          projectId,
          error: 'Invalid package.json syntax',
          filePath: change.filePath
        });
      }
    }
  }

  private async detectSyntaxErrors(filePath: string, content: string): Promise<string[]> {
    const errors: string[] = [];
    const extension = path.extname(filePath).toLowerCase();

    try {
      // Basic syntax checking for different file types
      switch (extension) {
        case '.json':
          JSON.parse(content);
          break;
        case '.js':
        case '.jsx':
        case '.ts':
        case '.tsx':
          // Would integrate with TypeScript compiler or ESLint
          // For now, just check for obvious issues
          if (content.includes('SyntaxError')) {
            errors.push('Syntax error detected in content');
          }
          break;
      }
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }

    return errors;
  }

  private async assessProjectHealth(projectId: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const metrics = this.projectMetrics.get(projectId);
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!metrics) {
      return { score: 0, issues: ['No metrics available'], recommendations: ['Start monitoring'] };
    }

    // Deduct points for issues
    if (metrics.buildStatus?.status === 'failure') {
      score -= 30;
      issues.push('Build is failing');
      recommendations.push('Fix build errors');
    }

    if (metrics.testCoverage !== undefined && metrics.testCoverage < 70) {
      score -= 20;
      issues.push(`Low test coverage: ${metrics.testCoverage}%`);
      recommendations.push('Improve test coverage');
    }

    if (metrics.dependencies.outdated > 10) {
      score -= 15;
      issues.push(`Many outdated dependencies: ${metrics.dependencies.outdated}`);
      recommendations.push('Update dependencies');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  private async getProjectFiles(projectId: string): Promise<any[]> {
    try {
      return await ProjectFileModel.findAll({ projectId });
    } catch (error) {
      console.error('[EnvironmentMonitor] Failed to get project files:', error);
      return [];
    }
  }

  private async getProjectPath(projectId: string): Promise<string> {
    // This would typically come from project configuration
    return path.join(process.cwd(), 'projects', projectId);
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private analyzeFileTypes(files: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    
    for (const file of files) {
      const ext = path.extname(file.path).toLowerCase() || 'no-extension';
      types[ext] = (types[ext] || 0) + 1;
    }
    
    return types;
  }

  private isTextFile(filePath: string): boolean {
    const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml', '.xml', '.css', '.scss', '.html', '.py', '.java', '.cpp', '.c', '.h'];
    return textExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.scss'];
    return codeExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }
}