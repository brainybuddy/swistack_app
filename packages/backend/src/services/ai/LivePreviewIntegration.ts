import { mistralAgentService } from './MistralAgentService';
import { getWebSocketService } from '../WebSocketService';

export interface PreviewState {
  url: string;
  projectId: string;
  timestamp: Date;
  status: 'loading' | 'ready' | 'error';
  consoleMessages: string[];
  errors: string[];
}

export class LivePreviewIntegration {
  private previewStates: Map<string, PreviewState> = new Map();

  constructor() {
    this.setupPreviewMonitoring();
  }

  private setupPreviewMonitoring() {
    const wsService = getWebSocketService();
    
    // Listen for preview state updates from frontend
    wsService['io'].on('connection', (socket: any) => {
      socket.on('preview:state', (data) => {
        const { projectId, url, status, consoleMessages, errors } = data;
        
        this.updatePreviewState(projectId, {
          url,
          projectId,
          timestamp: new Date(),
          status,
          consoleMessages: consoleMessages || [],
          errors: errors || []
        });
      });

      socket.on('preview:console', (data) => {
        const { projectId, message, type } = data;
        this.handleConsoleMessage(projectId, message, type);
      });

      socket.on('preview:error', (data) => {
        const { projectId, error } = data;
        this.handlePreviewError(projectId, error);
      });
    });
  }

  private updatePreviewState(projectId: string, state: PreviewState) {
    this.previewStates.set(projectId, state);
    
    // Broadcast to all clients in project
    const wsService = getWebSocketService();
    wsService['io'].to(`project:${projectId}`).emit('preview:updated', state);
  }

  private handleConsoleMessage(projectId: string, message: string, type: 'log' | 'warn' | 'error') {
    const state = this.previewStates.get(projectId);
    if (state) {
      state.consoleMessages.push(`[${type}] ${message}`);
      state.timestamp = new Date();
      
      if (type === 'error') {
        state.errors.push(message);
      }
      
      this.updatePreviewState(projectId, state);
    }
  }

  private handlePreviewError(projectId: string, error: string) {
    const state = this.previewStates.get(projectId);
    if (state) {
      state.status = 'error';
      state.errors.push(error);
      state.timestamp = new Date();
      
      this.updatePreviewState(projectId, state);
    }
  }

  /**
   * Get current preview state for a project
   */
  getPreviewState(projectId: string): PreviewState | null {
    return this.previewStates.get(projectId) || null;
  }

  /**
   * Capture preview screenshot for agent analysis
   */
  async capturePreviewForAgent(projectId: string): Promise<string> {
    const state = this.previewStates.get(projectId);
    if (!state) {
      return 'No preview available for this project';
    }

    const summary = `
Preview Status: ${state.status}
URL: ${state.url}
Last Updated: ${state.timestamp.toISOString()}

Console Messages (last 10):
${state.consoleMessages.slice(-10).join('\n')}

${state.errors.length > 0 ? `\nErrors:\n${state.errors.join('\n')}` : ''}
    `.trim();

    return summary;
  }

  /**
   * Inject code changes into live preview
   */
  async injectCodeIntoPreview(projectId: string, filePath: string, content: string): Promise<boolean> {
    try {
      const wsService = getWebSocketService();
      
      // Broadcast file change to trigger hot reload
      wsService.broadcastFileChange(projectId, filePath, 'update', content);
      
      // Send specific preview reload command
      wsService['io'].to(`project:${projectId}`).emit('preview:reload', {
        filePath,
        content,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error injecting code into preview:', error);
      return false;
    }
  }

  /**
   * Get preview console logs for agent analysis
   */
  getPreviewLogs(projectId: string, limit: number = 20): string[] {
    const state = this.previewStates.get(projectId);
    if (!state) {
      return [];
    }

    return state.consoleMessages.slice(-limit);
  }

  /**
   * Get preview errors for agent analysis
   */
  getPreviewErrors(projectId: string): string[] {
    const state = this.previewStates.get(projectId);
    if (!state) {
      return [];
    }

    return state.errors;
  }

  /**
   * Clear preview errors (after agent fixes them)
   */
  clearPreviewErrors(projectId: string) {
    const state = this.previewStates.get(projectId);
    if (state) {
      state.errors = [];
      this.updatePreviewState(projectId, state);
    }
  }
}

export const livePreviewIntegration = new LivePreviewIntegration();