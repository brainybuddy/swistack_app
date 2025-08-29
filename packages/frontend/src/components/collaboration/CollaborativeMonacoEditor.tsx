'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Editor, OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { OperationalTransform, TextOperation } from '@swistack/shared';
import CollaborativeCursor from './CollaborativeCursor';
import UserPresence from './UserPresence';

interface CollaborativeMonacoEditorProps {
  value: string;
  language: string;
  fileId: string;
  projectId: string;
  onChange?: (value: string | undefined) => void;
  onSave?: (value: string) => void;
  theme?: 'vs-dark' | 'light' | 'vs';
  readOnly?: boolean;
  minimap?: boolean;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  fontSize?: number;
  tabSize?: number;
  insertSpaces?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  className?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  filePath?: string;
}

export default function CollaborativeMonacoEditor({
  value,
  language,
  fileId,
  projectId,
  onChange,
  onSave,
  theme = 'vs-dark',
  readOnly = false,
  minimap = true,
  wordWrap = 'on',
  fontSize = 14,
  tabSize = 2,
  insertSpaces = true,
  lineNumbers = 'on',
  className = '',
  autoSave = true,
  autoSaveDelay = 2000,
  filePath
}: CollaborativeMonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const editorElementRef = useRef<HTMLDivElement | null>(null);
  const { httpClient } = useAuth();
  const {
    isConnected,
    activeUsersInFile,
    userCursors,
    userSelections,
    sendOperation,
    sendCursorMove,
    sendSelectionChange,
    openFile,
    closeFile
  } = useCollaboration();

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isApplyingRemoteOperation, setIsApplyingRemoteOperation] = useState(false);
  const [documentVersion, setDocumentVersion] = useState(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastChangeRef = useRef<string>(value);

  // Get active users and their cursors for this file
  const activeUsers = activeUsersInFile.get(fileId) || [];
  const fileCursors = userCursors.get(fileId) || new Map();
  const fileSelections = userSelections.get(fileId) || new Map();

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Store reference to editor element for cursor positioning
    const editorElement = editor.getDomNode();
    if (editorElement) {
      editorElementRef.current = editorElement as HTMLDivElement;
      (editorElement as any)._monacoEditor = editor;
    }

    // Configure editor options
    editor.updateOptions({
      fontSize,
      tabSize,
      insertSpaces,
      wordWrap,
      minimap: { enabled: minimap },
      lineNumbers,
      readOnly,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      renderWhitespace: 'selection',
      glyphMargin: true,
      folding: true,
      showFoldingControls: 'mouseover',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editor.getValue());
        setHasUnsavedChanges(false);
      }
    });

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (!isApplyingRemoteOperation && isConnected) {
        const position = e.position;
        sendCursorMove(fileId, position.lineNumber - 1, position.column - 1);
      }
    });

    // Track selection changes
    editor.onDidChangeCursorSelection((e) => {
      if (!isApplyingRemoteOperation && isConnected) {
        const selection = e.selection;
        if (!selection.isEmpty()) {
          sendSelectionChange(
            fileId,
            selection.startLineNumber - 1,
            selection.startColumn - 1,
            selection.endLineNumber - 1,
            selection.endColumn - 1
          );
        }
      }
    });

    // Focus the editor
    editor.focus();

    // Open file for collaboration
    if (isConnected) {
      openFile(projectId, fileId);
    }
  };

  // Handle content changes
  const handleEditorChange: OnChange = useCallback((newValue, event) => {
    if (isApplyingRemoteOperation || !newValue) return;

    const oldValue = lastChangeRef.current;
    lastChangeRef.current = newValue;

    if (onChange) {
      onChange(newValue);
    }

    setHasUnsavedChanges(true);

    // Generate operation from change
    if (isConnected && oldValue !== newValue) {
      try {
        const operation = OperationalTransform.fromDelta(oldValue, newValue, 'current-user');
        sendOperation(fileId, operation);
      } catch (error) {
        console.error('Failed to generate operation:', error);
      }
    }

    // Auto-save functionality
    if (autoSave && projectId && filePath) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveToServer(newValue);
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, autoSaveDelay);
    }
  }, [
    isApplyingRemoteOperation,
    onChange,
    isConnected,
    fileId,
    sendOperation,
    autoSave,
    projectId,
    filePath,
    autoSaveDelay
  ]);

  // Apply remote operation to editor
  const applyRemoteOperation = useCallback((operation: TextOperation) => {
    const editor = editorRef.current;
    if (!editor || isApplyingRemoteOperation) return;

    setIsApplyingRemoteOperation(true);

    try {
      const currentValue = editor.getValue();
      const newValue = OperationalTransform.apply(currentValue, operation);
      
      // Calculate cursor position preservation
      const selection = editor.getSelection();
      
      // Set new value
      editor.setValue(newValue);
      lastChangeRef.current = newValue;
      
      // Restore selection if possible
      if (selection) {
        editor.setSelection(selection);
      }

      if (onChange) {
        onChange(newValue);
      }
    } catch (error) {
      console.error('Failed to apply remote operation:', error);
    } finally {
      setIsApplyingRemoteOperation(false);
    }
  }, [isApplyingRemoteOperation, onChange]);

  // Listen to collaboration events
  useEffect(() => {
    const collaboration = useCollaboration();
    if (!collaboration.socket) return;

    const handleOperationApplied = (data: any) => {
      if (data.fileId === fileId && data.userId !== 'current-user') {
        applyRemoteOperation(data.operation);
        setDocumentVersion(data.version);
      }
    };

    collaboration.socket.on('operation-applied', handleOperationApplied);

    return () => {
      collaboration.socket?.off('operation-applied', handleOperationApplied);
    };
  }, [fileId, applyRemoteOperation]);

  // Open file when component mounts and connected
  useEffect(() => {
    if (isConnected) {
      openFile(projectId, fileId);
    }

    return () => {
      if (isConnected) {
        closeFile(projectId, fileId);
      }
    };
  }, [isConnected, projectId, fileId, openFile, closeFile]);

  // Save content to server
  const saveToServer = async (content: string) => {
    if (!projectId || !filePath) return;

    try {
      const response = await httpClient.put(`/api/files/projects/${projectId}/files/${filePath}`, {
        content,
        encoding: 'utf8'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save file');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  };

  // Configure Monaco themes
  useEffect(() => {
    // Custom dark theme configuration
    monaco.editor.defineTheme('swistack-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#0D1117',
        'editor.foreground': '#E6EDF3',
        'editorLineNumber.foreground': '#7D8590',
        'editorLineNumber.activeForeground': '#E6EDF3',
        'editor.lineHighlightBackground': '#21262D',
        'editor.selectionBackground': '#264F78',
        'editor.selectionHighlightBackground': '#264F7880',
        'editorCursor.foreground': '#E6EDF3',
        'editor.findMatchBackground': '#9E6A03',
        'editor.findMatchHighlightBackground': '#F2CC6040',
      },
    });

    // Set the custom theme as default for dark mode
    if (theme === 'vs-dark') {
      monaco.editor.setTheme('swistack-dark');
    }
  }, [theme]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative h-full ${className}`}>
      {/* Collaboration header */}
      {isConnected && activeUsers.length > 0 && (
        <div className="absolute top-2 left-2 z-10 flex items-center space-x-2">
          <UserPresence users={activeUsers} maxVisible={3} />
          <div className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded">
            {activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} editing
          </div>
        </div>
      )}

      {/* Connection status */}
      <div className="absolute top-2 right-20 z-10">
        <div className={`flex items-center space-x-2 text-xs px-2 py-1 rounded ${
          isConnected 
            ? 'bg-green-600/20 border border-green-600/30 text-green-400' 
            : 'bg-red-600/20 border border-red-600/30 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-yellow-600/20 border border-yellow-600/30 rounded text-xs text-yellow-400">
          Unsaved changes
        </div>
      )}

      {/* Collaborative cursors */}
      {Array.from(fileCursors.entries()).map(([userId, cursor]) => {
        const user = activeUsers.find(u => u.id === userId);
        if (!user) return null;

        return (
          <CollaborativeCursor
            key={userId}
            user={user}
            line={cursor.line}
            column={cursor.column}
            editorElement={editorElementRef.current}
          />
        );
      })}

      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        theme={theme === 'vs-dark' ? 'swistack-dark' : theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          fontSize,
          tabSize,
          insertSpaces,
          wordWrap,
          lineNumbers,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          renderWhitespace: 'selection',
          glyphMargin: true,
          folding: true,
          showFoldingControls: 'mouseover',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showWords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
        }}
      />
    </div>
  );
}