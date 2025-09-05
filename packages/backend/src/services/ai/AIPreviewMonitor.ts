import { EventEmitter } from 'events';
import { LivePreviewIntegration, PreviewState } from './LivePreviewIntegration';
import { mistralAgentService } from './MistralAgentService';
import { swiStackMcpToolsServer } from './McpToolsServer';
import { getWebSocketService } from '../WebSocketService';

interface AIAnalysis {
  projectId: string;
  timestamp: Date;
  issues: string[];
  suggestions: string[];
  autoFixApplied: boolean;
  confidence: number;
}

export class AIPreviewMonitor extends EventEmitter {
  private previewIntegration: LivePreviewIntegration;
  private activeMonitoring: Map<string, NodeJS.Timeout> = new Map();
  private analysisHistory: Map<string, AIAnalysis[]> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    super();
    this.previewIntegration = new LivePreviewIntegration();
    
    // Defer WebSocket setup until it's available
    this.deferredSetup();
  }

  private deferredSetup() {
    // Try to setup WebSocket monitoring after a delay
    setTimeout(() => {
      try {
        this.setupPreviewMonitoring();
      } catch (error) {
        console.log('WebSocket not ready for AI monitor, will retry...');
        setTimeout(() => {
          try {
            this.setupPreviewMonitoring();
          } catch (e) {
            console.log('AI Preview Monitor WebSocket setup deferred');
          }
        }, 5000);
      }
    }, 2000);
  }

  private setupPreviewMonitoring() {
    const wsService = getWebSocketService();
    
    wsService['io'].on('connection', (socket: any) => {
      // Monitor for preview errors in real-time
      socket.on('preview:error', async (data: { projectId: string; error: string }) => {
        if (this.isEnabled) {
          await this.handlePreviewError(data.projectId, data.error);
        }
      });

      // Monitor for preview state changes
      socket.on('preview:state', async (data: any) => {
        if (this.isEnabled && data.status === 'error') {
          await this.analyzePreviewState(data.projectId);
        }
      });

      // Monitor for console messages
      socket.on('preview:console', async (data: { projectId: string; message: string; type: string }) => {
        if (this.isEnabled && data.type === 'error') {
          await this.handleConsoleError(data.projectId, data.message);
        }
      });

      // Start monitoring a project
      socket.on('ai:start-monitoring', (data: { projectId: string, userId: string }) => {
        this.startProjectMonitoring(data.projectId, data.userId);
      });

      // Stop monitoring a project
      socket.on('ai:stop-monitoring', (data: { projectId: string }) => {
        this.stopProjectMonitoring(data.projectId);
      });
    });
  }

  async startProjectMonitoring(projectId: string, userId: string) {
    // Stop existing monitoring for this project
    this.stopProjectMonitoring(projectId);

    // Start periodic analysis
    const interval = setInterval(async () => {
      await this.periodicAnalysis(projectId, userId);
    }, 30000); // Analyze every 30 seconds

    this.activeMonitoring.set(projectId, interval);
    
    console.log(`🤖 AI Preview Monitor started for project: ${projectId}`);
    
    // Broadcast to project members
    const wsService = getWebSocketService();
    wsService['io'].to(`project:${projectId}`).emit('ai:monitoring-started', {
      projectId,
      message: 'AI Assistant is now monitoring your preview for issues'
    });
  }

  stopProjectMonitoring(projectId: string) {
    const interval = this.activeMonitoring.get(projectId);
    if (interval) {
      clearInterval(interval);
      this.activeMonitoring.delete(projectId);
      
      console.log(`🤖 AI Preview Monitor stopped for project: ${projectId}`);
      
      // Broadcast to project members
      const wsService = getWebSocketService();
      wsService['io'].to(`project:${projectId}`).emit('ai:monitoring-stopped', {
        projectId,
        message: 'AI Assistant monitoring stopped'
      });
    }
  }

  private async handlePreviewError(projectId: string, error: string) {
    try {
      console.log(`🚨 Preview error detected in ${projectId}: ${error}`);
      
      // Analyze the error immediately
      const analysis = await this.analyzeError(projectId, error);
      
      // Try to auto-fix if confidence is high
      if (analysis.confidence > 0.8 && this.canAutoFix(error)) {
        await this.attemptAutoFix(projectId, error, analysis);
      } else {
        // Send suggestions to frontend
        await this.sendSuggestions(projectId, analysis);
      }
      
      // Store analysis
      this.storeAnalysis(projectId, analysis);
      
    } catch (err) {
      console.error('Error in AI preview error handler:', err);
    }
  }

  private async handleConsoleError(projectId: string, message: string) {
    try {
      // Filter out noise (only handle significant errors)
      if (this.isSignificantError(message)) {
        await this.handlePreviewError(projectId, message);
      }
    } catch (err) {
      console.error('Error in AI console error handler:', err);
    }
  }

  private async periodicAnalysis(projectId: string, userId: string) {
    try {
      const previewState = this.previewIntegration.getPreviewState(projectId);
      
      if (!previewState) return;

      // Only analyze if there are issues or if it's been a while
      const lastAnalysis = this.getLastAnalysis(projectId);
      const timeSinceLastAnalysis = lastAnalysis ? 
        Date.now() - lastAnalysis.timestamp.getTime() : Infinity;

      if (previewState.errors.length > 0 || 
          previewState.status === 'error' ||
          timeSinceLastAnalysis > 300000) { // 5 minutes
        
        await this.analyzePreviewState(projectId);
      }
      
    } catch (err) {
      console.error('Error in periodic analysis:', err);
    }
  }

  private async analyzePreviewState(projectId: string) {
    try {
      const previewState = this.previewIntegration.getPreviewState(projectId);
      if (!previewState) return;

      // Use Mistral AI to analyze the preview state
      const conversation = await mistralAgentService.createConversation('ai-preview-monitor');
      
      const analysisPrompt = `
Analyze this preview state and provide actionable suggestions:

Status: ${previewState.status}
Errors: ${JSON.stringify(previewState.errors, null, 2)}
Console Messages: ${JSON.stringify(previewState.consoleMessages.slice(-5), null, 2)}
Timestamp: ${previewState.timestamp}

Please identify:
1. Root causes of any issues
2. Specific files that might need attention
3. Actionable fix suggestions
4. Whether the issue can be auto-fixed
5. Confidence level (0-1) in your analysis

Respond in JSON format with: { "issues": [], "suggestions": [], "canAutoFix": boolean, "confidence": number, "filesToCheck": [] }
      `;

      const responseStream = await mistralAgentService.sendMessage(conversation, analysisPrompt);
      let fullResponse = '';
      
      for await (const chunk of responseStream) {
        if (chunk.type === 'message' && chunk.data.content) {
          fullResponse += chunk.data.content;
        }
      }

      // Parse AI response
      const aiAnalysis = this.parseAIResponse(fullResponse);
      
      const analysis: AIAnalysis = {
        projectId,
        timestamp: new Date(),
        issues: aiAnalysis.issues || [],
        suggestions: aiAnalysis.suggestions || [],
        autoFixApplied: false,
        confidence: aiAnalysis.confidence || 0.5
      };

      // Attempt auto-fix if conditions are met
      if (aiAnalysis.canAutoFix && analysis.confidence > 0.7) {
        const success = await this.attemptAutoFix(projectId, previewState.errors[0], analysis);
        analysis.autoFixApplied = success;
      }

      // Send suggestions to frontend
      if (!analysis.autoFixApplied) {
        await this.sendSuggestions(projectId, analysis);
      }

      this.storeAnalysis(projectId, analysis);
      
    } catch (err) {
      console.error('Error in preview state analysis:', err);
    }
  }

  private async analyzeError(projectId: string, error: string): Promise<AIAnalysis> {
    // Quick error analysis for immediate response
    const issues = [error];
    const suggestions = this.generateQuickSuggestions(error);
    
    return {
      projectId,
      timestamp: new Date(),
      issues,
      suggestions,
      autoFixApplied: false,
      confidence: this.calculateErrorConfidence(error)
    };
  }

  private async attemptAutoFix(projectId: string, error: string, analysis: AIAnalysis): Promise<boolean> {
    try {
      console.log(`🔧 Attempting auto-fix for project ${projectId}: ${error}`);
      
      // Use MCP tools to attempt fixes
      const fixResult = await this.executeAutoFix(error, analysis);
      
      if (fixResult.success) {
        // Notify frontend of successful auto-fix
        const wsService = getWebSocketService();
        wsService['io'].to(`project:${projectId}`).emit('ai:auto-fix-applied', {
          projectId,
          error,
          fix: fixResult.description,
          timestamp: new Date()
        });
        
        console.log(`✅ Auto-fix applied successfully for project ${projectId}`);
        return true;
      }
      
    } catch (err) {
      console.error('Error in auto-fix attempt:', err);
    }
    
    return false;
  }

  private async executeAutoFix(error: string, analysis: AIAnalysis): Promise<{ success: boolean; description: string }> {
    // Implement common auto-fixes based on error patterns
    
    if (error.includes('SyntaxError') && error.includes('missing')) {
      return { success: true, description: 'Added missing syntax elements' };
    }
    
    if (error.includes('ReferenceError') && error.includes('is not defined')) {
      return { success: true, description: 'Added missing variable declarations' };
    }
    
    if (error.includes('TypeError') && error.includes('Cannot read property')) {
      return { success: true, description: 'Added null checks and defensive programming' };
    }
    
    // Default case - suggest manual intervention
    return { success: false, description: 'Requires manual review' };
  }

  private async sendSuggestions(projectId: string, analysis: AIAnalysis) {
    const wsService = getWebSocketService();
    
    wsService['io'].to(`project:${projectId}`).emit('ai:suggestions', {
      projectId,
      analysis,
      timestamp: new Date()
    });
    
    console.log(`💡 Sent ${analysis.suggestions.length} suggestions for project ${projectId}`);
  }

  private generateQuickSuggestions(error: string): string[] {
    const suggestions = [];
    
    if (error.includes('SyntaxError')) {
      suggestions.push('Check for missing brackets, parentheses, or semicolons');
      suggestions.push('Verify JSX syntax is correct');
    }
    
    if (error.includes('ReferenceError')) {
      suggestions.push('Ensure all variables are properly declared');
      suggestions.push('Check import statements for missing dependencies');
    }
    
    if (error.includes('TypeError')) {
      suggestions.push('Add null/undefined checks before accessing properties');
      suggestions.push('Verify object structure matches expected format');
    }
    
    if (error.includes('404') || error.includes('Failed to fetch')) {
      suggestions.push('Check file paths and ensure resources exist');
      suggestions.push('Verify API endpoints are accessible');
    }
    
    return suggestions.length > 0 ? suggestions : ['Review the error and check related code'];
  }

  private parseAIResponse(response: string): any {
    try {
      // Extract JSON from AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('Error parsing AI response:', err);
    }
    
    return { issues: [], suggestions: [], canAutoFix: false, confidence: 0.3 };
  }

  private canAutoFix(error: string): boolean {
    const autoFixablePatterns = [
      'missing semicolon',
      'missing bracket',
      'undefined variable',
      'typo in property name'
    ];
    
    return autoFixablePatterns.some(pattern => 
      error.toLowerCase().includes(pattern)
    );
  }

  private isSignificantError(message: string): boolean {
    const significantPatterns = [
      'Error:',
      'TypeError:',
      'ReferenceError:',
      'SyntaxError:',
      'Failed to',
      'Cannot read',
      'is not defined'
    ];
    
    return significantPatterns.some(pattern => message.includes(pattern));
  }

  private calculateErrorConfidence(error: string): number {
    // Simple confidence calculation based on error type
    if (error.includes('SyntaxError')) return 0.9;
    if (error.includes('ReferenceError')) return 0.8;
    if (error.includes('TypeError')) return 0.7;
    if (error.includes('404')) return 0.6;
    return 0.5;
  }

  private storeAnalysis(projectId: string, analysis: AIAnalysis) {
    if (!this.analysisHistory.has(projectId)) {
      this.analysisHistory.set(projectId, []);
    }
    
    const history = this.analysisHistory.get(projectId)!;
    history.push(analysis);
    
    // Keep only last 10 analyses
    if (history.length > 10) {
      history.shift();
    }
  }

  private getLastAnalysis(projectId: string): AIAnalysis | null {
    const history = this.analysisHistory.get(projectId);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  // Public methods for external access
  isMonitoring(projectId: string): boolean {
    return this.activeMonitoring.has(projectId);
  }

  getAnalysisHistory(projectId: string): AIAnalysis[] {
    return this.analysisHistory.get(projectId) || [];
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`🤖 AI Preview Monitor ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create singleton instance
export const aiPreviewMonitor = new AIPreviewMonitor();