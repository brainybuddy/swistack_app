'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Code2,
  Save,
  Copy,
  Split,
  Maximize2,
  Minimize2,
  MessageSquare,
  Bot,
  User,
  Send,
  Sparkles,
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  Settings,
  FileText,
  Terminal as TerminalIcon,
  Play,
  Square
} from 'lucide-react';
import MonacoEditor, { detectLanguageFromFilename, useMonacoEditor } from './MonacoEditor';
import CommandPalette from './CommandPalette';
import { EditorTab, ChatMessage, Command } from '@swistack/shared';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedTabbedEditorProps {
  tabs: EditorTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabContentChange: (tabId: string, content: string) => void;
  onSaveTab: (tabId: string) => void;
  onNewFile: () => void;
  projectId?: string;
  className?: string;
}

interface FindReplaceState {
  isOpen: boolean;
  query: string;
  replace: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  currentMatch: number;
  totalMatches: number;
}

interface SplitView {
  enabled: boolean;
  orientation: 'horizontal' | 'vertical';
  leftTab?: string;
  rightTab?: string;
  ratio: number;
}

export default function EnhancedTabbedEditor({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
  onTabContentChange,
  onSaveTab,
  onNewFile,
  projectId,
  className = ''
}: EnhancedTabbedEditorProps) {
  const { httpClient } = useAuth();
  const { editorConfig } = useMonacoEditor();
  
  // UI State
  const [isMaximized, setIsMaximized] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [splitView, setSplitView] = useState<SplitView>({
    enabled: false,
    orientation: 'vertical',
    ratio: 0.5
  });
  
  // Find/Replace State
  const [findReplace, setFindReplace] = useState<FindReplaceState>({
    isOpen: false,
    query: '',
    replace: '',
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    currentMatch: 0,
    totalMatches: 0
  });

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const currentTab = tabs.find(tab => tab.id === activeTab);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      
      // Find
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setFindReplace(prev => ({ ...prev, isOpen: true }));
      }
      
      // Find and Replace
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setFindReplace(prev => ({ ...prev, isOpen: true }));
      }
      
      // Toggle Split View
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleSplitView();
      }

      // Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentTab && currentTab.type === 'file') {
          onSaveTab(currentTab.id);
        }
      }
      
      // Close Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (currentTab && currentTab.id !== 'ai-chat') {
          onTabClose(currentTab.id);
        }
      }
      
      // New File
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onNewFile();
      }

      // Tab navigation
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          onTabChange(tabs[tabIndex].id);
        }
      }

      // Escape to close various UI elements
      if (e.key === 'Escape') {
        if (findReplace.isOpen) {
          setFindReplace(prev => ({ ...prev, isOpen: false }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, tabs, onSaveTab, onTabClose, onNewFile, onTabChange, findReplace.isOpen]);

  const toggleSplitView = useCallback(() => {
    if (!splitView.enabled && tabs.length >= 2) {
      // Enable split view with current tab and first other tab
      const otherTab = tabs.find(t => t.id !== activeTab && t.type === 'file');
      if (otherTab) {
        setSplitView({
          enabled: true,
          orientation: 'vertical',
          leftTab: activeTab,
          rightTab: otherTab.id,
          ratio: 0.5
        });
      }
    } else {
      setSplitView(prev => ({ ...prev, enabled: false }));
    }
  }, [splitView.enabled, tabs, activeTab]);

  const handleCommandExecution = useCallback(async (command: Command) => {
    switch (command.id) {
      case 'file.new':
        onNewFile();
        break;
      case 'file.save':
        if (currentTab && currentTab.type === 'file') {
          onSaveTab(currentTab.id);
        }
        break;
      case 'file.close':
        if (currentTab && currentTab.id !== 'ai-chat') {
          onTabClose(currentTab.id);
        }
        break;
      case 'search.find':
        setFindReplace(prev => ({ ...prev, isOpen: true }));
        break;
      case 'search.find-replace':
        setFindReplace(prev => ({ ...prev, isOpen: true }));
        break;
      case 'view.split-editor':
        toggleSplitView();
        break;
      case 'code.format':
        await formatCurrentFile();
        break;
      case 'view.command-palette':
        setIsCommandPaletteOpen(true);
        break;
      default:
        console.log('Command not implemented:', command.id);
    }
  }, [currentTab, onNewFile, onSaveTab, onTabClose, toggleSplitView]);

  const formatCurrentFile = useCallback(async () => {
    if (!currentTab || currentTab.type !== 'file' || !currentTab.content) return;

    try {
      const language = detectLanguageFromFilename(currentTab.name);
      const response = await httpClient.post('/api/formatter/format', {
        content: currentTab.content,
        language
      });

      if (response.success && response.data?.changes) {
        onTabContentChange(currentTab.id, response.data.formatted);
      }
    } catch (error) {
      console.error('Failed to format file:', error);
    }
  }, [currentTab, httpClient, onTabContentChange]);

  const sendChatMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: `I understand you want help with: "${inputMessage}". Let me assist you with that. This is a mock response - in a real implementation, this would connect to an AI service.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  }, [inputMessage]);

  const performSearch = useCallback(async () => {
    if (!findReplace.query || !currentTab?.content) return;

    try {
      // Simple text search implementation
      const content = currentTab.content;
      const query = findReplace.regex 
        ? new RegExp(findReplace.query, findReplace.caseSensitive ? 'g' : 'gi')
        : findReplace.query;

      let matches = 0;
      if (findReplace.regex && query instanceof RegExp) {
        const regexMatches = content.match(query);
        matches = regexMatches?.length || 0;
      } else {
        const searchContent = findReplace.caseSensitive ? content : content.toLowerCase();
        const searchQuery = findReplace.caseSensitive ? query as string : (query as string).toLowerCase();
        
        let index = searchContent.indexOf(searchQuery);
        while (index !== -1) {
          matches++;
          index = searchContent.indexOf(searchQuery, index + 1);
        }
      }

      setFindReplace(prev => ({
        ...prev,
        totalMatches: matches,
        currentMatch: matches > 0 ? 1 : 0
      }));
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [findReplace.query, findReplace.regex, findReplace.caseSensitive, currentTab]);

  useEffect(() => {
    if (findReplace.query && findReplace.isOpen) {
      const debounceTimer = setTimeout(performSearch, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [findReplace.query, performSearch]);

  const renderChatInterface = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Chat Header */}
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600/20 rounded-2xl mb-3">
            <Sparkles className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">AI Assistant</h2>
          <p className="text-sm text-gray-400">I can help you write code, debug, and answer questions</p>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${msg.role === 'user' ? 'order-2' : ''}`}>
                <div className="flex items-start space-x-3">
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`rounded-lg p-4 ${
                    msg.role === 'user' 
                      ? 'bg-teal-600/20 text-white' 
                      : 'bg-gray-800 text-gray-300'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-2xl">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-800 text-gray-300 rounded-lg p-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            placeholder="Ask anything about your code..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          />
          <button
            onClick={sendChatMessage}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm">Send</span>
          </button>
        </div>
        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
          <span>Press Enter to send</span>
          <span>•</span>
          <span>Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );

  const renderFindReplace = () => {
    if (!findReplace.isOpen) return null;

    return (
      <div className="absolute top-0 right-0 z-10 bg-gray-800 border border-gray-700 rounded-lg p-4 m-4 shadow-lg min-w-80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Find and Replace</h3>
          <button
            onClick={() => setFindReplace(prev => ({ ...prev, isOpen: false }))}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {/* Find Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Find"
              value={findReplace.query}
              onChange={(e) => setFindReplace(prev => ({ ...prev, query: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:border-teal-500"
            />
            {findReplace.totalMatches > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {findReplace.currentMatch}/{findReplace.totalMatches}
              </div>
            )}
          </div>
          
          {/* Replace Input */}
          <div className="relative">
            <Replace className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Replace"
              value={findReplace.replace}
              onChange={(e) => setFindReplace(prev => ({ ...prev, replace: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
          
          {/* Options */}
          <div className="flex items-center space-x-4 text-xs">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={findReplace.caseSensitive}
                onChange={(e) => setFindReplace(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-300">Case sensitive</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={findReplace.wholeWord}
                onChange={(e) => setFindReplace(prev => ({ ...prev, wholeWord: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-300">Whole word</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={findReplace.regex}
                onChange={(e) => setFindReplace(prev => ({ ...prev, regex: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-300">Regex</span>
            </label>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <button className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-xs text-white">
              Replace
            </button>
            <button className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-xs text-white">
              Replace All
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditor = (tabId: string, className: string = '') => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return null;

    if (tab.type === 'chat') {
      return (
        <div className={className}>
          {renderChatInterface()}
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        <MonacoEditor
          value={tab.content || ''}
          language={tab.language || detectLanguageFromFilename(tab.name)}
          onChange={(value) => onTabContentChange(tab.id, value || '')}
          onSave={() => onSaveTab(tab.id)}
          theme={editorConfig.theme}
          fontSize={editorConfig.fontSize}
          tabSize={editorConfig.tabSize}
          insertSpaces={editorConfig.insertSpaces}
          wordWrap={editorConfig.wordWrap}
          minimap={editorConfig.minimap}
          lineNumbers={editorConfig.lineNumbers}
          autoSave={editorConfig.autoSave}
          autoSaveDelay={editorConfig.autoSaveDelay}
          projectId={projectId}
          filePath={tab.filePath}
        />
        {renderFindReplace()}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className} ${isMaximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Tab Bar */}
      <div className="h-9 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center px-3 py-1.5 border-r border-gray-800 cursor-pointer text-sm group relative ${
                activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-950 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {React.createElement(tab.icon, { className: "w-3 h-3 mr-1.5" })}
              <span>{tab.name}</span>
              {tab.hasUnsavedChanges && (
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full ml-2" />
              )}
              {tab.isClosable !== false && tab.id !== 'ai-chat' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="ml-2 p-0.5 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {/* Tab number for keyboard shortcuts */}
              <div className="absolute -top-1 -right-1 text-xs text-gray-600 opacity-0 group-hover:opacity-100">
                {index + 1 <= 9 ? index + 1 : ''}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-1 pr-2">
          {currentTab?.type === 'file' && (
            <>
              <button
                onClick={() => onSaveTab(currentTab.id)}
                className="px-2 py-1 hover:bg-gray-800 transition-colors text-xs"
                title="Save (Ctrl+S)"
              >
                <Save className="w-3 h-3" />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(currentTab.content || '')}
                className="px-2 py-1 hover:bg-gray-800 transition-colors text-xs"
                title="Copy All"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={toggleSplitView}
                className="px-2 py-1 hover:bg-gray-800 transition-colors text-xs"
                title="Split Editor (Ctrl+\)"
              >
                <Split className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="px-2 py-1 hover:bg-gray-800 transition-colors text-xs"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={onNewFile}
            className="px-2 py-1 hover:bg-gray-800 transition-colors"
            title="New File (Ctrl+N)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {splitView.enabled ? (
          <div className={`flex h-full ${splitView.orientation === 'horizontal' ? 'flex-col' : 'flex-row'}`}>
            {/* Left/Top Pane */}
            {renderEditor(
              splitView.leftTab || activeTab,
              splitView.orientation === 'horizontal' 
                ? `h-1/2 border-b border-gray-800`
                : `flex-1 border-r border-gray-800`
            )}
            
            {/* Right/Bottom Pane */}
            {renderEditor(
              splitView.rightTab || (tabs.find(t => t.id !== activeTab)?.id || activeTab),
              splitView.orientation === 'horizontal' 
                ? `h-1/2`
                : `flex-1`
            )}
          </div>
        ) : (
          renderEditor(activeTab, 'h-full')
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-950 border-t border-gray-800 flex items-center justify-between px-3 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          {currentTab?.type === 'file' && (
            <>
              <span>
                {currentTab.language || detectLanguageFromFilename(currentTab.name)}
              </span>
              <span>•</span>
              <span>UTF-8</span>
              <span>•</span>
              <span>LF</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {currentTab?.hasUnsavedChanges && (
            <span className="text-yellow-400">Unsaved changes</span>
          )}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hover:text-white transition-colors"
            title="Command Palette (Ctrl+Shift+P)"
          >
            <Search className="w-3 h-3 inline mr-1" />
            Command Palette
          </button>
          <span>Ln 1, Col 1</span>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onExecuteCommand={handleCommandExecution}
        projectId={projectId}
        activeFile={currentTab?.filePath}
      />
    </div>
  );
}