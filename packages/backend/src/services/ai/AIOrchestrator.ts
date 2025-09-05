import { EventEmitter } from 'events';
import { codeExecutionService } from './CodeExecutionService';
// import TerminalService from '../TerminalService'; // TODO: Implement TerminalService
import { ProjectFileModel } from '../../models/ProjectFile';
import {
  AIMessage,
  AIResponse,
  AIAction,
  ExecutionResult,
  AIFileOperation,
  CodeGeneration
} from '@swistack/shared/types/ai';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface OrchestratorEvent {
  type: 'action_started' | 'action_completed' | 'action_failed' | 'progress' | 'output';
  actionId: string;
  action?: AIAction;
  progress?: number;
  output?: string;
  error?: string;
  result?: any;
  projectId?: string;
}

export class AIOrchestrator extends EventEmitter {
  private autonomousAgent: any = null;
  private codeExecutor = codeExecutionService;
  private activeActions: Map<string, AIAction> = new Map();
  private terminalSessions: Map<string, string> = new Map(); // projectId -> sessionId
  private projectContexts: Map<string, any> = new Map();

  constructor() {
    super();
  }

  private getAutonomousAgent() {
    if (!this.autonomousAgent) {
      // Lazy load to avoid circular dependency
      const { autonomousAgentService } = require('./AutonomousAgentService');
      this.autonomousAgent = autonomousAgentService;
    }
    return this.autonomousAgent;
  }

  /**
   * Process an AI chat message and execute any resulting actions
   */
  async processChat(
    projectId: string,
    message: string,
    conversationId?: string,
    options?: {
      includeProjectContext?: boolean;
      includeFileContext?: boolean;
      currentFile?: string;
      selectedCode?: string;
      autoExecute?: boolean;
    }
  ): Promise<{
    response: AIResponse;
    executedActions: AIAction[];
    results: ExecutionResult[];
    conversationId: string;
  }> {
    try {
      // Get AI response
      const response = await this.getAutonomousAgent().chat(
        projectId,
        message,
        conversationId,
        options
      );

      // Extract and parse actions from response
      const actions = this.extractActions(response);
      console.log(`[AIOrchestrator] Extracted ${actions.length} actions from response`);
      
      const executedActions: AIAction[] = [];
      const results: ExecutionResult[] = [];

      // Execute actions if autoExecute is enabled
      if (options?.autoExecute && actions.length > 0) {
        console.log(`[AIOrchestrator] Found ${actions.length} actions to execute`);
        for (const action of actions) {
          if (!action.requiresConfirmation || options.autoExecute) {
            try {
              console.log(`[AIOrchestrator] Executing action: ${action.type}`, action.params);
              const result = await this.executeAction(projectId, action);
              executedActions.push(action);
              results.push(result);
              console.log(`[AIOrchestrator] Action result:`, result);
            } catch (error) {
              console.error(`[AIOrchestrator] Action execution error:`, error);
              executedActions.push(action);
              results.push({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                output: ''
              });
            }
          }
        }
      }

      // Update context with execution results
      if (results.length > 0) {
        await this.updateProjectContext(projectId, results);
      }

      // Extract conversationId from response
      const returnedConversationId = (response as any).conversationId || conversationId || '';
      
      // Clean up response content - remove [ACTIONS] block if actions were executed
      if (executedActions.length > 0 && response.content) {
        // Remove the [ACTIONS] block from the response
        response.content = response.content.replace(/\[ACTIONS\][\s\S]*?\[\/ACTIONS\]/g, '').trim();
        
        // Add execution status
        const successCount = results.filter(r => r.success).length;
        if (successCount === results.length) {
          response.content += '\n\n✅ All actions completed successfully.';
        } else if (successCount > 0) {
          response.content += `\n\n⚠️ ${successCount} of ${results.length} actions completed.`;
        } else {
          response.content += '\n\n❌ Actions failed to execute.';
        }
      }
      
      return {
        response,
        executedActions,
        results,
        conversationId: returnedConversationId
      };
    } catch (error) {
      console.error('[AIOrchestrator] Process chat error:', error);
      throw error;
    }
  }

