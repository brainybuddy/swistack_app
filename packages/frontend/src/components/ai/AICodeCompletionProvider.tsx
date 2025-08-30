'use client';

import { AIService } from '@/services/AIService';
import * as monaco from 'monaco-editor';

export class AICodeCompletionProvider implements monaco.languages.CompletionItemProvider {
  private aiService: AIService;
  private projectId: string;

  constructor(projectId: string) {
    this.aiService = AIService.getInstance();
    this.projectId = projectId;
  }

  triggerCharacters = ['.', '(', '<', '"', "'", ' ', '\n'];

  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CompletionList | null> {
    try {
      // Get current file content and context
      const content = model.getValue();
      const filePath = model.uri.path;
      
      // Get AI suggestions
      const suggestions = await this.aiService.getMonacoCompletions(
        this.projectId,
        filePath,
        content,
        { lineNumber: position.lineNumber, column: position.column }
      );

      // Convert AI suggestions to Monaco completion items
      const completionItems: monaco.languages.CompletionItem[] = suggestions.map((suggestion, index) => {
        const range = this.getCompletionRange(model, position);
        
        return {
          label: suggestion.title || `AI Suggestion ${index + 1}`,
          kind: this.getCompletionItemKind(suggestion.type),
          insertText: suggestion.code,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: suggestion.description,
          documentation: {
            value: `**AI Generated (Confidence: ${Math.round(suggestion.confidence * 100)}%)**\n\n${suggestion.description}`,
            isTrusted: true
          },
          range,
          sortText: `0${index.toString().padStart(2, '0')}`, // Prioritize AI suggestions
          filterText: suggestion.title,
          additionalTextEdits: [],
          commitCharacters: ['.', '(', '['],
        };
      });

      return {
        suggestions: completionItems,
        incomplete: false
      };
    } catch (error) {
      console.error('AI code completion error:', error);
      return null;
    }
  }

  private getCompletionRange(
    model: monaco.editor.ITextModel, 
    position: monaco.Position
  ): monaco.IRange {
    const word = model.getWordUntilPosition(position);
    return {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    };
  }

  private getCompletionItemKind(type: string): monaco.languages.CompletionItemKind {
    switch (type) {
      case 'function': return monaco.languages.CompletionItemKind.Function;
      case 'method': return monaco.languages.CompletionItemKind.Method;
      case 'variable': return monaco.languages.CompletionItemKind.Variable;
      case 'class': return monaco.languages.CompletionItemKind.Class;
      case 'interface': return monaco.languages.CompletionItemKind.Interface;
      case 'module': return monaco.languages.CompletionItemKind.Module;
      case 'property': return monaco.languages.CompletionItemKind.Property;
      case 'keyword': return monaco.languages.CompletionItemKind.Keyword;
      case 'snippet': return monaco.languages.CompletionItemKind.Snippet;
      default: return monaco.languages.CompletionItemKind.Text;
    }
  }
}

export class AIQuickFixProvider implements monaco.languages.CodeActionProvider {
  private aiService: AIService;
  private projectId: string;

  constructor(projectId: string) {
    this.aiService = AIService.getInstance();
    this.projectId = projectId;
  }

  async provideCodeActions(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    context: monaco.languages.CodeActionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CodeActionList | null> {
    try {
      if (context.markers.length === 0) {
        return null;
      }

      const content = model.getValue();
      const filePath = model.uri.path;
      const diagnostics = context.markers.map(marker => ({
        severity: marker.severity === monaco.MarkerSeverity.Error ? 'error' : 
                 marker.severity === monaco.MarkerSeverity.Warning ? 'warning' : 'info',
        message: marker.message,
        source: marker.source || 'editor',
        line: marker.startLineNumber,
        column: marker.startColumn,
        code: marker.code
      }));

      const suggestions = await this.aiService.getQuickFixes(
        this.projectId,
        filePath,
        content,
        diagnostics
      );

      const actions: monaco.languages.CodeAction[] = suggestions.map((suggestion, index) => ({
        title: `🤖 ${suggestion.title}`,
        kind: monaco.languages.CodeActionKind.QuickFix,
        diagnostics: context.markers,
        edit: {
          edits: [{
            resource: model.uri,
            textEdit: {
              range,
              text: suggestion.code
            }
          }]
        },
        isPreferred: suggestion.confidence > 0.8
      }));

      return {
        actions,
        dispose: () => {}
      };
    } catch (error) {
      console.error('AI quick fix error:', error);
      return null;
    }
  }
}

export class AIHoverProvider implements monaco.languages.HoverProvider {
  private aiService: AIService;
  private projectId: string;

  constructor(projectId: string) {
    this.aiService = AIService.getInstance();
    this.projectId = projectId;
  }

  async provideHover(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.Hover | null> {
    try {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const content = model.getValue();
      const filePath = model.uri.path;
      
      // Get the line content for context
      const lineContent = model.getLineContent(position.lineNumber);
      const wordRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      // For now, provide basic hover info
      // In a full implementation, this would call AI service for detailed explanations
      const hoverContent: monaco.languages.MarkdownString = {
        value: `**${word.word}**\n\n*AI-powered explanations coming soon...*\n\nClick for detailed explanation.`,
        isTrusted: true
      };

      return {
        range: wordRange,
        contents: [hoverContent]
      };
    } catch (error) {
      console.error('AI hover error:', error);
      return null;
    }
  }
}

// Export utility function to register all AI providers
export function registerAIProviders(projectId: string, languages: string[] = ['javascript', 'typescript']) {
  const completionProvider = new AICodeCompletionProvider(projectId);
  const quickFixProvider = new AIQuickFixProvider(projectId);
  const hoverProvider = new AIHoverProvider(projectId);

  const disposables: monaco.IDisposable[] = [];

  languages.forEach(language => {
    disposables.push(
      monaco.languages.registerCompletionItemProvider(language, completionProvider),
      monaco.languages.registerCodeActionProvider(language, quickFixProvider),
      monaco.languages.registerHoverProvider(language, hoverProvider)
    );
  });

  return {
    dispose: () => {
      disposables.forEach(d => d.dispose());
    }
  };
}