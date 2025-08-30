import { AIProviderManager } from './AIProviderManager';
import { AIContextManager } from './AIContextManager';
import {
  AIMessage,
  AIResponse,
  CodeGeneration,
  CodeExplanation,
  CodeFix,
  CodeSuggestion,
  ProjectAnalysis,
  AIConfiguration,
  ConversationContext
} from '@swistack/shared';

export class AIAgentService {
  private providerManager: AIProviderManager;
  private contextManager: AIContextManager;
  private conversations: Map<string, ConversationContext> = new Map();

  constructor() {
    this.providerManager = new AIProviderManager();
    this.contextManager = new AIContextManager();
  }

  /**
   * Enhanced chat with full project context and code awareness
   */
  async chat(
    projectId: string,
    message: string,
    conversationId?: string,
    options?: {
      includeProjectContext?: boolean;
      includeFileContext?: boolean;
      currentFile?: string;
      selectedCode?: string;
      model?: string;
    }
  ): Promise<AIResponse> {
    try {
      console.log(`[AI Chat] ${projectId}: ${message.substring(0, 100)}...`);

      // Get or create conversation
      let conversation = conversationId ? this.conversations.get(conversationId) : null;
      if (!conversation) {
        conversationId = await this.startConversation(projectId);
        conversation = this.conversations.get(conversationId!)!;
      }

      // Build enhanced context
      let projectContext = conversation.context;
      if (options?.includeProjectContext !== false) {
        projectContext = await this.contextManager.buildProjectContext(projectId);
        conversation.context = projectContext;
      }

      // Add file-specific context if requested
      let enhancedMessage = message;
      if (options?.currentFile) {
        const fileContext = await this.contextManager.buildFileContext(
          projectId,
          options.currentFile
        );
        
        enhancedMessage = `${message}

Current file context:
- File: ${fileContext.filePath}
- Language: ${fileContext.language}
- Imports: ${fileContext.imports.join(', ')}
- Exports: ${fileContext.exports.join(', ')}
${options.selectedCode ? `\nSelected code:\n\`\`\`${fileContext.language}\n${options.selectedCode}\n\`\`\`` : ''}`;
      }

      // Create AI message
      const aiMessage: AIMessage = {
        id: this.generateId(),
        role: 'user',
        content: enhancedMessage,
        timestamp: new Date(),
        metadata: {
          context: options?.currentFile ? [options.currentFile] : [],
        }
      };

      conversation.messages.push(aiMessage);

      // Get AI provider with fallback
      const provider = await this.providerManager.getProviderWithFallback();
      
      // Configure model if specified
      const config: Partial<AIConfiguration> = {};
      if (options?.model) {
        config.model = options.model;
      }

      // Get AI response
      const response = await provider.chat(
        conversation.messages,
        projectContext,
        config
      );

      // Store assistant response
      const assistantMessage: AIMessage = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata,
      };
      conversation.messages.push(assistantMessage);

      // Record usage
      await this.providerManager.recordUsage(
        this.providerManager.getCurrentProvider(),
        response.tokens,
        'chat'
      );

      console.log(`✅ AI Chat completed: ${response.tokens} tokens`);
      return response;
    } catch (error) {
      console.error('[AI Chat Error]:', error);
      throw error;
    }
  }

  /**
   * Generate code with full project context
   */
  async generateCode(
    projectId: string,
    prompt: string,
    filePath: string,
    options?: {
      fileContent?: string;
      selectedCode?: string;
      selectionRange?: {
        start: { line: number; character: number };
        end: { line: number; character: number };
      };
      model?: string;
    }
  ): Promise<CodeGeneration> {
    try {
      console.log(`[Code Generation] ${projectId}:${filePath} - ${prompt.substring(0, 50)}...`);

      // Build comprehensive code context
      const codeContext = await this.contextManager.buildCodeContext(
        projectId,
        filePath,
        {
          fileContent: options?.fileContent,
          selection: options?.selectedCode ? {
            start: options.selectionRange?.start || { line: 0, character: 0 },
            end: options.selectionRange?.end || { line: 0, character: 0 },
            text: options.selectedCode,
          } : undefined,
        }
      );

      // Get AI provider
      const provider = await this.providerManager.getProviderWithFallback();
      
      // Configure for code generation
      const config: Partial<AIConfiguration> = {
        model: options?.model || this.providerManager.getBestModelForTask('code_generation'),
        temperature: 0.1, // Lower temperature for more deterministic code
        codeOptimizations: true,
        securityAnalysis: true,
      };

      // Generate code
      const generation = await provider.generateCode(prompt, codeContext, config);

      // Record usage
      await this.providerManager.recordUsage(
        this.providerManager.getCurrentProvider(),
        generation.dependencies?.length || 0,
        'code_generation'
      );

      console.log(`✅ Code generated: ${generation.code.length} characters`);
      return generation;
    } catch (error) {
      console.error('[Code Generation Error]:', error);
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
      console.log(`[Code Explanation] ${projectId}:${filePath} - level: ${level}`);

      const codeContext = await this.contextManager.buildCodeContext(
        projectId,
        filePath,
        { fileContent: code }
      );

      const provider = await this.providerManager.getProviderWithFallback();
      const explanation = await provider.explainCode(code, codeContext, level);

      console.log(`✅ Code explained: ${explanation.details.length} characters`);
      return explanation;
    } catch (error) {
      console.error('[Code Explanation Error]:', error);
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
      console.log(`[Error Fix] ${projectId}:${filePath} - ${error.substring(0, 50)}...`);

      const codeContext = await this.contextManager.buildCodeContext(
        projectId,
        filePath,
        {
          fileContent,
          diagnostics: diagnostics?.map(d => ({
            severity: d.severity || 'error',
            message: d.message || '',
            source: d.source || 'unknown',
            line: d.line || 0,
            column: d.column || 0,
            code: d.code,
          })),
        }
      );

      const provider = await this.providerManager.getProviderWithFallback();
      
      const config: Partial<AIConfiguration> = {
        model: this.providerManager.getBestModelForTask('debugging'),
      };

      const fix = await provider.fixError(error, codeContext, diagnostics);

      console.log(`✅ Error fix generated with confidence: ${fix.confidence}`);
      return fix;
    } catch (error) {
      console.error('[Error Fix Error]:', error);
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
      const codeContext = await this.contextManager.buildCodeContext(
        projectId,
        filePath,
        {
          fileContent,
          cursor: cursorPosition,
        }
      );

      const provider = await this.providerManager.getProviderWithFallback();
      
      const suggestions = await provider.getCodeSuggestions(
        codeContext,
        triggerType
      );

      console.log(`✅ Generated ${suggestions.length} code suggestions`);
      return suggestions;
    } catch (error) {
      console.error('[Code Suggestions Error]:', error);
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
      console.log(`[Project Analysis] ${projectId} - detailed: ${includeDetailedAnalysis}`);

      // Get project context and quality analysis
      const [projectContext, qualityAnalysis] = await Promise.all([
        this.contextManager.buildProjectContext(projectId),
        this.contextManager.analyzeCodeQuality(projectId),
      ]);

      // Build comprehensive analysis
      const analysis: ProjectAnalysis = {
        summary: `Analysis of ${projectContext.name} (${projectContext.framework})`,
        architecture: {
          patterns: qualityAnalysis.patterns,
          technologies: [
            projectContext.framework,
            projectContext.language,
            ...Object.keys(projectContext.dependencies).slice(0, 10),
          ],
          structure: this.describeProjectStructure(projectContext),
        },
        codeQuality: {
          score: qualityAnalysis.score,
          issues: qualityAnalysis.issues,
          suggestions: qualityAnalysis.suggestions.map(s => ({
            id: this.generateId(),
            type: 'optimization',
            title: s,
            description: s,
            code: '',
            filePath: '',
            confidence: 0.7,
          })),
        },
        security: {
          vulnerabilities: [],
          recommendations: [],
        },
        performance: {
          bottlenecks: [],
          optimizations: [],
        },
      };

      // Enhanced analysis with AI provider
      if (includeDetailedAnalysis) {
        const provider = await this.providerManager.getProviderWithFallback();
        // This would use the provider to generate more detailed analysis
        // For now, we'll enhance with basic analysis
      }

      console.log(`✅ Project analysis completed - score: ${analysis.codeQuality.score}`);
      return analysis;
    } catch (error) {
      console.error('[Project Analysis Error]:', error);
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
      console.log(`[Code Review] ${projectId}:${filePath} - type: ${reviewType}`);

      const codeContext = await this.contextManager.buildCodeContext(
        projectId,
        filePath
      );

      const provider = await this.providerManager.getProviderWithFallback();
      const review = await provider.reviewCode(changes, codeContext, reviewType);

      console.log(`✅ Code review completed - score: ${review.score}`);
      return review;
    } catch (error) {
      console.error('[Code Review Error]:', error);
      return { summary: 'Review failed', issues: [], score: 0 };
    }
  }

  /**
   * Start new conversation
   */
  async startConversation(projectId: string): Promise<string> {
    const conversationId = this.generateId();
    const projectContext = await this.contextManager.buildProjectContext(projectId);
    
    const conversation: ConversationContext = {
      projectId,
      conversationId,
      messages: [{
        id: this.generateId(),
        role: 'system',
        content: `You are now working on project "${projectContext.name}" using ${projectContext.framework}. The project has ${projectContext.fileStructure.length} files and uses dependencies like ${Object.keys(projectContext.dependencies).slice(0, 3).join(', ')}.`,
        timestamp: new Date(),
      }],
      context: projectContext,
      userPreferences: {
        preferredModel: this.providerManager.getCurrentProvider() === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o',
        codeStyle: 'detailed',
        autoSuggestions: true,
        autoFix: false,
        securityChecks: true,
        performanceOptimizations: true,
        explanationLevel: 'intermediate',
      },
    };

    this.conversations.set(conversationId, conversation);
    
    // Clean up old conversations (keep last 100)
    if (this.conversations.size > 100) {
      const oldest = Array.from(this.conversations.keys())[0];
      this.conversations.delete(oldest);
    }

    console.log(`✅ Started conversation ${conversationId} for project ${projectId}`);
    return conversationId;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): ConversationContext | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get AI provider status and capabilities
   */
  async getProviderInfo(): Promise<{
    currentProvider: string;
    availableProviders: string[];
    capabilities: any[];
    status: { provider: string; status: string }[];
  }> {
    const [availableProviders, status] = await Promise.all([
      this.providerManager.getAvailableProviders(),
      this.providerManager.getProviderStatus(),
    ]);

    return {
      currentProvider: this.providerManager.getCurrentProvider(),
      availableProviders: availableProviders.map(p => p.name),
      capabilities: availableProviders.flatMap(p => p.capabilities),
      status,
    };
  }

  /**
   * Switch AI provider
   */
  async switchProvider(providerId: string): Promise<boolean> {
    const result = await this.providerManager.switchProvider(providerId);
    if (result) {
      console.log(`✅ Switched to AI provider: ${providerId}`);
    }
    return result;
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
    const codeChanges = changes.map(change => ({
      id: this.generateId(),
      filePath: change.filePath,
      type: change.type,
      oldContent: change.oldContent,
      newContent: change.newContent,
      timestamp: new Date(),
      author: 'user',
    }));

    await this.contextManager.updateContext(projectId, codeChanges);
    console.log(`✅ Updated context for ${projectId} with ${changes.length} changes`);
  }

  /**
   * Get related files for better context
   */
  async getRelatedFiles(
    projectId: string,
    filePath: string,
    maxDepth = 2
  ): Promise<string[]> {
    return this.contextManager.getRelatedFiles(projectId, filePath, maxDepth);
  }

  // Private helper methods
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private describeProjectStructure(context: any): string {
    const fileCount = context.fileStructure.length;
    const hasComponents = context.fileStructure.some((f: any) => 
      f.name === 'components' || f.path.includes('components')
    );
    const hasUtils = context.fileStructure.some((f: any) => 
      f.name === 'utils' || f.path.includes('utils')
    );
    const hasTests = context.fileStructure.some((f: any) => 
      f.name.includes('test') || f.path.includes('test')
    );

    let structure = `${fileCount} files organized in`;
    if (hasComponents) structure += ' components,';
    if (hasUtils) structure += ' utilities,';
    if (hasTests) structure += ' tests,';
    
    return structure + ' standard project structure';
  }
}