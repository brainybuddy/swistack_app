'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot,
  Send,
  Loader2,
  Code2,
  Lightbulb,
  Bug,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Zap,
  FileText,
  Terminal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { AIService } from '../../services/AIService';

// Temporary type definitions until shared types are updated
interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface CodeSuggestion {
  id: string;
  description: string;
  code: string;
}

interface AIAction {
  id: string;
  type: string;
  description: string;
  requiresConfirmation?: boolean;
}

interface AIAssistantEnhancedProps {
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
  actions?: AIAction[];
  executionResults?: any[];
  isAgentMessage?: boolean;
  toolCalls?: any[];
}

interface ActionProgress {
  actionId: string;
  action: AIAction;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  output?: string;
  error?: string;
}

export default function AIAssistantEnhanced({
  projectId,
  currentFile,
  selectedCode,
  fileContent,
  className = ''
}: AIAssistantEnhancedProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [providerInfo, setProviderInfo] = useState<any>(null);
  const [actionProgress, setActionProgress] = useState<Map<string, ActionProgress>>(new Map());
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [agentConversationId, setAgentConversationId] = useState<string | null>(null);
  const [useAgent, setUseAgent] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = AIService.getInstance();

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
      query: { projectId }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socketInstance.on('ai:thinking', () => {
      setIsLoading(true);
    });

    socketInstance.on('ai:response', (data) => {
      handleAIResponse(data);
    });

    // Mistral Agent events
    socketInstance.on('agent:thinking', () => {
      setIsLoading(true);
    });

    socketInstance.on('agent:stream', (data) => {
      handleAgentStream(data);
    });

    socketInstance.on('agent:complete', () => {
      setIsLoading(false);
    });

    socketInstance.on('agent:error', (data) => {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Agent Error: ${data.error}`,
        timestamp: new Date(),
        error: data.error
      }]);
      setIsLoading(false);
    });

    socketInstance.on('ai:actionStarted', (event) => {
      updateActionProgress(event.actionId, {
        actionId: event.actionId,
        action: event.action,
        status: 'running',
        progress: 0
      });
    });

    socketInstance.on('ai:actionCompleted', (event) => {
      updateActionProgress(event.actionId, {
        status: 'completed',
        output: event.result?.output
      });
    });

    socketInstance.on('ai:actionFailed', (event) => {
      updateActionProgress(event.actionId, {
        status: 'failed',
        error: event.error
      });
    });

    socketInstance.on('ai:progress', (event) => {
      updateActionProgress(event.actionId, {
        progress: event.progress
      });
    });

    socketInstance.on('ai:output', (event) => {
      updateActionProgress(event.actionId, {
        output: event.output
      });
    });

    socketInstance.on('file:changed', (data) => {
      // Show notification about file changes
      console.log('File changed:', data);
    });

    socketInstance.on('terminal:output', (data) => {
      // Display terminal output in UI
      console.log('Terminal output:', data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [projectId]);

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
    if (useAgent) {
      initializeAgentConversation();
    }
  }, [projectId, useAgent]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, actionProgress]);

  const initializeConversation = async () => {
    try {
      const convId = await aiService.startConversation(projectId);
      setConversationId(convId);
      
      const info = await aiService.getProviderInfo();
      setProviderInfo(info);

      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: useAgent 
          ? `🤖 **SwiStack Code Agent** at your service! I'm powered by advanced AI with these capabilities:

• **Autonomous Development** - I can independently plan and execute complex coding tasks
• **Live Preview Integration** - I can see your preview and make visual adjustments
• **File Operations** - Read, write, and modify files across your project
• **Command Execution** - Run terminal commands and scripts
• **Real-time Feedback** - Stream responses and show progress live

${currentFile ? `I can see you're working on \`${currentFile}\`.` : ''} What coding challenge can I help you tackle?`
          : `👋 Hi! I'm your enhanced AI coding assistant with **full execution capabilities**. I can:

• **Execute Actions** - Automatically create, modify, and delete files
• **Run Commands** - Execute terminal commands and see outputs
• **Live Updates** - Show real-time progress of all operations
• **Smart Context** - Understand your entire project structure
• **Rollback** - Undo changes if something goes wrong

${currentFile ? `I can see you're working on \`${currentFile}\`.` : ''} What would you like me to help you with?`,
        timestamp: new Date(),
        metadata: {
          context: currentFile ? [currentFile] : [],
        }
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize AI conversation:', error);
    }
  };

  const updateActionProgress = (actionId: string, update: Partial<ActionProgress>) => {
    setActionProgress(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(actionId) || {} as ActionProgress;
      newMap.set(actionId, { ...existing, ...update });
      return newMap;
    });
  };

  const handleAIResponse = (data: any) => {
    const { response, actions, results } = data;
    
    setMessages(prev => [...prev, {
      id: response.id,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      metadata: response.metadata,
      actions: actions,
      executionResults: results
    }]);

    setIsLoading(false);
    setIsExecuting(false);
  };

  const handleAgentStream = (data: any) => {
    const { conversationId, type, data: streamData } = data;
    
    if (type === 'message') {
      setMessages(prev => {
        // Find existing assistant message or create new one
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isAgentMessage) {
          // Update existing message
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, content: msg.content + streamData.content }
              : msg
          );
        } else {
          // Create new message
          return [...prev, {
            id: `agent-${Date.now()}`,
            role: 'assistant',
            content: streamData.content,
            timestamp: new Date(),
            isAgentMessage: true
          }];
        }
      });
    } else if (type === 'tool_call') {
      // Show tool call in progress
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.isAgentMessage) {
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { 
                  ...msg, 
                  toolCalls: [...(msg.toolCalls || []), {
                    tool: streamData.tool,
                    parameters: streamData.parameters,
                    status: 'running'
                  }]
                }
              : msg
          );
        }
        return prev;
      });
    } else if (type === 'tool_result') {
      // Update tool call with result
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.isAgentMessage && lastMessage.toolCalls) {
          const updatedToolCalls = lastMessage.toolCalls.map(tc => 
            tc.tool === streamData.tool 
              ? { ...tc, result: streamData.result, status: 'completed' }
              : tc
          );
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, toolCalls: updatedToolCalls }
              : msg
          );
        }
        return prev;
      });
    }
  };

  const initializeAgentConversation = async () => {
    try {
      const response = await fetch('/api/agent/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setAgentConversationId(data.conversationId);
      }
    } catch (error) {
      console.error('Failed to initialize agent conversation:', error);
    }
  };

  const sendMessage = async (message?: string) => {
    const messageText = message || inputMessage.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsExecuting(autoExecute);

    try {
      if (useAgent && agentConversationId && socket && socket.connected) {
        // Use Mistral Agent
        socket.emit('agent:message', {
          conversationId: agentConversationId,
          message: messageText
        });
      } else if (socket && socket.connected) {
        // Use legacy orchestrator
        socket.emit('ai:chat', {
          projectId,
          message: messageText,
          conversationId,
          options: {
            includeProjectContext: true,
            includeFileContext: !!currentFile,
            currentFile,
            selectedCode,
            autoExecute
          }
        });
      } else {
        // Fallback to HTTP API
        const response = await fetch('/api/ai/chat/orchestrated', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            projectId,
            message: messageText,
            conversationId,
            options: {
              includeProjectContext: true,
              includeFileContext: !!currentFile,
              currentFile,
              selectedCode,
              autoExecute
            }
          })
        });

        const data = await response.json();
        if (data.success) {
          handleAIResponse(data.data);
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
      setIsLoading(false);
      setIsExecuting(false);
    }
  };

  const executeAction = async (action: AIAction) => {
    if (!socket || !socket.connected) return;
    
    const actionId = `action-${Date.now()}`;
    updateActionProgress(actionId, {
      actionId,
      action,
      status: 'pending',
      progress: 0
    });

    socket.emit('ai:executeAction', {
      projectId,
      action
    });
  };

  const renderActionProgress = () => {
    const progressItems = Array.from(actionProgress.values());
    if (progressItems.length === 0) return null;

    return (
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
          <Terminal className="w-4 h-4 mr-2" />
          Action Progress
        </h4>
        <div className="space-y-2">
          {progressItems.map(item => (
            <div key={item.actionId} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {item.status === 'running' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                {item.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                {item.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                {item.status === 'pending' && <AlertCircle className="w-4 h-4 text-yellow-400" />}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">
                  {item.action.type}: {item.action.description}
                </div>
                {item.progress !== undefined && item.status === 'running' && (
                  <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.output && (
                  <pre className="mt-1 text-xs text-gray-500 font-mono overflow-x-auto">
                    {item.output}
                  </pre>
                )}
                {item.error && (
                  <div className="mt-1 text-xs text-red-400">
                    Error: {item.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderActions = (actions?: AIAction[]) => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Suggested Actions
        </h4>
        <div className="space-y-2">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-700/30 rounded"
            >
              <div className="flex-1">
                <div className="text-sm text-gray-300">{action.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Type: {action.type}
                  {action.requiresConfirmation && ' • Requires confirmation'}
                </div>
              </div>
              {!autoExecute && (
                <button
                  onClick={() => executeAction(action)}
                  className="ml-3 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-xs rounded transition-colors flex items-center"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Execute
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
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
            <h2 className="font-semibold text-white">
              {useAgent ? 'SwiStack Code Agent' : 'Autonomous Agent'}
            </h2>
            {providerInfo && (
              <p className="text-xs text-gray-400">
                {useAgent ? 'Mistral Codestral' : providerInfo.currentProvider} • {isExecuting ? 'Executing...' : 'Ready'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUseAgent(!useAgent)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              useAgent 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Toggle between Mistral Agent and legacy orchestrator"
          >
            {useAgent ? '🤖 Agent Mode' : '🧠 Legacy Mode'}
          </button>
          <button
            onClick={() => setAutoExecute(!autoExecute)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              autoExecute 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Toggle auto-execution of AI actions"
          >
            {autoExecute ? 'Auto-Execute ON' : 'Auto-Execute OFF'}
          </button>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle suggestions"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Progress */}
      {renderActionProgress()}

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
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                      
                      {/* Tool calls for agent messages */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-700/30 rounded">
                          <h4 className="text-xs font-medium text-gray-400 mb-2">Tool Calls</h4>
                          {message.toolCalls.map((toolCall, index) => (
                            <div key={index} className="text-xs text-gray-300 mb-1">
                              <span className="font-mono text-purple-400">{toolCall.tool}</span>
                              {toolCall.status === 'running' && <Loader2 className="w-3 h-3 inline ml-2 animate-spin" />}
                              {toolCall.status === 'completed' && <CheckCircle className="w-3 h-3 inline ml-2 text-green-400" />}
                              {toolCall.result && (
                                <pre className="mt-1 text-xs text-gray-500 font-mono overflow-x-auto">
                                  {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render actions */}
                      {renderActions(message.actions)}
                      
                      {/* Execution results */}
                      {message.executionResults && message.executionResults.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-700/30 rounded">
                          <h4 className="text-xs font-medium text-gray-400 mb-1">
                            Execution Results
                          </h4>
                          {message.executionResults.map((result, index) => (
                            <div key={index} className="text-xs text-gray-300">
                              {result.success ? '✅' : '❌'} {result.output || result.error}
                            </div>
                          ))}
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
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me to create, modify files, run commands, or explain code..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors resize-none"
              rows={2}
              disabled={isLoading || isExecuting}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading || isExecuting}
            className="px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
          >
            {isLoading || isExecuting ? (
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
          <span className="text-xs text-gray-500">
            {autoExecute ? '⚡ Auto-execution enabled' : '⏸ Manual execution mode'}
          </span>
        </div>
      </div>
    </div>
  );
}