import OpenAI from 'openai';
import {
  IAIService,
  BaseAIService,
} from '@swistack/shared';
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
} from '@swistack/shared';

export class OpenAIProvider extends BaseAIService {
  private client: OpenAI;
  private conversations: Map<string, ConversationContext> = new Map();

  constructor(config: AIConfiguration, apiKey: string) {
    super(config);
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async chat(
    messages: AIMessage[],
    context: ProjectContext,
    config?: Partial<AIConfiguration>
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(context);
    const openaiMessages = this.convertMessages(messages, systemPrompt);

    try {
      const response = await this.client.chat.completions.create({
        model: config?.model || this.config.model || 'gpt-4o',
        messages: openaiMessages,
        max_tokens: config?.maxTokens || this.config.maxTokens || 4000,
        temperature: config?.temperature || this.config.temperature || 0.1,
      });

      const content = response.choices[0]?.message?.content || '';
      const codeBlocks = this.extractCodeBlocks(content);
      const suggestions = await this.generateSuggestionsFromResponse(content, context);
      const actions = this.extractActionsFromResponse(content);

      return {
        id: this.generateId(),
        content,
        model: response.model,
        tokens: response.usage?.total_tokens || 0,
        metadata: {
          confidence: this.calculateConfidence(response),
          suggestions,
          actions,
        },
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI service error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateCode(
    prompt: string,
    context: CodeContext,
    config?: Partial<AIConfiguration>
  ): Promise<CodeGeneration> {
    const systemPrompt = this.buildCodeGenerationPrompt(context);
    const userPrompt = `Generate ${context.file.language} code for: ${prompt}

Project Context:
${this.formatContext(context)}

Current File: ${context.file.filePath}
${context.selection ? `Selected Code:\n\`\`\`${context.file.language}\n${context.selection.text}\n\`\`\`` : ''}

Requirements:
- Follow project conventions and patterns
- Include proper error handling
- Add TypeScript types if applicable
- Follow security best practices
- Include helpful comments`;

    try {
      const response = await this.client.chat.completions.create({
        model: config?.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '';
      const codeBlocks = this.extractCodeBlocks(content);
      const mainCodeBlock = codeBlocks[0] || { language: context.file.language, code: '' };

      return {
        code: mainCodeBlock.code,
        language: mainCodeBlock.language,
        filePath: context.file.filePath,
        explanation: this.extractExplanation(content),
        suggestions: await this.generateSuggestionsFromResponse(content, context.project),
        dependencies: this.extractDependencies(content),
      };
    } catch (error) {
      console.error('Code generation error:', error);
      throw new Error(`Code generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async explainCode(
    code: string,
    context: CodeContext,
    level: 'basic' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<CodeExplanation> {
    const systemPrompt = `You are an expert code explainer. Provide clear, ${level}-level explanations of code.`;
    
    const userPrompt = `Explain this ${context.file.language} code:

\`\`\`${context.file.language}
${code}
\`\`\`

Context:
- File: ${context.file.filePath}
- Project: ${context.project.name} (${context.project.framework})
- Explanation level: ${level}

Provide:
1. Summary of what the code does
2. Detailed explanation of key parts
3. How it fits in the project
4. Potential improvements`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        summary: this.extractSection(content, 'Summary') || content.split('\n')[0],
        details: content,
        keyPoints: this.extractKeyPoints(content),
        relatedFiles: this.extractRelatedFiles(content, context.project),
        suggestedImprovements: await this.generateSuggestionsFromResponse(content, context.project),
      };
    } catch (error) {
      console.error('Code explanation error:', error);
      throw new Error(`Code explanation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fixError(
    error: string,
    context: CodeContext,
    diagnostics?: any[]
  ): Promise<CodeFix> {
    const systemPrompt = this.buildErrorFixingPrompt();
    
    const userPrompt = `Fix this error in ${context.file.language}:

Error: ${error}

Current code:
\`\`\`${context.file.language}
${context.file.content}
\`\`\`

${diagnostics ? `Diagnostics:\n${JSON.stringify(diagnostics, null, 2)}` : ''}

Context:
${this.formatContext(context)}

Provide a fix with explanation.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '';
      const codeBlocks = this.extractCodeBlocks(content);
      
      return {
        description: this.extractDescription(content),
        changes: this.generateChangesFromCodeBlocks(codeBlocks, context),
        explanation: content,
        confidence: this.calculateConfidence(response),
      };
    } catch (error) {
      console.error('Error fixing failed:', error);
      throw new Error(`Error fixing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCodeSuggestions(
    context: CodeContext,
    triggerType: 'typing' | 'request' | 'error'
  ): Promise<CodeSuggestion[]> {
    const systemPrompt = this.buildCodeSuggestionsPrompt();
    
    const userPrompt = `Provide code suggestions for ${context.file.language} file:

File: ${context.file.filePath}
Trigger: ${triggerType}
${context.cursor ? `Cursor position: line ${context.cursor.line}, column ${context.cursor.character}` : ''}

Current code:
\`\`\`${context.file.language}
${context.file.content}
\`\`\`

${context.selection ? `Selected text:\n${context.selection.text}` : ''}

Context:
${this.formatContext(context)}

Provide 3-5 relevant suggestions focusing on:
- Code completion
- Best practices
- Performance improvements
- Security enhancements`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseSuggestionsFromContent(content, context);
    } catch (error) {
      console.error('Code suggestions error:', error);
      return [];
    }
  }

  // Implement remaining abstract methods with similar patterns...
  async analyzeProject(projectId: string, includeDetailedAnalysis = false): Promise<ProjectAnalysis> {
    throw new Error('analyzeProject not yet implemented');
  }

  async suggestRefactors(
    code: string,
    context: CodeContext,
    refactorType: 'performance' | 'readability' | 'security' | 'all' = 'all'
  ): Promise<CodeSuggestion[]> {
    const systemPrompt = this.buildRefactoringPrompt(refactorType);
    
    const userPrompt = `Suggest ${refactorType} refactors for this ${context.file.language} code:

\`\`\`${context.file.language}
${code}
\`\`\`

Context:
${this.formatContext(context)}

Focus on ${refactorType === 'all' ? 'all aspects' : refactorType} improvements.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseSuggestionsFromContent(content, context);
    } catch (error) {
      console.error('Refactor suggestions error:', error);
      return [];
    }
  }

  async naturalLanguageToCode(description: string, context: CodeContext): Promise<CodeGeneration> {
    return this.generateCode(description, context);
  }

  async reviewCode(
    changes: string,
    context: CodeContext,
    reviewType: 'security' | 'performance' | 'style' | 'logic' | 'all' = 'all'
  ): Promise<{ summary: string; issues: CodeSuggestion[]; score: number }> {
    const systemPrompt = this.buildCodeReviewPrompt(reviewType);
    
    const userPrompt = `Review these ${context.file.language} code changes:

\`\`\`${context.file.language}
${changes}
\`\`\`

Context:
${this.formatContext(context)}

Focus on: ${reviewType}

Provide:
1. Summary of review
2. Issues found with severity
3. Overall quality score (0-100)`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '';
      
      return {
        summary: this.extractSection(content, 'Summary') || content.split('\n')[0],
        issues: this.parseSuggestionsFromContent(content, context),
        score: this.extractScore(content),
      };
    } catch (error) {
      console.error('Code review error:', error);
      return { summary: 'Review failed', issues: [], score: 0 };
    }
  }

  async executeCommand(
    command: string,
    context: ProjectContext,
    requireConfirmation = true
  ): Promise<{ success: boolean; output: string; actions: AIAction[] }> {
    throw new Error('executeCommand not yet implemented');
  }

  async startConversation(projectId: string, initialContext?: ProjectContext): Promise<string> {
    const conversationId = this.generateId();
    const context: ConversationContext = {
      projectId,
      conversationId,
      messages: [],
      context: initialContext!,
      userPreferences: {
        preferredModel: 'gpt-4o',
        codeStyle: 'detailed',
        autoSuggestions: true,
        autoFix: false,
        securityChecks: true,
        performanceOptimizations: true,
        explanationLevel: 'intermediate',
      },
    };
    
    this.conversations.set(conversationId, context);
    return conversationId;
  }

  async continueConversation(conversationId: string, message: AIMessage): Promise<AIResponse> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.messages.push(message);
    const response = await this.chat(conversation.messages, conversation.context);
    
    const assistantMessage: AIMessage = {
      id: response.id,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      metadata: response.metadata,
    };
    conversation.messages.push(assistantMessage);
    
    return response;
  }

  async getConversationHistory(conversationId: string): Promise<ConversationContext> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    return conversation;
  }

  async learnFromFeedback(
    messageId: string,
    feedback: 'positive' | 'negative',
    details?: string
  ): Promise<void> {
    console.log(`Feedback received for message ${messageId}: ${feedback}`, details);
  }

  async switchProvider(providerId: string): Promise<boolean> {
    return false;
  }

  async getAvailableProviders(): Promise<string[]> {
    return ['openai'];
  }

  async getProviderStatus(): Promise<{ provider: string; status: 'online' | 'offline' | 'limited' }[]> {
    return [{ provider: 'openai', status: 'online' }];
  }

  // Private helper methods (similar to Claude provider)
  private buildSystemPrompt(context: ProjectContext): string {
    return `You are an expert AI coding assistant for SwiStack, a browser-based IDE. You have deep knowledge of software development, best practices, and the specific project context.

Project Context:
${this.formatContext(context)}

Your capabilities:
- Generate high-quality, production-ready code
- Explain code clearly and comprehensively  
- Debug and fix errors efficiently
- Suggest improvements and optimizations
- Follow project conventions and patterns
- Provide security and performance guidance

Always:
- Write clean, maintainable, well-documented code
- Follow the project's existing patterns and conventions
- Consider security implications
- Provide helpful explanations
- Suggest best practices
- Be concise but thorough`;
  }

  private buildCodeGenerationPrompt(context: CodeContext): string {
    return `You are a code generation expert. Generate clean, efficient, well-documented ${context.file.language} code that follows best practices and integrates well with the existing project structure.`;
  }

  private buildErrorFixingPrompt(): string {
    return `You are an expert debugger. Analyze errors carefully and provide precise fixes with clear explanations.`;
  }

  private buildCodeSuggestionsPrompt(): string {
    return `You are a code completion expert. Provide relevant, contextual suggestions that help developers write better code faster.`;
  }

  private buildRefactoringPrompt(type: string): string {
    return `You are a refactoring expert specializing in ${type} improvements. Suggest meaningful refactors that enhance code quality while maintaining functionality.`;
  }

  private buildCodeReviewPrompt(type: string): string {
    return `You are a senior code reviewer focusing on ${type} aspects. Provide constructive feedback that helps improve code quality.`;
  }

  private convertMessages(messages: AIMessage[], systemPrompt: string): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const result: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [{ role: 'system' as const, content: systemPrompt }];
    
    const userMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    
    return [...result, ...userMessages];
  }

  private calculateConfidence(response: any): number {
    const content = response.choices[0]?.message?.content || '';
    const hasCodeBlocks = content.includes('```');
    const hasExplanation = content.length > 100;
    const hasStructure = content.includes('\n');
    
    let confidence = 0.5;
    if (hasCodeBlocks) confidence += 0.2;
    if (hasExplanation) confidence += 0.2;
    if (hasStructure) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private async generateSuggestionsFromResponse(content: string, context: ProjectContext): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];
    const codeBlocks = this.extractCodeBlocks(content);
    
    codeBlocks.forEach((block, index) => {
      suggestions.push({
        id: this.generateId(),
        type: 'completion',
        title: `Code Suggestion ${index + 1}`,
        description: `Generated ${block.language} code`,
        code: block.code,
        filePath: '',
        confidence: 0.8,
      });
    });
    
    return suggestions;
  }

