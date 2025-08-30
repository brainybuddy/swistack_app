'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bot,
  Send,
  Loader2,
  MessageSquare,
  Code2,
  Lightbulb,
  Bug,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Settings,
  Zap,
  FileText,
  Search
} from 'lucide-react';
import { AIService } from '@/services/AIService';
import { AIMessage, AIResponse, CodeSuggestion } from '@swistack/shared/types/ai';

interface AIAssistantPanelProps {
  projectId: string;
  currentFile?: string;
  selectedCode?: string;
  fileContent?: string;
  className?: string;
}

interface ChatMessage extends AIMessage {
  isLoading?: boolean;
  error?: string;
  suggestions?: CodeSuggestion[];
}

export default function AIAssistantPanel({
  projectId,
  currentFile,
  selectedCode,
  fileContent,
  className = ''
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [providerInfo, setProviderInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = AIService.getInstance();

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, [projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeConversation = async () => {
    try {
      const convId = await aiService.startConversation(projectId);
      setConversationId(convId);
      
      // Load provider info
      const info = await aiService.getProviderInfo();
      setProviderInfo(info);

      // Set welcome message based on context
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: currentFile 
          ? `👋 Hi! I'm your AI coding assistant. I can see you're working on \`${currentFile}\`. I can help you with:\n\n• **Code Generation** - Create functions, components, or entire features\n• **Code Explanation** - Understand complex code logic\n• **Bug Fixing** - Debug errors and issues\n• **Optimization** - Improve performance and best practices\n• **Refactoring** - Clean up and restructure code\n\nWhat would you like to work on?`
          : `👋 Welcome! I'm your AI coding assistant. I have full context of your project and can help you with coding, debugging, explanations, and more. What can I help you with today?`,
        timestamp: new Date(),
        metadata: {
          context: currentFile ? [currentFile] : [],
        }
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize AI conversation:', error);
      setMessages([{
        id: 'error',
        role: 'assistant',
        content: '❌ Failed to initialize AI assistant. Please check your connection and try again.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  const sendMessage = async (message?: string) => {
    const messageText = message || inputMessage.trim();
    if (!messageText || !conversationId) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    // Add user message and loading placeholder
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.chat(
        projectId,
        messageText,
        conversationId,
        {
          includeProjectContext: true,
          includeFileContext: !!currentFile,
          currentFile,
          selectedCode,
        }
      );

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? {
              ...msg,
              id: response.id,
              content: response.content,
              isLoading: false,
              metadata: response.metadata,
              suggestions: response.metadata.suggestions,
            }
          : msg
      ));
    } catch (error) {
      // Replace loading message with error
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? {
              ...msg,
              content: '❌ Sorry, I encountered an error. Please try again.',
              isLoading: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const provideFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    try {
      await aiService.provideFeedback(messageId, feedback);
      // Update message to show feedback was given
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, metadata: { ...msg.metadata, feedback } }
          : msg
      ));
    } catch (error) {
      console.error('Failed to provide feedback:', error);
    }
  };

  const quickActions = [
    {
      icon: Code2,
      label: 'Generate Code',
      prompt: currentFile 
        ? `Generate code for ${currentFile.split('/').pop()}` 
        : 'Help me generate code for a specific functionality',
      color: 'text-blue-400 hover:text-blue-300'
    },
    {
      icon: Bug,
      label: 'Fix Issues',
      prompt: 'Help me debug and fix issues in my code',
      color: 'text-red-400 hover:text-red-300'
    },
    {
      icon: Lightbulb,
      label: 'Explain Code',
      prompt: selectedCode 
        ? 'Explain this selected code to me'
        : 'Help me understand how this code works',
      color: 'text-yellow-400 hover:text-yellow-300'
    },
    {
      icon: Zap,
      label: 'Optimize',
      prompt: 'Suggest optimizations and improvements for my code',
      color: 'text-green-400 hover:text-green-300'
    },
  ];

  const formatContent = (content: string) => {
    // Simple markdown-like formatting for code blocks
    const parts = content.split('```');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // Code block
        const lines = part.split('\n');
        const language = lines[0] || '';
        const code = lines.slice(1).join('\n');
        
        return (
          <div key={index} className="relative my-3">
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-xs text-gray-400">{language}</span>
                <button
                  onClick={() => copyToClipboard(code)}
                  className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-3 overflow-x-auto">
                <code className="text-sm text-gray-100">{code}</code>
              </pre>
            </div>
          </div>
        );
      } else {
        // Regular text with basic markdown
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                 .replace(/\*(.*?)\*/g, '<em>$1</em>')
                 .split('<strong>').map((text, i) => {
                   if (i === 0) return text;
                   const [bold, rest] = text.split('</strong>');
                   return <span key={i}><strong className="font-semibold">{bold}</strong>{rest}</span>;
                 })}
          </div>
        );
      }
    });
  };

  return (
    <div className={`bg-gray-900 border-l border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">AI Assistant</h2>
            {providerInfo && (
              <p className="text-xs text-gray-400">
                Powered by {providerInfo.currentProvider}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Toggle suggestions"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      {showSuggestions && messages.length <= 1 && (
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => sendMessage(action.prompt)}
                disabled={isLoading}
                className="flex items-center space-x-2 p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="text-sm text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : ''}`}>
              <div className="flex items-start space-x-3">
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    {message.isLoading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}
                
                <div className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white ml-auto'
                    : message.error
                    ? 'bg-red-900/20 border border-red-700 text-red-200'
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm leading-relaxed">
                        {formatContent(message.content)}
                      </div>
                      
                      {/* Code suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            Suggestions
                          </h4>
                          {message.suggestions.slice(0, 3).map((suggestion, index) => (
                            <div
                              key={suggestion.id}
                              className="p-2 bg-gray-700/30 border border-gray-600 rounded text-xs"
                            >
                              <div className="font-medium text-gray-300">{suggestion.title}</div>
                              <div className="text-gray-400 mt-1">{suggestion.description}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Message actions */}
                      {message.role === 'assistant' && !message.isLoading && !message.error && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="p-1 text-gray-500 hover:text-gray-300 rounded"
                              title="Copy message"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => provideFeedback(message.id, 'positive')}
                              className={`p-1 rounded transition-colors ${
                                message.metadata?.feedback === 'positive'
                                  ? 'text-green-400'
                                  : 'text-gray-500 hover:text-green-400'
                              }`}
                              title="Good response"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => provideFeedback(message.id, 'negative')}
                              className={`p-1 rounded transition-colors ${
                                message.metadata?.feedback === 'negative'
                                  ? 'text-red-400'
                                  : 'text-gray-500 hover:text-red-400'
                              }`}
                              title="Needs improvement"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        {selectedCode && (
          <div className="mb-3 p-2 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Code2 className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300">Selected code will be included</span>
            </div>
            <code className="text-xs text-gray-300 font-mono">
              {selectedCode.length > 100 ? `${selectedCode.substring(0, 100)}...` : selectedCode}
            </code>
          </div>
        )}
        
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentFile 
                ? `Ask about ${currentFile.split('/').pop()} or anything else...`
                : "Ask anything about your code..."
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            Press Enter to send • Shift+Enter for new line
          </span>
          {currentFile && (
            <span className="text-xs text-gray-500">
              Context: {currentFile.split('/').pop()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}