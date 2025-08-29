'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with default session
  useEffect(() => {
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
  }, [projectId]);

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
    if (!session || !command.trim()) return;

    // Add command to output
    addOutput(session.id, {
      type: 'command',
      content: `${session.cwd}$ ${command}`
    });

    // Clear input
    updateSession(session.id, { input: '', isRunning: true });

    // Mock command execution (replace with actual WebSocket/API call)
    setTimeout(() => {
      const output = mockCommandExecution(command, session.cwd);
      addOutput(session.id, {
        type: output.isError ? 'error' : 'output',
        content: output.result
      });
      
      updateSession(session.id, { 
        isRunning: false,
        cwd: output.newCwd || session.cwd
      });
    }, Math.random() * 1000 + 500); // Random delay 500-1500ms
  };

  const mockCommandExecution = (command: string, currentDir: string) => {
    const cmd = command.trim().toLowerCase();
    
    if (cmd.startsWith('cd ')) {
      const path = cmd.substring(3).trim();
      return {
        result: '',
        newCwd: path.startsWith('/') ? path : `${currentDir}/${path}`,
        isError: false
      };
    }

    if (cmd === 'ls' || cmd === 'dir') {
      return {
        result: 'src/\npackage.json\nREADME.md\n.gitignore\nnode_modules/',
        isError: false
      };
    }

    if (cmd === 'pwd') {
      return {
        result: currentDir,
        isError: false
      };
    }

    if (cmd.startsWith('npm ')) {
      if (cmd === 'npm install') {
        return {
          result: 'added 1204 packages in 45s\n\n89 packages are looking for funding',
          isError: false
        };
      }
      if (cmd === 'npm start' || cmd === 'npm run dev') {
        return {
          result: '> dev\n> next dev\n\nready - started server on 0.0.0.0:3000',
          isError: false
        };
      }
    }

    if (cmd === 'clear' || cmd === 'cls') {
      // Handle clear separately
      updateSession(activeSessionId, { output: [] });
      return { result: '', isError: false };
    }

    if (cmd === 'help') {
      return {
        result: 'Available commands:\n  ls, pwd, cd, npm, git, clear, help\n\nTip: Use Tab for autocompletion',
        isError: false
      };
    }

    if (cmd.startsWith('git ')) {
      return {
        result: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean',
        isError: false
      };
    }

    // Default: command not found
    return {
      result: `${command}: command not found`,
      isError: true
    };
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