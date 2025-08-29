'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Monitor, Zap, ZapOff } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface LivePreviewProps {
  fileTree: FileNode[];
  activeFile?: string;
  activeFileContent?: string;
  className?: string;
}

// Transform file tree into a flat file structure
const flattenFileTree = (nodes: FileNode[], path = ''): Record<string, string> => {
  const files: Record<string, string> = {};
  
  nodes.forEach(node => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    
    if (node.type === 'file' && node.content) {
      files[currentPath] = node.content;
    } else if (node.type === 'folder' && node.children) {
      Object.assign(files, flattenFileTree(node.children, currentPath));
    }
  });
  
  return files;
};

// Simple React component compiler
const compileReactApp = (files: Record<string, string>): string => {
  // Extract all CSS files for bundling
  const cssFiles = Object.entries(files).filter(([path]) => path.endsWith('.css'));
  const allCss = cssFiles.map(([, content]) => content).join('\n\n');
  
  // Extract JS files
  const appJs = files['src/App.js'] || '';
  const headerJs = files['src/components/Header.js'] || '';
  const todoListJs = files['src/components/TodoList.js'] || '';
  const todoItemJs = files['src/components/TodoItem.js'] || '';
  const footerJs = files['src/components/Footer.js'] || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Todo App - Live Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    /* Combined CSS from all files */
    ${allCss}
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    
    // Header Component
    function Header() {
      return (
        React.createElement('header', { className: 'header' },
          React.createElement('div', { className: 'container' },
            React.createElement('h1', { className: 'logo' },
              React.createElement('span', { className: 'logo-icon' }, '⚡'),
              'React Todo App'
            ),
            React.createElement('p', { className: 'subtitle' }, 'Built with SwiStack')
          )
        )
      );
    }

    // TodoItem Component
    function TodoItem({ todo, onToggle, onDelete }) {
      return (
        React.createElement('div', { 
          className: \`todo-item \${todo.completed ? 'completed' : ''}\`
        },
          React.createElement('div', { className: 'todo-content' },
            React.createElement('button', {
              className: 'toggle-button',
              onClick: () => onToggle(todo.id)
            }, todo.completed ? '✓' : '○'),
            React.createElement('span', { className: 'todo-text' }, todo.text)
          ),
          React.createElement('button', {
            className: 'delete-button',
            onClick: () => onDelete(todo.id)
          }, '×')
        )
      );
    }

    // TodoList Component
    function TodoList({ todos, onAddTodo, onToggleTodo, onDeleteTodo }) {
      const [newTodo, setNewTodo] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        if (newTodo.trim()) {
          onAddTodo(newTodo.trim());
          setNewTodo('');
        }
      };

      return (
        React.createElement('div', { className: 'todo-list' },
          React.createElement('div', { className: 'todo-header' },
            React.createElement('h2', null, 'My Tasks'),
            React.createElement('p', null, \`\${todos.filter(todo => !todo.completed).length} remaining\`)
          ),
          React.createElement('form', { onSubmit: handleSubmit, className: 'todo-form' },
            React.createElement('input', {
              type: 'text',
              value: newTodo,
              onChange: (e) => setNewTodo(e.target.value),
              placeholder: 'Add a new task...',
              className: 'todo-input'
            }),
            React.createElement('button', {
              type: 'submit',
              className: 'add-button'
            }, 'Add Task')
          ),
          React.createElement('div', { className: 'todos' },
            todos.length === 0 
              ? React.createElement('p', { className: 'empty-state' }, 'No tasks yet. Add one above!')
              : todos.map(todo => 
                  React.createElement(TodoItem, {
                    key: todo.id,
                    todo: todo,
                    onToggle: onToggleTodo,
                    onDelete: onDeleteTodo
                  })
                )
          )
        )
      );
    }

    // Footer Component
    function Footer() {
      return (
        React.createElement('footer', { className: 'footer' },
          React.createElement('div', { className: 'container' },
            React.createElement('p', null, '© 2024 React Todo App. Built with ❤️ using SwiStack.'),
            React.createElement('div', { className: 'footer-links' },
              React.createElement('a', { href: '#', className: 'footer-link' }, 'About'),
              React.createElement('a', { href: '#', className: 'footer-link' }, 'Contact'),
              React.createElement('a', { href: '#', className: 'footer-link' }, 'GitHub')
            )
          )
        )
      );
    }

    // Main App Component
    function App() {
      const [todos, setTodos] = useState([
        { id: 1, text: 'Learn React', completed: false },
        { id: 2, text: 'Build awesome apps', completed: false },
        { id: 3, text: 'Deploy to production', completed: false }
      ]);

      const addTodo = (text) => {
        const newTodo = {
          id: Date.now(),
          text,
          completed: false
        };
        setTodos([...todos, newTodo]);
      };

      const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
      };

      const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
      };

      return (
        React.createElement('div', { className: 'App' },
          React.createElement(Header),
          React.createElement('main', { className: 'main-content' },
            React.createElement(TodoList, {
              todos: todos,
              onAddTodo: addTodo,
              onToggleTodo: toggleTodo,
              onDeleteTodo: deleteTodo
            })
          ),
          React.createElement(Footer)
        )
      );
    }

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
};

export default function LivePreview({ 
  fileTree, 
  activeFile, 
  activeFileContent, 
  className = '' 
}: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isHotReloadEnabled, setIsHotReloadEnabled] = useState(true);
  const [compileTime, setCompileTime] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<string>('');

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;

    const startTime = Date.now();
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorDetails('');
      
      const files = flattenFileTree(fileTree);
      
      // If there's an active file with updated content, use it
      if (activeFile && activeFileContent) {
        files[activeFile] = activeFileContent;
      }
      
      const compiledHtml = compileReactApp(files);
      
      // Write the compiled HTML to the iframe
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(compiledHtml);
        doc.close();
        
        // Handle iframe load
        iframeRef.current.onload = () => {
          const endTime = Date.now();
          setCompileTime(endTime - startTime);
          setIsLoading(false);
          setLastUpdate(endTime);
        };
        
        // Handle errors
        const errorHandler = (event: any) => {
          console.error('Preview error:', event.error);
          setHasError(true);
          setIsLoading(false);
        };
        
        if (iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.addEventListener('error', errorHandler);
        }
      }
    } catch (error) {
      console.error('Failed to compile preview:', error);
      setErrorDetails(error instanceof Error ? error.message : 'Unknown compilation error');
      setHasError(true);
      setIsLoading(false);
    }
  }, [fileTree, activeFile, activeFileContent]);

  // Update preview when files change (hot reload)
  useEffect(() => {
    if (!isHotReloadEnabled) return;
    
    // Debounce the update to avoid too many rapid updates
    const timeoutId = setTimeout(() => {
      updatePreview();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [updatePreview, isHotReloadEnabled]);

  const handleRefresh = () => {
    updatePreview();
  };

  const handleOpenInNewTab = () => {
    if (iframeRef.current?.contentWindow) {
      const htmlContent = iframeRef.current.contentDocument?.documentElement.outerHTML;
      if (htmlContent) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        }
      }
    }
  };

  if (hasError) {
    return (
      <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Preview</span>
            <span className="text-xs text-red-400">Error</span>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 max-w-md">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <p className="text-lg font-medium mb-2">Compilation Error</p>
            <p className="text-sm mb-3">Failed to compile the React application</p>
            {errorDetails && (
              <div className="text-xs text-red-300 bg-red-900/20 p-3 rounded border border-red-800 mb-4 text-left">
                <pre className="whitespace-pre-wrap">{errorDetails}</pre>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Monitor className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">Live Preview</span>
          {isLoading && (
            <div className="flex items-center space-x-1 text-xs text-blue-400">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Updating...</span>
            </div>
          )}
          {!isLoading && isHotReloadEnabled && (
            <div className="flex items-center space-x-1 text-xs text-green-400">
              <Zap className="w-3 h-3" />
              <span>Hot Reload</span>
            </div>
          )}
          {!isLoading && compileTime > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <span>Compiled in {compileTime}ms</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsHotReloadEnabled(!isHotReloadEnabled)}
            className={`p-1 rounded transition-colors ${
              isHotReloadEnabled 
                ? 'text-green-400 hover:bg-green-900/20' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            title={isHotReloadEnabled ? "Disable hot reload" : "Enable hot reload"}
          >
            {isHotReloadEnabled ? (
              <Zap className="w-4 h-4" />
            ) : (
              <ZapOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Live Preview"
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Compiling React App...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}