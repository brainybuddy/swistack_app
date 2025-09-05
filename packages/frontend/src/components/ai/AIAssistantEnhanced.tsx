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
import { Socket } from 'socket.io-client';
import { AIService } from '../../services/AIService';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

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
  const { token, httpClient } = useAuth();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [providerInfo, setProviderInfo] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<{ ready: boolean; lastError?: string } | null>(null);
  const [actionProgress, setActionProgress] = useState<Map<string, ActionProgress>>(new Map());
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true);
  const [agentConversationId, setAgentConversationId] = useState<string | null>(null);
  // Agent-only mode: no legacy fallback
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = AIService.getInstance();
  const responseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const awaitingResponseRef = useRef(false);

  // Initialize WebSocket connection (agent-only). Wait until token is available.
  useEffect(() => {
    if (!token) return; // Avoid connecting with empty/undefined token

    // Use the authenticated shared socket from SocketProvider
    const socketInstance = socket;
    if (!socketInstance) return;

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
    });
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connect_error:', (error as any)?.message);
      setMessages(prev => [...prev, {
        id: `conn-error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Realtime connection failed: ${(error as any)?.message || 'Unknown error'}. Check NEXT_PUBLIC_API_URL and backend CORS (FRONTEND_URL).`,
        timestamp: new Date(),
        error: (error as any)?.message || 'connect_error'
      }]);
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
      if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
      awaitingResponseRef.current = false;
      handleAgentStream(data);
    });

    socketInstance.on('agent:complete', () => {
      setIsLoading(false);
      setIsExecuting(false);
      if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
      awaitingResponseRef.current = false;
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
      if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
      awaitingResponseRef.current = false;
    });

    socketInstance.on('ai:error', (data) => {
      setMessages(prev => [...prev, {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: `❌ AI Error: ${data?.error || 'Unknown error'}`,
        timestamp: new Date(),
        error: data?.error
      }]);
      setIsLoading(false);
      if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
      awaitingResponseRef.current = false;
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

    // No need to setSocket since we're using the shared socket from SocketProvider

    return () => {
      // Clean up event listeners instead of disconnecting the shared socket
      socketInstance.off('connect');
      socketInstance.off('connect_error');
      socketInstance.off('ai:thinking');
      socketInstance.off('ai:response');
      socketInstance.off('agent:thinking');
      socketInstance.off('agent:stream');
      socketInstance.off('ai:progress');
      socketInstance.off('file:error');
      socketInstance.off('file:updated');
      socketInstance.off('ai:action:start');
      socketInstance.off('ai:action:complete');
      socketInstance.off('ai:action:error');
      socketInstance.off('terminal:output');
    };
  }, [socket, projectId]);

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
    initializeAgentConversation();
    // Fetch agent status to decide fallback
    (async () => {
      try {
        const res = await fetch('/api/agent/status');
        const json = await res.json();
        if (json?.success && json?.data) {
          setAgentStatus({ ready: json.data.ready, lastError: json.data.lastError });
          if (!json.data.ready) {
            setMessages(prev => ([
              ...prev,
              {
                id: `agent-status-${Date.now()}`,
                role: 'assistant',
                content: `⚠️ Agent is not ready: ${json.data.lastError || 'Unavailable'}. Please try again shortly.`,
                timestamp: new Date(),
              }
            ]));
          }
        }
      } catch (e) {
        // Ignore status errors; user can still use legacy mode
      }
    })();
  }, [projectId]);

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
        content: `🤖 **SwiStack Code Agent** at your service! I'm powered by advanced AI with these capabilities:

• **Autonomous Development** - I can independently plan and execute complex coding tasks
• **Live Preview Integration** - I can see your preview and make visual adjustments
• **File Operations** - Read, write, and modify files across your project
• **Command Execution** - Run terminal commands and scripts
• **Real-time Feedback** - Stream responses and show progress live

${currentFile ? `I can see you're working on \`${currentFile}\`.` : ''} What coding challenge can I help you tackle?`,
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
      // Update tool call with result; if no agent message exists, create an NL summary
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.isAgentMessage && last.toolCalls) {
          const updated = last.toolCalls.map(tc =>
            tc.tool === (streamData.tool || tc.tool)
              ? { ...tc, result: streamData.result, status: 'completed' }
              : tc
          );
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, toolCalls: updated } : m));
        }

        // Natural language summaries per tool
        const tool = (streamData.tool || 'result') as string;
        const params = (streamData.parameters || {}) as any;
        const res = streamData.result as any;
        let content = '';
        if (tool === 'count_files' && typeof res?.count === 'number') {
          content = `I counted ${res.count} files in this project.`;
        } else if (tool === 'list_tree' && Array.isArray(res)) {
          const total = res.length;
          const show = res.slice(0, 20).map((r: any) => `${r.path} (${r.type})`).join('\n');
          content = `Here are ${Math.min(20, total)} of ${total} items in the project tree:\n\n${show}`;
        } else if (tool === 'search_files' && Array.isArray(res)) {
          const q = params?.query ? ` for "${params.query}"` : '';
          const total = res.length;
          const show = res.slice(0, 20).map((r: any) => r.path).join('\n');
          content = `I found ${total} file(s)${q}. Here are ${Math.min(20, total)} example(s):\n\n${show}`;
        } else if (tool === 'read_file' && typeof res?.path === 'string') {
          const raw = typeof res?.content === 'string' ? res.content : JSON.stringify(res?.content);
          const trimmed = raw && raw.length > 4000 ? raw.slice(0, 4000) + '\n...[truncated]' : raw || '';
          content = `Here is the content of ${res.path}:\n\n${trimmed}`;
        } else {
          const pretty = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
          content = pretty;
        }

        return [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            role: 'assistant',
            content,
            timestamp: new Date(),
            isAgentMessage: true,
          } as ChatMessage,
        ];
      });
    }
  };

  const initializeAgentConversation = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/agent/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setAgentConversationId(data.conversationId);
        return data.conversationId as string;
      }
    } catch (error) {
      console.error('Failed to initialize agent conversation:', error);
    }
    return null;
  };

  // Build a short project summary (file list + key files) to ground the agent
  const buildProjectSummary = async (): Promise<string> => {
    if (!projectId) return '';
    try {
      const treeRes = await httpClient.get(`/api/files/projects/${projectId}/tree`);
      if (!treeRes.success || !(treeRes as any)?.data?.files) return '';
      const files: Array<{ path: string; type: 'file' | 'directory' }>= (treeRes as any).data.files;
      const total = files.length;
      const topLevel = Array.from(new Set(files.map(f => f.path.split('/')[0]))).slice(0, 20);

      const keyFiles = ['README.md', 'package.json', 'tsconfig.json', 'next.config.js'];
      const contents: string[] = [];
      for (const k of keyFiles) {
        const found = files.find(f => f.path.toLowerCase() === k.toLowerCase());
        if (!found) continue;
        const safePath = found.path.split('/').map(encodeURIComponent).join('/');
        const fcRes = await httpClient.get(`/api/files/projects/${projectId}/files/${safePath}`);
        if ((fcRes as any)?.success && (fcRes as any)?.data?.file?.content) {
          const raw = (fcRes as any).data.file.content as string;
          const trimmed = raw.length > 3000 ? raw.slice(0, 3000) + '\n...[truncated]' : raw;
          contents.push(`---- ${found.path} ----\n${trimmed}`);
        }
      }
      const header = `PROJECT FILES: ${total}\nTOP-LEVEL: ${topLevel.join(', ')}`;
      return [header, ...contents].join('\n\n');
    } catch {
      return '';
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
      if (!socket || !socket.connected) {
        throw new Error('Realtime connection unavailable. Please refresh the page or check NEXT_PUBLIC_API_URL.');
      }

      let convId = agentConversationId;
      if (!convId) {
        convId = await initializeAgentConversation();
      }
      if (!convId) {
        throw new Error('Agent conversation could not be started. Is the backend agent active?');
      }
      // Build contextual message to improve agent responses
      const MAX_CONTEXT_CHARS = 5000;
      let context = `Project ID: ${projectId}`;
      if (currentFile) context += `\nActive File: ${currentFile}`;
      if (fileContent) {
        const trimmed = fileContent.length > MAX_CONTEXT_CHARS
          ? fileContent.slice(0, MAX_CONTEXT_CHARS) + "\n...[truncated]"
          : fileContent;
        context += `\nActive File Content (truncated if needed):\n\n${trimmed}`;
      }
      // Append project summary
      const summary = await buildProjectSummary();
      if (summary) {
        const cap = summary.length > 6000 ? summary.slice(0, 6000) + '\n...[truncated]' : summary;
        context += `\n\nPROJECT SUMMARY (truncated):\n${cap}`;
      }
      const finalMessage = `[[CONTEXT]]\n${context}\n[[/CONTEXT]]\n\n${messageText}`;

      // Start a timeout to surface no-response conditions
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
      awaitingResponseRef.current = true;
      responseTimerRef.current = setTimeout(() => {
        if (!awaitingResponseRef.current) return;
        setMessages(prev => [...prev, {
          id: `timeout-${Date.now()}`,
          role: 'assistant',
          content: '⏳ No response yet from the agent. Check /api/agent/status and socket connection.',
          timestamp: new Date()
        }]);
      }, 20000);

      socket.emit('agent:message', { conversationId: convId, message: finalMessage });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      const statusHint = agentStatus && agentStatus.ready === false
        ? ` Agent status: ${agentStatus.lastError || 'Unavailable'}.`
        : '';
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ ${errMsg}.${statusHint} Check /api/agent/status and server logs.`,
        timestamp: new Date(),
        error: errMsg
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

  const handleRetry = async () => {
    try {
      // Attempt socket reconnect if not connected
      if (socket && !socket.connected) {
        socket.connect();
      }

      // Refresh agent status
      const res = await fetch('/api/agent/status');
      const json = await res.json();
      if (json?.success && json?.data) {
        setAgentStatus({ ready: json.data.ready, lastError: json.data.lastError });
        setMessages(prev => [...prev, {
          id: `status-${Date.now()}`,
          role: 'assistant',
          content: `🔎 Agent status: ${json.data.ready ? 'ready' : 'not ready'}${json.data.lastError ? ` — ${json.data.lastError}` : ''}. Socket: ${socket?.connected ? 'connected' : 'disconnected'}.`,
          timestamp: new Date()
        }]);

        // Initialize conversation if agent is ready and we don't have one
        if (json.data.ready && !agentConversationId) {
          const convId = await initializeAgentConversation();
          if (convId) {
            setMessages(prev => [...prev, {
              id: `conv-${Date.now()}`,
              role: 'assistant',
              content: '✅ Agent conversation initialized. You can continue.',
              timestamp: new Date()
            }]);
          }
        }
      } else {
        throw new Error(json?.error || 'Failed to fetch agent status');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `retry-error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Retry failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      }]);
    }
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
            <h2 className="font-semibold text-white">SwiStack Code Agent</h2>
            {providerInfo && (
              <p className="text-xs text-gray-400">Mistral • {isExecuting ? 'Executing...' : 'Ready'}</p>
            )}
            {agentStatus && !agentStatus.ready && (
              <p className="text-xs text-yellow-400 mt-1">Agent unavailable: {agentStatus.lastError || 'Unknown issue'}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Connection indicator */}
          <div className="flex items-center space-x-1 mr-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>{isConnected ? 'Connected' : 'Offline'}</span>
          </div>
          {/* Retry button */}
          <button
            onClick={handleRetry}
            className="px-2 py-1 text-xs rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Retry connection and check agent status"
          >
            Retry
          </button>
          {/* Agent-only mode: no legacy toggle */}
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
