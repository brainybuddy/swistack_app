'use client';

import { useState, useCallback } from 'react';
import { AIService } from '@/services/AIService';
import {
  Wand2,
  Zap,
  Bug,
  RefreshCw,
  Lightbulb,
  Shield,
  BarChart3,
  Code2,
  FileText,
  Sparkles
} from 'lucide-react';

interface AICodeActionsProps {
  projectId: string;
  filePath: string;
  fileContent: string;
  selectedCode?: string;
  onApplyCode: (code: string, description?: string) => void;
  onShowExplanation: (explanation: string) => void;
  className?: string;
}

interface ActionButton {
  id: string;
  icon: any;
  label: string;
  description: string;
  color: string;
  action: () => Promise<void>;
}

export default function AICodeActions({
  projectId,
  filePath,
  fileContent,
  selectedCode,
  onApplyCode,
  onShowExplanation,
  className = ''
}: AICodeActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const aiService = AIService.getInstance();

  const handleGenerateCode = useCallback(async (prompt: string) => {
    setLoading('generate');
    try {
      const generation = await aiService.generateCode(
        projectId,
        prompt,
        filePath,
        { fileContent, selectedCode }
      );
      
      onApplyCode(generation.code, generation.explanation);
    } catch (error) {
      console.error('Code generation failed:', error);
    } finally {
      setLoading(null);
    }
  }, [projectId, filePath, fileContent, selectedCode, onApplyCode]);

  const handleExplainCode = useCallback(async () => {
    if (!selectedCode) return;
    
    setLoading('explain');
    try {
      const explanation = await aiService.explainCode(
        projectId,
        selectedCode,
        filePath,
        'intermediate'
      );
      
      onShowExplanation(`## Code Explanation\n\n${explanation.summary}\n\n${explanation.details}`);
    } catch (error) {
      console.error('Code explanation failed:', error);
    } finally {
      setLoading(null);
    }
  }, [projectId, selectedCode, filePath, onShowExplanation]);

  const handleOptimizeCode = useCallback(async () => {
    setLoading('optimize');
    try {
      const suggestions = await aiService.suggestRefactors(
        projectId,
        selectedCode || fileContent,
        filePath,
        'performance'
      );
      
      if (suggestions.length > 0) {
        const bestSuggestion = suggestions[0];
        onApplyCode(bestSuggestion.code, `**Optimization Applied**: ${bestSuggestion.description}`);
      }
    } catch (error) {
      console.error('Code optimization failed:', error);
    } finally {
      setLoading(null);
    }
  }, [projectId, selectedCode, fileContent, filePath, onApplyCode]);

  const handleFixIssues = useCallback(async () => {
    setLoading('fix');
    try {
      // For now, we'll simulate error detection
      // In a real implementation, this would integrate with Monaco diagnostics
      const mockError = 'Potential syntax or logic issues detected';
      
      const fix = await aiService.fixError(
        projectId,
        mockError,
        filePath,
        fileContent
      );
      
      if (fix.changes.length > 0) {
        const primaryChange = fix.changes[0];
        onApplyCode(primaryChange.newContent || '', fix.explanation);
      }
    } catch (error) {
      console.error('Code fixing failed:', error);
    } finally {
      setLoading(null);
    }
  }, [projectId, filePath, fileContent, onApplyCode]);

  const handleSecurityReview = useCallback(async () => {
    setLoading('security');
    try {
      const review = await aiService.reviewCode(
        projectId,
        selectedCode || fileContent,
        filePath,
        'security'
      );
      
      const securityReport = `## Security Review\n\n**Score**: ${review.score}/100\n\n**Summary**: ${review.summary}\n\n**Issues Found**: ${review.issues.length}\n\n${review.issues.map(issue => `- **${issue.title}**: ${issue.description}`).join('\n')}`;
      
      onShowExplanation(securityReport);
    } catch (error) {
      console.error('Security review failed:', error);
    } finally {
      setLoading(null);
    }
  }, [projectId, selectedCode, fileContent, filePath, onShowExplanation]);

  const handleRefactorCode = useCallback(async () => {
    setLoading('refactor');
    try {
      const suggestions = await aiService.suggestRefactors(
        projectId,
        selectedCode || fileContent,
        filePath,
        'readability'
      );
      
      if (suggestions.length > 0) {
        const bestRefactor = suggestions[0];
        onApplyCode(bestRefactor.code, `**Refactoring Applied**: ${bestRefactor.description}`);
      }
    } catch (error) {
      console.error('Code refactoring failed:', error);
    } finally {
      setLoading(null);
    }
  }, [projectId, selectedCode, fileContent, filePath, onApplyCode]);

  const handleAddComments = useCallback(async () => {
    setLoading('document');
    try {
      const prompt = `Add comprehensive comments and documentation to this code:\n\n${selectedCode || fileContent}`;
      
      const generation = await aiService.generateCode(
        projectId,
        prompt,
        filePath,
        { fileContent, selectedCode }
      );
      
      onApplyCode(generation.code, 'Added comprehensive documentation');
    } catch (error) {
      console.error('Documentation generation failed:', error);
    } finally {
      setLoading(null);
    }
  }, [projectId, filePath, fileContent, selectedCode, onApplyCode]);

  const handleGenerateTests = useCallback(async () => {
    setLoading('test');
    try {
      const prompt = `Generate comprehensive unit tests for this code:\n\n${selectedCode || fileContent}`;
      
      const generation = await aiService.generateCode(
        projectId,
        prompt,
        filePath.replace(/\.(js|ts)$/, '.test$1'), // Change to test file
        { fileContent, selectedCode }
      );
      
      onApplyCode(generation.code, 'Generated unit tests');
    } catch (error) {
      console.error('Test generation failed:', error);
    } finally {
      setLoading(null);
    }
  }, [projectId, filePath, fileContent, selectedCode, onApplyCode]);

  const quickActions: ActionButton[] = [
    {
      id: 'explain',
      icon: Lightbulb,
      label: selectedCode ? 'Explain Selection' : 'Explain Code',
      description: 'Get AI explanation of the code',
      color: 'text-yellow-400 hover:text-yellow-300',
      action: handleExplainCode
    },
    {
      id: 'optimize',
      icon: Zap,
      label: 'Optimize',
      description: 'Improve code performance',
      color: 'text-green-400 hover:text-green-300',
      action: handleOptimizeCode
    },
    {
      id: 'fix',
      icon: Bug,
      label: 'Fix Issues',
      description: 'Detect and fix problems',
      color: 'text-red-400 hover:text-red-300',
      action: handleFixIssues
    },
    {
      id: 'refactor',
      icon: RefreshCw,
      label: 'Refactor',
      description: 'Improve code structure',
      color: 'text-blue-400 hover:text-blue-300',
      action: handleRefactorCode
    },
    {
      id: 'document',
      icon: FileText,
      label: 'Add Comments',
      description: 'Generate documentation',
      color: 'text-purple-400 hover:text-purple-300',
      action: handleAddComments
    },
    {
      id: 'security',
      icon: Shield,
      label: 'Security Review',
      description: 'Analyze security issues',
      color: 'text-orange-400 hover:text-orange-300',
      action: handleSecurityReview
    },
    {
      id: 'test',
      icon: BarChart3,
      label: 'Generate Tests',
      description: 'Create unit tests',
      color: 'text-cyan-400 hover:text-cyan-300',
      action: handleGenerateTests
    }
  ];

  const generateActions: ActionButton[] = [
    {
      id: 'function',
      icon: Code2,
      label: 'Generate Function',
      description: 'Create a new function',
      color: 'text-teal-400 hover:text-teal-300',
      action: () => handleGenerateCode('Generate a function for this purpose')
    },
    {
      id: 'component',
      icon: Wand2,
      label: 'Generate Component',
      description: 'Create a React component',
      color: 'text-indigo-400 hover:text-indigo-300',
      action: () => handleGenerateCode('Generate a React component')
    },
    {
      id: 'api',
      icon: Sparkles,
      label: 'Generate API',
      description: 'Create API endpoint',
      color: 'text-pink-400 hover:text-pink-300',
      action: () => handleGenerateCode('Generate an API endpoint')
    }
  ];

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="space-y-4">
        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-teal-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={action.action}
                disabled={loading === action.id}
                className={`flex items-center space-x-2 p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors text-left disabled:opacity-50 ${action.color}`}
                title={action.description}
              >
                {loading === action.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <action.icon className="w-4 h-4" />
                )}
                <span className="text-sm text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Generate Code</h3>
          <div className="space-y-2">
            {generateActions.map(action => (
              <button
                key={action.id}
                onClick={action.action}
                disabled={loading === action.id}
                className={`w-full flex items-center space-x-2 p-3 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 rounded-lg transition-colors text-left disabled:opacity-50 ${action.color}`}
                title={action.description}
              >
                {loading === action.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <action.icon className="w-4 h-4" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-300">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedCode && (
          <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Code Selected</span>
            </div>
            <code className="text-xs text-gray-300 font-mono block overflow-hidden">
              {selectedCode.length > 120 ? `${selectedCode.substring(0, 120)}...` : selectedCode}
            </code>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center space-x-2 p-3 bg-teal-900/20 border border-teal-700 rounded-lg">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
            <span className="text-sm text-teal-300">AI is processing your request...</span>
          </div>
        )}
      </div>
    </div>
  );
}