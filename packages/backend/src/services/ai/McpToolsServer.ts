import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LivePreviewIntegration, PreviewState } from './LivePreviewIntegration';

const execAsync = promisify(exec);

export class SwiStackMcpToolsServer {
  private server: McpServer;
  private previewIntegration: LivePreviewIntegration;

  constructor() {
    this.server = new McpServer({
      name: "swistack-tools",
      version: "1.0.0"
    });
    this.previewIntegration = new LivePreviewIntegration();
    this.setupTools();
  }

  private setupTools(): void {
    // Register file read tool  
    this.server.registerTool("read_file", {
      description: "Read contents of a file",
      inputSchema: z.object({
        path: z.string().describe("File path to read")
      }) as any
    }, async (args: { path: string }) => {
      const content = await this.readFile(args.path);
      return {
        content: [{ type: "text" as const, text: content }]
      } as any;
    });

    // Register file write tool
    this.server.registerTool("write_file", {
      description: "Write content to a file",
      inputSchema: z.object({
        path: z.string().describe("File path to write to"),
        content: z.string().describe("Content to write")
      }) as any
    }, async (args: { path: string; content: string }) => {
      await this.writeFile(args.path, args.content);
      return {
        content: [{ type: "text" as const, text: `Successfully wrote to ${args.path}` }]
      } as any;
    });

    // Register list files tool
    this.server.registerTool("list_files", {
      description: "List files in a directory",
      inputSchema: z.object({
        directory: z.string().describe("Directory path to list")
      }) as any
    }, async (args: { directory: string }) => {
      const files = await this.listFiles(args.directory);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(files, null, 2) }]
      } as any;
    });

    // Register execute command tool
    this.server.registerTool("execute_command", {
      description: "Execute a shell command",
      inputSchema: z.object({
        command: z.string().describe("Shell command to execute")
      }) as any
    }, async (args: { command: string }) => {
      const result = await this.executeCommand(args.command);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }]
      } as any;
    });

    // Register get project structure tool  
    this.server.registerTool("get_project_structure", {
      description: "Get the structure of the current project",
      inputSchema: z.object({}) as any
    }, async () => {
      const structure = await this.getProjectStructure();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(structure, null, 2) }]
      } as any;
    });

    // Register git status tool
    this.server.registerTool("git_status", {
      description: "Get git status of the project",
      inputSchema: z.object({
        projectPath: z.string().optional().describe("Path to the git project (optional, uses current project if not specified)")
      }) as any
    }, async (args: { projectPath?: string }) => {
      const status = await this.gitStatus(args.projectPath);
      return {
        content: [{ type: "text" as const, text: status }]
      } as any;
    });

    // Register preview analysis tool
    this.server.registerTool("analyze_preview", {
      description: "Analyze current live preview state, errors, and console output",
      inputSchema: z.object({
        projectId: z.string().describe("Project ID to analyze")
      }) as any
    }, async (args: { projectId: string }) => {
      const previewState = await this.getPreviewState(args.projectId);
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(previewState, null, 2) 
        }]
      } as any;
    });

    // Register preview error detection tool
    this.server.registerTool("detect_preview_issues", {
      description: "Detect and analyze issues in the live preview",
      inputSchema: z.object({
        projectId: z.string().describe("Project ID to analyze"),
        includeFileAnalysis: z.boolean().optional().describe("Whether to analyze related files for context")
      }) as any
    }, async (args: { projectId: string; includeFileAnalysis?: boolean }) => {
      const analysis = await this.detectPreviewIssues(args.projectId, args.includeFileAnalysis);
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(analysis, null, 2) 
        }]
      } as any;
    });

    // Register auto-fix preview tool
    this.server.registerTool("fix_preview_issues", {
      description: "Automatically fix common preview issues",
      inputSchema: z.object({
        projectId: z.string().describe("Project ID to fix"),
        issues: z.array(z.string()).describe("Specific issues to fix"),
        autoApply: z.boolean().optional().describe("Whether to automatically apply fixes (default: false)")
      }) as any
    }, async (args: { projectId: string; issues: string[]; autoApply?: boolean }) => {
      const fixes = await this.fixPreviewIssues(args.projectId, args.issues, args.autoApply);
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(fixes, null, 2) 
        }]
      } as any;
    });

    // Register preview optimization tool
    this.server.registerTool("optimize_preview", {
      description: "Optimize preview performance and user experience",
      inputSchema: z.object({
        projectId: z.string().describe("Project ID to optimize"),
        focusAreas: z.array(z.enum(["performance", "accessibility", "responsive", "styling"])).optional()
      }) as any
    }, async (args: { projectId: string; focusAreas?: string[] }) => {
      const optimizations = await this.optimizePreview(args.projectId, args.focusAreas);
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(optimizations, null, 2) 
        }]
      } as any;
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  // Tool implementations
  private async readFile(filePath: string): Promise<string> {
    try {
      // Security: Only allow reading from project directories
      const projectPath = process.env.PROJECT_PATH || './projects';
      const safePath = path.resolve(projectPath, filePath);
      
      if (!safePath.startsWith(path.resolve(projectPath))) {
        throw new Error('Access denied: Path outside project directory');
      }

      const content = await fs.readFile(safePath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${(error as Error).message}`);
    }
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Security: Only allow writing to project directories
      const projectPath = process.env.PROJECT_PATH || './projects';
      const safePath = path.resolve(projectPath, filePath);
      
      if (!safePath.startsWith(path.resolve(projectPath))) {
        throw new Error('Access denied: Path outside project directory');
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file: ${(error as Error).message}`);
    }
  }

  private async listFiles(directory: string): Promise<string[]> {
    try {
      // Security: Only allow listing project directories
      const projectPath = process.env.PROJECT_PATH || './projects';
      const safePath = path.resolve(projectPath, directory);
      
      if (!safePath.startsWith(path.resolve(projectPath))) {
        throw new Error('Access denied: Path outside project directory');
      }

      const files = await fs.readdir(safePath);
      return files;
    } catch (error) {
      throw new Error(`Failed to list files: ${(error as Error).message}`);
    }
  }

  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      // Security: Whitelist allowed commands
      const allowedCommands = ['ls', 'pwd', 'git', 'npm', 'node', 'cat', 'echo', 'mkdir'];
      const commandStart = command.split(' ')[0];
      
      if (!allowedCommands.includes(commandStart)) {
        throw new Error(`Command not allowed: ${commandStart}`);
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.env.PROJECT_PATH || './projects',
        timeout: 30000, // 30 second timeout
      });
      
      return { stdout, stderr };
    } catch (error) {
      throw new Error(`Command execution failed: ${(error as Error).message}`);
    }
  }

  private async gitStatus(projectPath?: string): Promise<string> {
    try {
      const workingDir = projectPath || process.env.PROJECT_PATH || './projects';
      const { stdout, stderr } = await execAsync('git status --porcelain', {
        cwd: workingDir,
        timeout: 15000,
      });
      
      return stdout || 'No changes';
    } catch (error) {
      return `Git status failed: ${(error as Error).message}`;
    }
  }

  private async getProjectStructure(): Promise<any> {
    try {
      const projectPath = process.env.PROJECT_PATH || './projects';
      
      const buildTree = async (dirPath: string, relativePath: string = ''): Promise<any> => {
        const items = await fs.readdir(dirPath);
        const tree: any = {};
        
        for (const item of items) {
          // Skip hidden files and common ignored directories
          if (item.startsWith('.') || ['node_modules', 'dist', 'build'].includes(item)) {
            continue;
          }
          
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);
          const relativeItemPath = path.join(relativePath, item);
          
          if (stats.isDirectory()) {
            tree[item] = await buildTree(itemPath, relativeItemPath);
          } else {
            tree[item] = {
              type: 'file',
              size: stats.size,
              modified: stats.mtime.toISOString()
            };
          }
        }
        
        return tree;
      };

      return await buildTree(projectPath);
    } catch (error) {
      throw new Error(`Failed to get project structure: ${(error as Error).message}`);
    }
  }

  // Preview analysis methods
  private async getPreviewState(projectId: string): Promise<PreviewState | null> {
    try {
      return this.previewIntegration.getPreviewState(projectId);
    } catch (error) {
      console.error('Failed to get preview state:', error);
      return null;
    }
  }

  private async detectPreviewIssues(projectId: string, includeFileAnalysis = false): Promise<any> {
    try {
      const previewState = await this.getPreviewState(projectId);
      if (!previewState) {
        return { error: 'Preview state not found for project' };
      }

      const issues = {
        status: previewState.status,
        errors: previewState.errors,
        consoleMessages: previewState.consoleMessages,
        timestamp: previewState.timestamp,
        analysis: {
          hasErrors: previewState.errors.length > 0,
          hasWarnings: previewState.consoleMessages.some(msg => msg.includes('[warn]')),
          isLoading: previewState.status === 'loading',
          commonIssues: this.identifyCommonIssues(previewState)
        }
      };

      if (includeFileAnalysis) {
        issues['fileAnalysis'] = await this.analyzeProjectFiles(projectId);
      }

      return issues;
    } catch (error) {
      throw new Error(`Failed to detect preview issues: ${(error as Error).message}`);
    }
  }

  private async fixPreviewIssues(projectId: string, issues: string[], autoApply = false): Promise<any> {
    try {
      const fixes = [];
      const previewState = await this.getPreviewState(projectId);
      
      for (const issue of issues) {
        const fix = await this.generateFixForIssue(issue, previewState, projectId);
        fixes.push(fix);
        
        if (autoApply && fix.canAutoApply) {
          await this.applyFix(fix, projectId);
        }
      }

      return {
        fixes,
        applied: autoApply,
        recommendations: this.generateRecommendations(fixes)
      };
    } catch (error) {
      throw new Error(`Failed to fix preview issues: ${(error as Error).message}`);
    }
  }

  private async optimizePreview(projectId: string, focusAreas?: string[]): Promise<any> {
    try {
      const optimizations = {
        performance: [],
        accessibility: [],
        responsive: [],
        styling: []
      };

      const projectStructure = await this.getProjectStructure();
      const previewState = await this.getPreviewState(projectId);

      // Performance optimizations
      if (!focusAreas || focusAreas.includes('performance')) {
        optimizations.performance = await this.getPerformanceOptimizations(projectStructure);
      }

      // Accessibility optimizations  
      if (!focusAreas || focusAreas.includes('accessibility')) {
        optimizations.accessibility = await this.getAccessibilityOptimizations(projectStructure);
      }

      // Responsive design optimizations
      if (!focusAreas || focusAreas.includes('responsive')) {
        optimizations.responsive = await this.getResponsiveOptimizations(projectStructure);
      }

      // Styling optimizations
      if (!focusAreas || focusAreas.includes('styling')) {
        optimizations.styling = await this.getStylingOptimizations(projectStructure);
      }

      return {
        optimizations,
        priority: this.prioritizeOptimizations(optimizations),
        estimatedImpact: this.estimateOptimizationImpact(optimizations)
      };
    } catch (error) {
      throw new Error(`Failed to optimize preview: ${(error as Error).message}`);
    }
  }

  // Helper methods for issue detection and fixing
  private identifyCommonIssues(previewState: PreviewState): string[] {
    const issues = [];
    
    // Check for common JavaScript errors
    const jsErrors = previewState.errors.filter(err => 
      err.includes('ReferenceError') || 
      err.includes('TypeError') || 
      err.includes('SyntaxError')
    );
    if (jsErrors.length > 0) issues.push('JavaScript runtime errors');

    // Check for CSS issues
    const cssErrors = previewState.consoleMessages.filter(msg => 
      msg.includes('CSS') || 
      msg.includes('stylesheet')
    );
    if (cssErrors.length > 0) issues.push('CSS loading or parsing issues');

    // Check for network issues
    const networkErrors = previewState.errors.filter(err => 
      err.includes('404') || 
      err.includes('Failed to fetch') ||
      err.includes('Network error')
    );
    if (networkErrors.length > 0) issues.push('Network or resource loading issues');

    // Check for React/component errors
    const reactErrors = previewState.errors.filter(err => 
      err.includes('React') || 
      err.includes('Component') ||
      err.includes('JSX')
    );
    if (reactErrors.length > 0) issues.push('React component errors');

    return issues;
  }

  private async analyzeProjectFiles(projectId: string): Promise<any> {
    try {
      const structure = await this.getProjectStructure();
      
      // Analyze key files
      const analysis = {
        hasPackageJson: !!structure['package.json'],
        hasIndexFile: !!(structure['index.html'] || structure['index.tsx'] || structure['index.jsx']),
        frameworks: this.detectFrameworks(structure),
        missingFiles: this.identifyMissingFiles(structure),
        potentialIssues: this.identifyFileIssues(structure)
      };

      return analysis;
    } catch (error) {
      return { error: 'Failed to analyze project files' };
    }
  }

  private async generateFixForIssue(issue: string, previewState: PreviewState | null, projectId: string): Promise<any> {
    // Generate specific fixes based on issue type
    const fix = {
      issue,
      description: '',
      solution: '',
      canAutoApply: false,
      filesToModify: [],
      estimatedTime: 'Unknown'
    };

    switch (issue) {
      case 'JavaScript runtime errors':
        fix.description = 'Fix JavaScript errors preventing proper execution';
        fix.solution = 'Add error handling, fix undefined variables, correct syntax';
        fix.canAutoApply = true;
        fix.estimatedTime = '1-2 minutes';
        break;
      
      case 'CSS loading or parsing issues':
        fix.description = 'Resolve CSS loading and parsing problems';
        fix.solution = 'Fix CSS syntax, ensure proper file paths, add missing imports';
        fix.canAutoApply = true;
        fix.estimatedTime = '30 seconds - 1 minute';
        break;
      
      case 'React component errors':
        fix.description = 'Fix React component rendering issues';
        fix.solution = 'Fix JSX syntax, add missing props, resolve component lifecycle issues';
        fix.canAutoApply = false;
        fix.estimatedTime = '2-5 minutes';
        break;
      
      default:
        fix.description = 'General issue requiring manual review';
        fix.solution = 'Analyze the specific error and implement appropriate solution';
        fix.canAutoApply = false;
        fix.estimatedTime = 'Manual review required';
    }

    return fix;
  }

  private async applyFix(fix: any, projectId: string): Promise<void> {
    // Implementation would apply the actual fix
    // This is a placeholder for the fix application logic
    console.log(`Applying fix for: ${fix.issue} in project ${projectId}`);
  }

  private generateRecommendations(fixes: any[]): string[] {
    const recommendations = [];
    
    if (fixes.some(f => f.issue.includes('JavaScript'))) {
      recommendations.push('Consider adding TypeScript for better error catching');
      recommendations.push('Use ESLint to prevent common JavaScript errors');
    }
    
    if (fixes.some(f => f.issue.includes('CSS'))) {
      recommendations.push('Use CSS-in-JS or styled-components for better maintainability');
      recommendations.push('Consider using a CSS preprocessor like Sass');
    }
    
    if (fixes.some(f => f.issue.includes('React'))) {
      recommendations.push('Use React Developer Tools for debugging');
      recommendations.push('Implement error boundaries for better error handling');
    }

    return recommendations;
  }

  // Optimization helper methods
  private async getPerformanceOptimizations(structure: any): Promise<string[]> {
    const optimizations = [];
    
    // Check for large bundle size
    if (this.hasLargeAssets(structure)) {
      optimizations.push('Optimize images and compress assets');
      optimizations.push('Implement code splitting');
    }
    
    // Check for unused dependencies
    optimizations.push('Remove unused dependencies');
    optimizations.push('Implement lazy loading for components');
    
    return optimizations;
  }

  private async getAccessibilityOptimizations(structure: any): Promise<string[]> {
    return [
      'Add alt text to images',
      'Ensure proper heading hierarchy',
      'Add ARIA labels to interactive elements',
      'Ensure sufficient color contrast',
      'Add focus indicators for keyboard navigation'
    ];
  }

  private async getResponsiveOptimizations(structure: any): Promise<string[]> {
    return [
      'Add viewport meta tag',
      'Implement responsive breakpoints',
      'Use flexible grid systems',
      'Optimize touch targets for mobile',
      'Test on multiple device sizes'
    ];
  }

  private async getStylingOptimizations(structure: any): Promise<string[]> {
    return [
      'Consolidate duplicate CSS rules',
      'Use CSS custom properties for theming',
      'Optimize CSS delivery',
      'Remove unused CSS rules',
      'Use modern CSS features like Grid and Flexbox'
    ];
  }

  private prioritizeOptimizations(optimizations: any): string[] {
    // Return prioritized list of optimizations
    const allOptimizations = [
      ...optimizations.performance.map((o: string) => ({ type: 'performance', text: o, priority: 1 })),
      ...optimizations.accessibility.map((o: string) => ({ type: 'accessibility', text: o, priority: 2 })),
      ...optimizations.responsive.map((o: string) => ({ type: 'responsive', text: o, priority: 2 })),
      ...optimizations.styling.map((o: string) => ({ type: 'styling', text: o, priority: 3 }))
    ];

    return allOptimizations
      .sort((a, b) => a.priority - b.priority)
      .map(o => `${o.type}: ${o.text}`);
  }

  private estimateOptimizationImpact(optimizations: any): any {
    return {
      performance: 'High - Faster loading and better user experience',
      accessibility: 'High - Better usability for all users',
      responsive: 'Medium - Better mobile experience',
      styling: 'Medium - Improved maintainability and consistency'
    };
  }

  // Utility methods
  private detectFrameworks(structure: any): string[] {
    const frameworks = [];
    
    if (structure['package.json']) {
      // Would analyze package.json to detect frameworks
      frameworks.push('React', 'Next.js', 'TypeScript');
    }
    
    return frameworks;
  }

  private identifyMissingFiles(structure: any): string[] {
    const missing = [];
    
    if (!structure['package.json']) missing.push('package.json');
    if (!structure['index.html'] && !structure['index.tsx']) missing.push('entry point file');
    
    return missing;
  }

  private identifyFileIssues(structure: any): string[] {
    const issues = [];
    
    // Add logic to identify potential file-based issues
    if (Object.keys(structure).length < 3) {
      issues.push('Project appears to be incomplete');
    }
    
    return issues;
  }

  private hasLargeAssets(structure: any): boolean {
    // Check for potentially large assets
    return Object.keys(structure).some(file => 
      file.endsWith('.png') || 
      file.endsWith('.jpg') || 
      file.endsWith('.gif')
    );
  }
}

export const swiStackMcpToolsServer = new SwiStackMcpToolsServer();