'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Editor, OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useAuth } from '@/contexts/AuthContext';

interface MonacoEditorProps {
  value: string;
  language: string;
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
  projectId?: string;
  filePath?: string;
}

export default function MonacoEditor({
  value,
  language,
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
  projectId,
  filePath
}: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { httpClient } = useAuth();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

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

    // Add format command
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // Add comment toggle
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.getAction('editor.action.commentLine')?.run();
    });

    // Focus the editor
    editor.focus();
  };

  // Handle content changes
  const handleEditorChange: OnChange = (value, event) => {
    if (onChange) {
      onChange(value);
    }

    setHasUnsavedChanges(true);

    // Auto-save functionality
    if (autoSave && projectId && filePath) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(async () => {
        if (value !== undefined) {
          try {
            await saveToServer(value);
            setHasUnsavedChanges(false);
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }
      }, autoSaveDelay);
    }
  };

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
      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-yellow-600/20 border border-yellow-600/30 rounded text-xs text-yellow-400">
          Unsaved changes
        </div>
      )}

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

// Hook for editor configuration
export function useMonacoEditor() {
  const [editorConfig, setEditorConfig] = useState({
    theme: 'vs-dark' as 'vs-dark' | 'light' | 'vs',
    fontSize: 14,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on' as 'on' | 'off' | 'wordWrapColumn' | 'bounded',
    minimap: true,
    lineNumbers: 'on' as 'on' | 'off' | 'relative' | 'interval',
    autoSave: true,
    autoSaveDelay: 2000,
  });

  const updateConfig = (newConfig: Partial<typeof editorConfig>) => {
    setEditorConfig(prev => ({ ...prev, ...newConfig }));
  };

  return { editorConfig, updateConfig };
}

// Language detection utility
export function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    
    // Web technologies
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    
    // Python
    'py': 'python',
    'pyx': 'python',
    'pyw': 'python',
    'pyi': 'python',
    
    // Other languages
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'clj': 'clojure',
    'fs': 'fsharp',
    'vb': 'vb',
    
    // Shell/Config
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'bat': 'bat',
    'cmd': 'bat',
    'dockerfile': 'dockerfile',
    'yml': 'yaml',
    'yaml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    
    // Markup/Documentation
    'md': 'markdown',
    'markdown': 'markdown',
    'tex': 'latex',
    'sql': 'sql',
    'graphql': 'graphql',
    'gql': 'graphql',
    
    // Data formats
    'csv': 'plaintext',
    'tsv': 'plaintext',
    'log': 'plaintext',
    'txt': 'plaintext',
  };

  return languageMap[ext] || 'plaintext';
}