'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import MonacoEditor, { detectLanguageFromFilename, useMonacoEditor } from './MonacoEditor';

export interface EditorTab {
  id: string;
  name: string;
  type: 'file' | 'chat';
  content: string;
  language?: string;
  filePath?: string;
  hasUnsavedChanges?: boolean;
  icon: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TabbedEditorProps {
  tabs: EditorTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabContentChange: (tabId: string, content: string) => void;
  onSaveTab: (tabId: string) => void;
  onNewFile: () => void;
  projectId?: string;
  className?: string;
  splitView?: boolean;
  onSplitToggle?: () => void;
}

export default function TabbedEditor({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
  onTabContentChange,
  onSaveTab,
  onNewFile,
  projectId,
  className = '',
  splitView = false,
  onSplitToggle
}: TabbedEditorProps) {
  const { editorConfig } = useMonacoEditor();
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const currentTab = tabs.find(tab => tab.id === activeTab);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentTab && currentTab.type === 'file') {
          onSaveTab(currentTab.id);
        }
      }
      
      // Ctrl/Cmd + W to close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (currentTab && currentTab.id !== 'ai-chat') {
          onTabClose(currentTab.id);
        }
      }
      
      // Ctrl/Cmd + N for new file
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onNewFile();
      }

      // Ctrl/Cmd + 1-9 to switch tabs
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          onTabChange(tabs[tabIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, tabs, onSaveTab, onTabClose, onNewFile, onTabChange]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: `I understand you want help with: "${inputMessage}". Let me assist you with that. This is a mock response - in a real implementation, this would connect to an AI service.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInputMessage('');
  };

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
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything about your code..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          />
          <button
            onClick={sendMessage}
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
              <tab.icon className="w-3 h-3 mr-1.5" />
              <span>{tab.name}</span>
              {tab.hasUnsavedChanges && (
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full ml-2" />
              )}
              {tab.id !== 'ai-chat' && (
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
              {/* Tab number indicator for keyboard shortcuts */}
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
                onClick={() => navigator.clipboard.writeText(currentTab.content)}
                className="px-2 py-1 hover:bg-gray-800 transition-colors text-xs"
                title="Copy All"
              >
                <Copy className="w-3 h-3" />
              </button>
              {onSplitToggle && (
                <button
                  onClick={onSplitToggle}
                  className="px-2 py-1 hover:bg-gray-800 transition-colors text-xs"
                  title="Split Editor"
                >
                  <Split className="w-3 h-3" />
                </button>
              )}
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

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {!currentTab ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Code2 className="w-12 h-12 mx-auto mb-3" />
              <p className="text-sm">No file selected</p>
              <button
                onClick={onNewFile}
                className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm text-white transition-colors"
              >
                Create New File
              </button>
            </div>
          </div>
        ) : currentTab.type === 'chat' ? (
          renderChatInterface()
        ) : (
          <MonacoEditor
            value={currentTab.content}
            language={currentTab.language || detectLanguageFromFilename(currentTab.name)}
            onChange={(value) => onTabContentChange(currentTab.id, value || '')}
            onSave={() => onSaveTab(currentTab.id)}
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
            filePath={currentTab.filePath}
          />
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
          <span>Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
}