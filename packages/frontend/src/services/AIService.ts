import { httpClient } from '@/utils/httpClient';
import {
  AIMessage,
  AIResponse,
  CodeGeneration,
  CodeExplanation,
  CodeFix,
  CodeSuggestion,
  ProjectAnalysis
} from '@swistack/shared/types/ai';

export interface ChatOptions {
  includeProjectContext?: boolean;
  includeFileContext?: boolean;
  currentFile?: string;
  selectedCode?: string;
  model?: string;
}

export interface CodeGenerationOptions {
  fileContent?: string;
  selectedCode?: string;
  selectionRange?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  model?: string;
}

export class AIService {
  private static instance: AIService;
  private baseURL = '/api/ai';

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Enhanced chat with project context
   */
  async chat(
    projectId: string,
    message: string,
    conversationId?: string,
    options?: ChatOptions
  ): Promise<AIResponse> {
    try {
      // Use direct fetch for demo (bypasses auth)
      const response = await fetch(`http://localhost:3001${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          message,
          conversationId,
          options
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'AI chat failed');
      }

      return data.data;
    } catch (error) {
      console.error('AI Chat error:', error);
      throw error;
    }
  }

  /**
   * Generate code with project context
   */
  async generateCode(
    projectId: string,
    prompt: string,
    filePath: string,
    options?: CodeGenerationOptions
  ): Promise<CodeGeneration> {
    try {
      const response = await httpClient.post(`${this.baseURL}/generate-code`, {
        projectId,
        prompt,
        filePath,
        options
      });

      if (!response.success) {
        throw new Error(response.error || 'Code generation failed');
      }

      return response.data;
    } catch (error) {
      console.error('Code generation error:', error);
      throw error;
    }
  }

  /**
   * Explain code with project context
   */
  async explainCode(
    projectId: string,
    code: string,
    filePath: string,
    level: 'basic' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<CodeExplanation> {
    try {
      const response = await httpClient.post(`${this.baseURL}/explain-code`, {
        projectId,
        code,
        filePath,
        level
      });

      if (!response.success) {
        throw new Error(response.error || 'Code explanation failed');
      }

      return response.data;
    } catch (error) {
      console.error('Code explanation error:', error);
      throw error;
    }
  }

  /**
   * Fix code errors with context
   */
  async fixError(
    projectId: string,
    error: string,
    filePath: string,
    fileContent: string,
    diagnostics?: any[]
  ): Promise<CodeFix> {
    try {
      const response = await httpClient.post(`${this.baseURL}/fix-error`, {
        projectId,
        error,
        filePath,
        fileContent,
        diagnostics
      });

      if (!response.success) {
        throw new Error(response.error || 'Error fixing failed');
      }

      return response.data;
    } catch (error) {
      console.error('Error fixing error:', error);
      throw error;
    }
  }

  /**
   * Get intelligent code suggestions
   */
  async getCodeSuggestions(
    projectId: string,
    filePath: string,
    fileContent: string,
    cursorPosition?: { line: number; character: number },
    triggerType: 'typing' | 'request' | 'error' = 'request'
  ): Promise<CodeSuggestion[]> {
    try {
      const response = await httpClient.post(`${this.baseURL}/suggestions`, {
        projectId,
        filePath,
        fileContent,
        cursorPosition,
        triggerType
      });

      if (!response.success) {
        throw new Error(response.error || 'Getting suggestions failed');
      }

      return response.data;
    } catch (error) {
      console.error('Code suggestions error:', error);
      return [];
    }
  }

  /**
   * Comprehensive project analysis
   */
  async analyzeProject(
    projectId: string,
    includeDetailedAnalysis = false
  ): Promise<ProjectAnalysis> {
    try {
      const response = await httpClient.post(`${this.baseURL}/analyze-project`, {
        projectId,
        includeDetailedAnalysis
      });

      if (!response.success) {
        throw new Error(response.error || 'Project analysis failed');
      }

      return response.data;
    } catch (error) {
      console.error('Project analysis error:', error);
      throw error;
    }
  }

  /**
   * Review code changes
   */
  async reviewCode(
    projectId: string,
    changes: string,
    filePath: string,
    reviewType: 'security' | 'performance' | 'style' | 'logic' | 'all' = 'all'
  ): Promise<{ summary: string; issues: CodeSuggestion[]; score: number }> {
    try {
      const response = await httpClient.post(`${this.baseURL}/review-code`, {
        projectId,
        changes,
        filePath,
        reviewType
      });

      if (!response.success) {
        throw new Error(response.error || 'Code review failed');
      }

      return response.data;
    } catch (error) {
      console.error('Code review error:', error);
      return { summary: 'Review failed', issues: [], score: 0 };
    }
  }

  /**
   * Start a new conversation
   */
  async startConversation(projectId: string): Promise<string> {
    try {
      // Use direct fetch for demo (bypasses auth)
      const response = await fetch(`http://localhost:3001${this.baseURL}/conversation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start conversation');
      }

      return data.data.conversationId;
    } catch (error) {
      console.error('Start conversation error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string): Promise<any> {
    try {
      const response = await httpClient.get(`${this.baseURL}/conversation/${conversationId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get conversation');
      }

      return response.data;
    } catch (error) {
      console.error('Get conversation error:', error);
      throw error;
    }
  }

  /**
   * Get AI provider information
   */
  async getProviderInfo(): Promise<any> {
    try {
      // Use direct fetch for demo (bypasses auth)
      const response = await fetch(`http://localhost:3001${this.baseURL}/providers`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get provider info');
      }

      return data.data;
    } catch (error) {
      console.error('Get providers error:', error);
      throw error;
    }
  }

  /**
   * Switch AI provider
   */
  async switchProvider(providerId: string): Promise<boolean> {
    try {
      const response = await httpClient.post(`${this.baseURL}/providers/switch`, {
        providerId
      });

      return response.success;
    } catch (error) {
      console.error('Switch provider error:', error);
      return false;
    }
  }

  /**
   * Update project context when files change
   */
  async updateProjectContext(
    projectId: string,
    changes: Array<{
      type: 'create' | 'modify' | 'delete' | 'rename';
      filePath: string;
      oldContent?: string;
      newContent?: string;
    }>
  ): Promise<void> {
    try {
      await httpClient.post(`${this.baseURL}/context/update`, {
        projectId,
        changes
      });
    } catch (error) {
      console.error('Update context error:', error);
      // Don't throw - context updates are not critical for user experience
    }
  }

  /**
   * Get related files for better context
   */
  async getRelatedFiles(
    projectId: string,
    filePath: string,
    maxDepth = 2
  ): Promise<string[]> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}/files/related/${projectId}/${encodeURIComponent(filePath)}?maxDepth=${maxDepth}`
      );

      if (!response.success) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error('Get related files error:', error);
      return [];
    }
  }

  /**
   * Provide feedback on AI responses for learning
   */
  async provideFeedback(
    messageId: string,
    feedback: 'positive' | 'negative',
    details?: string
  ): Promise<void> {
    try {
      await httpClient.post(`${this.baseURL}/feedback`, {
        messageId,
        feedback,
        details
      });
    } catch (error) {
      console.error('Feedback error:', error);
      // Don't throw - feedback is not critical
    }
  }

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await httpClient.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error('AI Health check error:', error);
      return { status: 'unhealthy' };
    }
  }

  /**
   * Get intelligent completions for Monaco Editor
   */
  async getMonacoCompletions(
    projectId: string,
    filePath: string,
    content: string,
    position: { lineNumber: number; column: number }
  ): Promise<CodeSuggestion[]> {
    try {
      const suggestions = await this.getCodeSuggestions(
        projectId,
        filePath,
        content,
        { line: position.lineNumber - 1, character: position.column - 1 },
        'typing'
      );

      // Filter and format suggestions for Monaco
      return suggestions.filter(s => 
        s.type === 'completion' && 
        s.code && 
        s.confidence > 0.5
      );
    } catch (error) {
      console.error('Monaco completions error:', error);
      return [];
    }
  }

  /**
   * Quick fix for editor diagnostics
   */
  async getQuickFixes(
    projectId: string,
    filePath: string,
    content: string,
    diagnostics: any[]
  ): Promise<CodeSuggestion[]> {
    try {
      if (diagnostics.length === 0) return [];

      const errorMessage = diagnostics[0]?.message || 'Unknown error';
      const fix = await this.fixError(projectId, errorMessage, filePath, content, diagnostics);
      
      return fix.changes.map(change => ({
        id: change.id,
        type: 'fix' as const,
        title: 'AI Fix',
        description: fix.description,
        code: change.newContent || '',
        filePath: change.filePath,
        confidence: fix.confidence,
      }));
    } catch (error) {
      console.error('Quick fixes error:', error);
      return [];
    }
  }

  /**
   * Context-aware code actions
   */
  async getCodeActions(
    projectId: string,
    filePath: string,
    content: string,
    selection?: { start: any; end: any; text: string }
  ): Promise<CodeSuggestion[]> {
    try {
      const suggestions = await this.getCodeSuggestions(
        projectId,
        filePath,
        content,
        selection?.start,
        'request'
      );

      // Filter for actionable suggestions
      return suggestions.filter(s => 
        ['refactor', 'optimization', 'fix'].includes(s.type) && 
        s.confidence > 0.6
      );
    } catch (error) {
      console.error('Code actions error:', error);
      return [];
    }
  }
}