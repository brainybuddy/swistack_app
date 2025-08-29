'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Terminal as TerminalIcon,
  X,
  Plus,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Copy,
  Trash2,
  Play,
  Square,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface TerminalSession {
  id: string;
  name: string;
  cwd: string;
  isActive: boolean;
  output: TerminalLine[];
  input: string;
  isRunning: boolean;
  pid?: number;
}

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  projectId?: string;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function Terminal({ 
  projectId, 
  className = '',
  isMinimized = false,
  onToggleMinimize 
}: TerminalProps) {
  const { user, httpClient } = useAuth();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [backendSessionId, setBackendSessionId] = useState<string>('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>('');

  // Initialize with backend terminal session
  useEffect(() => {
    const initializeTerminal = async () => {
      if (!projectId || !user || !httpClient) {
        console.log('Terminal initialization skipped - missing requirements:', { projectId, user: !!user, httpClient: !!httpClient });
        return;
      }

      // Prevent multiple initializations
      if (sessionIdRef.current) {
        console.log('Terminal already initialized, skipping:', sessionIdRef.current);
        return;
      }

      try {
        console.log('Creating terminal session for project:', projectId);
        const response = await httpClient.post('/api/terminal/sessions', {
          projectId: projectId
        });

        if (response.success && response.data?.sessionId) {
          const sessionId = response.data.sessionId;
          setBackendSessionId(sessionId);
          sessionIdRef.current = sessionId;

          const defaultSession: TerminalSession = {
            id: 'main',
            name: 'Terminal',
            cwd: projectId ? `/workspace/${projectId}` : '/workspace',
            isActive: true,
            output: [
              {
                id: '1',
                type: 'system',
                content: 'Welcome to Swistack Terminal',
                timestamp: new Date()
              },
              {
                id: '2',
                type: 'system',
                content: `Connected to project workspace`,
                timestamp: new Date()
              }
            ],
            input: '',
            isRunning: false
          };

          setSessions([defaultSession]);
          setActiveSessionId('main');
          setIsConnected(true);
          console.log('Terminal session created successfully:', sessionId);
        } else {
          console.error('Failed to create terminal session:', response);
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error creating terminal session:', error);
        setIsConnected(false);
      }
    };

    initializeTerminal();

    // Cleanup function
    return () => {
      if (sessionIdRef.current && httpClient) {
        console.log('Cleaning up terminal session:', sessionIdRef.current);
        httpClient.delete(`/api/terminal/sessions/${sessionIdRef.current}`)
          .catch(error => console.error('Error terminating terminal session:', error));
        sessionIdRef.current = '';
      }
    };
  }, [projectId, user?.id, httpClient]);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [sessions]);

  const getActiveSession = (): TerminalSession | undefined => {
    return sessions.find(s => s.id === activeSessionId);
  };

  const updateSession = (sessionId: string, updates: Partial<TerminalSession>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, ...updates } : session
    ));
  };

  const addOutput = (sessionId: string, line: Omit<TerminalLine, 'id' | 'timestamp'>) => {
    const newLine: TerminalLine = {
      ...line,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    updateSession(sessionId, {
      output: [...(getActiveSession()?.output || []), newLine]
    });
  };

  const executeCommand = async (command: string) => {
    const session = getActiveSession();
    if (!session || !command.trim() || !backendSessionId || !httpClient) return;

    // Clear input and set running state
    updateSession(session.id, { input: '', isRunning: true });

    try {
      console.log('Executing command:', command);
      const response = await httpClient.post(`/api/terminal/sessions/${backendSessionId}/execute`, {
        command: command
      });

      if (response.success && response.data?.outputs) {
        // Add all output lines from backend
        const outputs = response.data.outputs;
        for (const output of outputs) {
          const outputType = output.type === 'command' ? 'command' : 
                           output.type === 'stderr' ? 'error' : 'output';
          
          // Handle clear screen command
          if (output.content === 'CLEAR_SCREEN') {
            updateSession(session.id, { output: [] });
            continue;
          }
          
          addOutput(session.id, {
            type: outputType,
            content: output.content
          });
        }

        // Update working directory if changed
        if (response.data.cwd) {
          updateSession(session.id, { cwd: response.data.cwd });
        }
      } else {
        addOutput(session.id, {
          type: 'error',
          content: `Error: ${response.error || 'Command execution failed'}`
        });
      }
    } catch (error) {
      console.error('Error executing command:', error);
      addOutput(session.id, {
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      });
    } finally {
      updateSession(session.id, { isRunning: false });
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const session = getActiveSession();
      if (session && session.input.trim()) {
        executeCommand(session.input);
      }
    }
  };

  const createNewSession = () => {
    const newSession: TerminalSession = {
      id: `terminal-${Date.now()}`,
      name: `Terminal ${sessions.length + 1}`,
      cwd: '/workspace',
      isActive: false,
      output: [{
        id: '1',
        type: 'system',
        content: 'New terminal session started',
        timestamp: new Date()
      }],
      input: '',
      isRunning: false
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const closeSession = (sessionId: string) => {
    if (sessions.length <= 1) return; // Keep at least one session

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (sessionId === activeSessionId) {
      setActiveSessionId(sessions[0]?.id || '');
    }
  };

  const getLineTypeColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'system': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  const activeSession = getActiveSession();

  if (isMinimized) {
    return (
      <div className={`bg-gray-900 border-t border-gray-700 ${className}`}>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Terminal</span>
            {isConnected && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-gray-800 rounded text-gray-400"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border-t border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center space-x-1">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`flex items-center space-x-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                session.id === activeSessionId
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <TerminalIcon className="w-3 h-3" />
              <span>{session.name}</span>
              {session.isRunning && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={createNewSession}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
            title="New terminal"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span>Disconnected</span>
              </>
            )}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
            title="Terminal settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
              title="Minimize terminal"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Font Size:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs"
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
              </select>
            </div>
            <button
              onClick={() => activeSession && updateSession(activeSession.id, { output: [] })}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed"
        style={{ fontSize: `${fontSize}px` }}
      >
        {activeSession?.output.map(line => (
          <div key={line.id} className={`${getLineTypeColor(line.type)} whitespace-pre-wrap`}>
            {line.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-2">
        <div className="flex items-center space-x-2">
          <span className="text-green-400 text-sm font-mono">
            {activeSession?.cwd}$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={activeSession?.input || ''}
            onChange={(e) => activeSession && updateSession(activeSession.id, { input: e.target.value })}
            onKeyDown={handleKeyDown}
            disabled={activeSession?.isRunning}
            className="flex-1 bg-transparent text-gray-300 font-mono text-sm focus:outline-none disabled:opacity-50"
            placeholder={activeSession?.isRunning ? 'Running command...' : 'Type a command...'}
            autoComplete="off"
          />
          {activeSession?.isRunning && (
            <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}