  /**
   * Execute an AI action (file operation, command, etc.)
   */
  async executeAction(projectId: string, action: AIAction): Promise<ExecutionResult> {
    const actionId = this.generateActionId();
    this.activeActions.set(actionId, action);

    this.emit('action_started', {
      type: 'action_started',
      actionId,
      action,
      projectId
    } as OrchestratorEvent);

    try {
      let result: ExecutionResult;

      switch (action.type) {
        case 'create_file':
          result = await this.executeFileCreation(projectId, action);
          break;
        
        case 'modify_file':
          result = await this.executeFileModification(projectId, action);
          break;
        
        case 'delete_file':
          result = await this.executeFileDeletion(projectId, action);
          break;
        
        case 'run_command':
          result = await this.executeCommand(projectId, action);
          break;
        
        case 'install_package':
          result = await this.executePackageInstallation(projectId, action);
          break;
        
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      this.emit('action_completed', {
        type: 'action_completed',
        actionId,
        action,
        result,
        projectId
      } as OrchestratorEvent);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.emit('action_failed', {
        type: 'action_failed',
        actionId,
        action,
        error: errorMessage,
        projectId
      } as OrchestratorEvent);

      return {
        success: false,
        output: '',
        error: errorMessage
      };
    } finally {
      this.activeActions.delete(actionId);
    }
  }

  /**
   * Execute file creation with proper path resolution
   */
  private async executeFileCreation(projectId: string, action: AIAction): Promise<ExecutionResult> {
    // Handle both 'path' and 'filePath' for compatibility
    const filePath = action.params.path || action.params.filePath;
    const content = action.params.content || '';
    
    if (!filePath) {
      return {
        success: false,
        output: '',
        error: 'File path is required'
      };
    }
    
    const projectBasePath = await this.getProjectBasePath(projectId);
    const fullPath = path.join(projectBasePath, filePath);

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, content, 'utf8');
      
      // Try to track in database with proper UUID handling
      try {
        // Use a fixed UUID for AI assistant or get from request context
        const aiUserId = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'; // Fixed AI assistant UUID
        
        await ProjectFileModel.create({
          projectId,
          path: filePath,
          name: path.basename(filePath),
          type: 'file',
          content,
          size: Buffer.byteLength(content),
          mimeType: this.getMimeType(filePath),
          encoding: 'utf8',
          isBinary: false,
          createdBy: aiUserId
        });
      } catch (dbError) {
        // Log but don't fail the file creation
        console.log('Could not track file in database:', dbError.message);
      }

      return {
        success: true,
        output: `File created: ${filePath}`,
        error: ''
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to create file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute file modification with intelligent path resolution
   */
  private async executeFileModification(projectId: string, action: AIAction): Promise<ExecutionResult> {
    // Handle both 'path' and 'filePath' for compatibility
    const filePath = action.params.path || action.params.filePath;
    const content = action.params.content;
    const changes = action.params.changes;
    
    if (!filePath) {
      return {
        success: false,
        output: '',
        error: 'File path is required'
      };
    }
    const projectBasePath = await this.getProjectBasePath(projectId);
    
    // Resolve the actual file path
    const resolvedPath = await this.resolveFilePath(projectId, filePath);
    if (!resolvedPath) {
      return {
        success: false,
        output: '',
        error: `File not found: ${filePath}`
      };
    }

    const fullPath = path.join(projectBasePath, resolvedPath);

    try {
      if (content) {
        // Full file replacement
        await fs.writeFile(fullPath, content, 'utf8');
      } else if (changes) {
        // Partial updates (diff-based)
        const existingContent = await fs.readFile(fullPath, 'utf8');
        const updatedContent = this.applyChanges(existingContent, changes);
        await fs.writeFile(fullPath, updatedContent, 'utf8');
      }

      // Try to update database with proper UUID handling
      try {
        const aiUserId = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'; // Fixed AI assistant UUID
        const file = await ProjectFileModel.findByPath(projectId, resolvedPath);
        if (file) {
          await ProjectFileModel.updateContent(
            file.id,
            content || await fs.readFile(fullPath, 'utf8'),
            Buffer.byteLength(content || ''),
            aiUserId
          );
        }
      } catch (dbError) {
        console.log('Could not update file in database:', dbError.message);
      }

      return {
        success: true,
        output: `File modified: ${resolvedPath}`,
        error: ''
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to modify file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute file deletion
   */
  private async executeFileDeletion(projectId: string, action: AIAction): Promise<ExecutionResult> {
    // Handle both 'path' and 'filePath' for compatibility
    const filePath = action.params.path || action.params.filePath;
    
    if (!filePath) {
      return {
        success: false,
        output: '',
        error: 'File path is required'
      };
    }
    const projectBasePath = await this.getProjectBasePath(projectId);
    const fullPath = path.join(projectBasePath, filePath);

    try {
      await fs.unlink(fullPath);
      
      // Try to delete from database, but don't fail if it doesn't work
      try {
        await ProjectFileModel.deleteByPath(projectId, filePath);
      } catch (dbError) {
        console.log('Could not delete file from database:', dbError.message);
      }

      return {
        success: true,
        output: `File deleted: ${filePath}`,
        error: ''
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute terminal command with session management
   */
  private async executeCommand(projectId: string, action: AIAction): Promise<ExecutionResult> {
    const { command, cwd } = action.params;
    
    // Get or create terminal session
    let sessionId = this.terminalSessions.get(projectId);
    if (!sessionId) {
      // sessionId = TerminalService.createSession(projectId, 'ai-assistant'); // TODO: Implement TerminalService
      this.terminalSessions.set(projectId, sessionId);
    }

    try {
      // Execute command through terminal service
      // const outputs = await TerminalService.executeCommand(sessionId, command); // TODO: Implement TerminalService
      const outputs = { success: false, output: 'Terminal service not implemented', error: 'Service unavailable' };
      
      // Combine outputs based on actual TerminalOutput structure
      const output = outputs
        .filter(o => o.type === 'stdout')
        .map(o => o.content)
        .join('\n');
      
      const error = outputs
        .filter(o => o.type === 'stderr')
        .map(o => o.content)
        .join('\n');

      // Stream output to AI context
      if (output || error) {
        this.emit('output', {
          type: 'output',
          actionId: this.generateActionId(),
          output: output || error
        } as OrchestratorEvent);
        
        // Add to AI context for learning
        await this.addTerminalContextToAI(projectId, command, output, error);
      }

      return {
        success: !error || error.length === 0,
        output,
        error
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute package installation
   */
  private async executePackageInstallation(projectId: string, action: AIAction): Promise<ExecutionResult> {
    const packages = action.params.packages || [];
    const isDev = action.params.isDev || false;
    
    if (!packages || packages.length === 0) {
      return {
        success: false,
        output: '',
        error: 'No packages specified'
      };
    }
    const projectPath = await this.getProjectBasePath(projectId);
    
    const command = `npm install ${isDev ? '--save-dev' : ''} ${packages.join(' ')}`;
    
    return this.executeCommand(projectId, {
      ...action,
      params: { command, cwd: projectPath }
    });
  }

  /**
   * Extract actions from AI response
   */
  private extractActions(response: AIResponse): AIAction[] {
    const actions: AIAction[] = [];
    
    // Check for explicit actions in metadata
    if (response.metadata?.actions) {
      actions.push(...response.metadata.actions);
    }

    // Parse content for [ACTIONS] blocks
    const actionsBlockMatch = response.content.match(/\[ACTIONS\]([\s\S]*?)\[\/ACTIONS\]/);
    if (actionsBlockMatch) {
      const actionsContent = actionsBlockMatch[1];
      
      // Parse individual actions
      const actionMatch = actionsContent.match(/action:(\w+)([^]*?)(?=action:|$)/g);
      if (actionMatch) {
        for (const actionText of actionMatch) {
          try {
            const typeMatch = actionText.match(/action:(\w+)/);
            const pathMatch = actionText.match(/path:\s*(.+)/);
            const contentMatch = actionText.match(/content:\s*\|\s*\n([\s\S]*?)$/);
            
            if (typeMatch && pathMatch) {
              const action: AIAction = {
                type: typeMatch[1] as any,
                params: {
                  path: pathMatch[1].trim(),
                  filePath: pathMatch[1].trim()
                },
                requiresConfirmation: false
              };
              
              if (contentMatch) {
                action.params.content = contentMatch[1].trim();
              }
              
              actions.push(action);
              console.log(`[AIOrchestrator] Extracted action: ${action.type} for ${action.params.path}`);
            }
          } catch (e) {
            console.error('[AIOrchestrator] Failed to parse action:', e);
          }
        }
      }
    }

    // Legacy: Parse content for action patterns (for backward compatibility)
    const actionPatterns = [
      /```action:create_file\n(.*?)\n```/gs,
      /```action:modify_file\n(.*?)\n```/gs,
      /```action:run_command\n(.*?)\n```/gs,
    ];

    for (const pattern of actionPatterns) {
      const matches = response.content.matchAll(pattern);
      for (const match of matches) {
        try {
          const actionData = JSON.parse(match[1]);
          actions.push(actionData);
        } catch (e) {
          // Invalid action format, skip
        }
      }
    }

    return actions;
  }

  /**
   * Add terminal output to AI context
   */
  private async addTerminalContextToAI(
    projectId: string,
    command: string,
    output: string,
    error: string
  ): Promise<void> {
    const context = this.projectContexts.get(projectId) || { terminalHistory: [] };
    
    context.terminalHistory.push({
      command,
      output,
      error,
      timestamp: new Date()
    });

    // Keep last 10 commands for context
    if (context.terminalHistory.length > 10) {
      context.terminalHistory = context.terminalHistory.slice(-10);
    }

    this.projectContexts.set(projectId, context);

    // Update AI agent context
    await this.getAutonomousAgent().updateProjectContext(projectId, [{
      type: 'modify',
      filePath: 'terminal-context',
      newContent: JSON.stringify(context.terminalHistory)
    }]);
  }

  /**
   * Update project context with execution results
   */
  private async updateProjectContext(projectId: string, results: ExecutionResult[]): Promise<void> {
    const changes = results.map(result => ({
      type: 'modify' as const,
      filePath: 'execution-log',
      newContent: JSON.stringify(result)
    }));

    await this.getAutonomousAgent().updateProjectContext(projectId, changes);
  }

  /**
   * Resolve file path intelligently
   */
  private async resolveFilePath(projectId: string, requestedPath: string): Promise<string | null> {
    const projectBasePath = await this.getProjectBasePath(projectId);
    
    // First, check if the exact path exists
    try {
      await fs.access(path.join(projectBasePath, requestedPath));
      return requestedPath;
    } catch (e) {
      // File doesn't exist at the exact path
    }

    // Check database for similar files
    const allFiles = await ProjectFileModel.findAll({ projectId });
    
    // Find best match
    const matches = allFiles
      .filter(file => 
        file.path.toLowerCase().includes(requestedPath.toLowerCase()) ||
        file.name.toLowerCase().includes(path.basename(requestedPath).toLowerCase())
      )
      .sort((a, b) => {
        // Prioritize exact name matches
        const aName = path.basename(a.path);
        const bName = path.basename(b.path);
        const requestedName = path.basename(requestedPath);
        
        if (aName === requestedName) return -1;
        if (bName === requestedName) return 1;
        
        // Then prioritize by path similarity
        return a.path.length - b.path.length;
      });

    return matches.length > 0 ? matches[0].path : null;
  }

  /**
   * Get project base path
   */
  private async getProjectBasePath(projectId: string): Promise<string> {
    // Use repositories directory structure
    const workspaceBase = process.env.WORKSPACE_BASE_PATH || process.cwd();
    const baseDir = path.join(workspaceBase, 'repositories', projectId);
    
    // Ensure directory exists
    try {
      await fs.mkdir(baseDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
    
    return baseDir;
  }

  /**
   * Apply text changes to content
   */
  private applyChanges(content: string, changes: any[]): string {
    let result = content;
    
    for (const change of changes) {
      if (change.type === 'replace') {
        result = result.replace(change.from, change.to);
      } else if (change.type === 'insert') {
        const lines = result.split('\n');
        lines.splice(change.line, 0, change.text);
        result = lines.join('\n');
      } else if (change.type === 'delete') {
        const lines = result.split('\n');
        lines.splice(change.line, change.count || 1);
        result = lines.join('\n');
      }
    }
    
    return result;
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.jsx': 'text/jsx',
      '.tsx': 'text/tsx',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.scss': 'text/scss',
      '.py': 'text/x-python',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'text/plain';
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  async cleanup(projectId: string): Promise<void> {
    // Close terminal session
    const sessionId = this.terminalSessions.get(projectId);
    if (sessionId) {
      // TerminalService.closeSession(sessionId); // TODO: Implement TerminalService
      this.terminalSessions.delete(projectId);
    }

    // Clear context
    this.projectContexts.delete(projectId);
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();