  private extractActionsFromResponse(content: string): AIAction[] {
    const actions: AIAction[] = [];
    
    if (content.toLowerCase().includes('create file')) {
      actions.push({
        type: 'create_file',
        description: 'Create new file',
        params: {},
        requiresConfirmation: true,
      });
    }
    
    if (content.toLowerCase().includes('install') && content.toLowerCase().includes('npm')) {
      actions.push({
        type: 'install_package',
        description: 'Install npm package',
        params: {},
        requiresConfirmation: true,
      });
    }
    
    return actions;
  }

  private extractExplanation(content: string): string {
    const lines = content.split('\n');
    const explanationLines = lines.filter(line => 
      !line.trim().startsWith('```') && line.trim().length > 0
    );
    return explanationLines.join('\n').trim();
  }

  private extractDependencies(content: string): string[] {
    const deps: string[] = [];
    const importRegex = /import.*from ['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (!match[1].startsWith('.')) {
        deps.push(match[1]);
      }
    }
    
    while ((match = requireRegex.exec(content)) !== null) {
      if (!match[1].startsWith('.')) {
        deps.push(match[1]);
      }
    }
    
    return [...new Set(deps)];
  }

  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}:?\\s*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim().match(/^[-•*]\s+/) || line.trim().match(/^\d+\.\s+/)) {
        points.push(line.trim().replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, ''));
      }
    }
    
    return points;
  }

  private extractRelatedFiles(content: string, context: ProjectContext): string[] {
    const files: string[] = [];
    const fileRegex = /[\w-]+\.\w{2,4}/g;
    const matches = content.match(fileRegex) || [];
    
    return matches.filter(file => 
      context.fileStructure.some(f => f.name.includes(file))
    );
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines.find(line => line.trim().length > 0);
    return firstLine?.trim() || 'Code fix';
  }

  private generateChangesFromCodeBlocks(
    codeBlocks: { language: string; code: string }[], 
    context: CodeContext
  ): any[] {
    return codeBlocks.map(block => ({
      id: this.generateId(),
      filePath: context.file.filePath,
      type: 'modify',
      newContent: block.code,
      timestamp: new Date(),
      author: 'ai',
    }));
  }

  private parseSuggestionsFromContent(content: string, context: CodeContext): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];
    const codeBlocks = this.extractCodeBlocks(content);
    
    codeBlocks.forEach((block, index) => {
      suggestions.push({
        id: this.generateId(),
        type: 'completion',
        title: `Suggestion ${index + 1}`,
        description: `${block.language} code improvement`,
        code: block.code,
        filePath: context.file.filePath,
        confidence: 0.8,
      });
    });
    
    return suggestions;
  }

  private extractScore(content: string): number {
    const scoreMatch = content.match(/score:?\s*(\d+)/i) || content.match(/(\d+)\s*\/\s*100/);
    return scoreMatch ? parseInt(scoreMatch[1], 10) : 75;
  }
}