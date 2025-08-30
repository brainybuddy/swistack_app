import {
  AIMessage,
  AIResponse,
  ProjectContext,
  CodeContext,
  CodeGeneration,
  CodeExplanation,
  CodeFix,
  ProjectAnalysis,
  CodeSuggestion,
  AIConfiguration,
  ConversationContext,
  AIAction
} from '../types/ai';

export interface IAIService {
  // Core chat functionality
  chat(
    messages: AIMessage[],
    context: ProjectContext,
    config?: Partial<AIConfiguration>
  ): Promise<AIResponse>;

  // Code generation
  generateCode(
    prompt: string,
    context: CodeContext,
    config?: Partial<AIConfiguration>
  ): Promise<CodeGeneration>;

  // Code explanation and understanding
  explainCode(
    code: string,
    context: CodeContext,
    level?: 'basic' | 'intermediate' | 'advanced'
  ): Promise<CodeExplanation>;

  // Error fixing and debugging
  fixError(
    error: string,
    context: CodeContext,
    diagnostics?: any[]
  ): Promise<CodeFix>;

  // Code suggestions and completions
  getCodeSuggestions(
    context: CodeContext,
    triggerType: 'typing' | 'request' | 'error'
  ): Promise<CodeSuggestion[]>;

  // Project-level analysis
  analyzeProject(
    projectId: string,
    includeDetailedAnalysis?: boolean
  ): Promise<ProjectAnalysis>;

  // Refactoring suggestions
  suggestRefactors(
    code: string,
    context: CodeContext,
    refactorType?: 'performance' | 'readability' | 'security' | 'all'
  ): Promise<CodeSuggestion[]>;

  // Natural language to code
  naturalLanguageToCode(
    description: string,
    context: CodeContext
  ): Promise<CodeGeneration>;

  // Code review
  reviewCode(
    changes: string,
    context: CodeContext,
    reviewType?: 'security' | 'performance' | 'style' | 'logic' | 'all'
  ): Promise<{
    summary: string;
    issues: CodeSuggestion[];
    score: number;
  }>;

  // Command execution
  executeCommand(
    command: string,
    context: ProjectContext,
    requireConfirmation?: boolean
  ): Promise<{
    success: boolean;
    output: string;
    actions: AIAction[];
  }>;

  // Conversation management
  startConversation(projectId: string, initialContext?: ProjectContext): Promise<string>;
  continueConversation(conversationId: string, message: AIMessage): Promise<AIResponse>;
  getConversationHistory(conversationId: string): Promise<ConversationContext>;

  // Learning and adaptation
  learnFromFeedback(
    messageId: string,
    feedback: 'positive' | 'negative',
    details?: string
  ): Promise<void>;

  // Provider management
  switchProvider(providerId: string): Promise<boolean>;
  getAvailableProviders(): Promise<string[]>;
  getProviderStatus(): Promise<{ provider: string; status: 'online' | 'offline' | 'limited' }[]>;
}

export abstract class BaseAIService implements IAIService {
  protected config: AIConfiguration;
  
  constructor(config: AIConfiguration) {
    this.config = config;
  }

  // Abstract methods to be implemented by concrete providers
  abstract chat(
    messages: AIMessage[],
    context: ProjectContext,
    config?: Partial<AIConfiguration>
  ): Promise<AIResponse>;

  abstract generateCode(
    prompt: string,
    context: CodeContext,
    config?: Partial<AIConfiguration>
  ): Promise<CodeGeneration>;

  abstract explainCode(
    code: string,
    context: CodeContext,
    level?: 'basic' | 'intermediate' | 'advanced'
  ): Promise<CodeExplanation>;

  abstract fixError(
    error: string,
    context: CodeContext,
    diagnostics?: any[]
  ): Promise<CodeFix>;

  abstract getCodeSuggestions(
    context: CodeContext,
    triggerType: 'typing' | 'request' | 'error'
  ): Promise<CodeSuggestion[]>;

  abstract analyzeProject(
    projectId: string,
    includeDetailedAnalysis?: boolean
  ): Promise<ProjectAnalysis>;

  abstract suggestRefactors(
    code: string,
    context: CodeContext,
    refactorType?: 'performance' | 'readability' | 'security' | 'all'
  ): Promise<CodeSuggestion[]>;

  abstract naturalLanguageToCode(
    description: string,
    context: CodeContext
  ): Promise<CodeGeneration>;

  abstract reviewCode(
    changes: string,
    context: CodeContext,
    reviewType?: 'security' | 'performance' | 'style' | 'logic' | 'all'
  ): Promise<{
    summary: string;
    issues: CodeSuggestion[];
    score: number;
  }>;

  abstract executeCommand(
    command: string,
    context: ProjectContext,
    requireConfirmation?: boolean
  ): Promise<{
    success: boolean;
    output: string;
    actions: AIAction[];
  }>;

  abstract startConversation(projectId: string, initialContext?: ProjectContext): Promise<string>;
  abstract continueConversation(conversationId: string, message: AIMessage): Promise<AIResponse>;
  abstract getConversationHistory(conversationId: string): Promise<ConversationContext>;

  abstract learnFromFeedback(
    messageId: string,
    feedback: 'positive' | 'negative',
    details?: string
  ): Promise<void>;

  abstract switchProvider(providerId: string): Promise<boolean>;
  abstract getAvailableProviders(): Promise<string[]>;
  abstract getProviderStatus(): Promise<{ provider: string; status: 'online' | 'offline' | 'limited' }[]>;

  // Common utility methods
  protected formatContext(context: ProjectContext | CodeContext): string {
    if ('file' in context) {
      // CodeContext
      const codeContext = context as CodeContext;
      return `Project: ${codeContext.project.name}
Framework: ${codeContext.project.framework}
File: ${codeContext.file.filePath}
Language: ${codeContext.file.language}
Dependencies: ${codeContext.project.dependencies ? Object.keys(codeContext.project.dependencies).join(', ') : 'none'}`;
    } else {
      // ProjectContext
      const projectContext = context as ProjectContext;
      return `Project: ${projectContext.name}
Framework: ${projectContext.framework}
Language: ${projectContext.language}
Files: ${projectContext.fileStructure.length} files
Dependencies: ${Object.keys(projectContext.dependencies).join(', ')}`;
    }
  }

  protected extractCodeBlocks(content: string): { language: string; code: string }[] {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const blocks: { language: string; code: string }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }

    return blocks;
  }

  protected generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}