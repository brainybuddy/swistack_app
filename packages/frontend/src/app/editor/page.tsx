'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeft, 
  Code2, 
  Save, 
  Play, 
  Settings,
  FolderTree,
  MessageSquare,
  Terminal as TerminalIcon,
  Database,
  Globe,
  GitBranch,
  Package,
  FileText,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  X,
  Plus,
  Search,
  Monitor,
  Send,
  User,
  Bot,
  Sparkles,
  Type,
  Palette,
  Eye,
  RotateCcw,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MoreHorizontal,
  ToggleLeft,
  Hash,
  Map,
  Users,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Layout
} from 'lucide-react';

// Import our custom components
import CollaborationPanel from '@/components/collaboration/CollaborationPanel';
import ChatPanel from '@/components/collaboration/ChatPanel';
import Terminal from '@/components/ide/Terminal';
import NotificationSystem from '@/components/notifications/NotificationSystem';
import ProjectSettingsPanel from '@/components/ProjectSettingsPanel';
import LivePreview from '@/components/preview/LivePreview';

// File tree structure
interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface Tab {
  id: string;
  name: string;
  type: 'chat' | 'file';
  content?: string;
  icon: any;
}

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [template, setTemplate] = useState<any>(null);
  
  // Tools state
  const [activeLeftTool, setActiveLeftTool] = useState<'files' | 'search' | 'git' | 'collaboration' | 'extensions'>('files');
  const [rightPaneTabs, setRightPaneTabs] = useState<Array<{id: string, label: string, icon: any}>>([
    { id: 'preview', label: 'Preview', icon: Monitor },
    { id: 'collaboration', label: 'Collaboration', icon: Users }
  ]);
  const [activeRightTab, setActiveRightTab] = useState<string>('preview');
  
  // Editor state - Start with App.js open to show the React code
  const [openTabs, setOpenTabs] = useState<Tab[]>([
    { id: 'src/App.js', name: 'App.js', type: 'file', icon: Code2 },
    { id: 'ai-chat', name: 'AI Assistant', type: 'chat', icon: MessageSquare }
  ]);
  const [activeTab, setActiveTab] = useState<string>('src/App.js');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  
  // Chat state
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Monaco Editor state  
  const [editorValue, setEditorValue] = useState('');
  
  // Pane sizes - force new default widths
  const [leftPaneWidth, setLeftPaneWidth] = useState(199);
  const [rightPaneWidth, setRightPaneWidth] = useState(436);
  
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [showLeftPane, setShowLeftPane] = useState(true);
  const [showRightPane, setShowRightPane] = useState(true);

  // Editor settings
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  // Collaboration and UI state
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'team-chat'>('terminal');

  // File tree with realistic React App template
  // Helper function to find a file in the tree by path
  const findFileByPath = (tree: FileNode[], path: string): FileNode | null => {
    const parts = path.split('/');
    let current = tree;
    
    for (const part of parts) {
      const found = current.find(node => node.name === part);
      if (!found) return null;
      
      if (found.type === 'file') {
        return found;
      } else if (found.type === 'folder' && found.children) {
        current = found.children;
      } else {
        return null;
      }
    }
    
    return null;
  };

  const [fileTree] = useState<FileNode[]>([
    {
      name: 'public',
      type: 'folder',
      children: [
        { 
          name: 'index.html', 
          type: 'file', 
          content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="React App created with SwiStack" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`, 
          language: 'html' 
        }
      ]
    },
    {
      name: 'src',
      type: 'folder',
      children: [
        { 
          name: 'index.js', 
          type: 'file', 
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`, 
          language: 'javascript' 
        },
        { 
          name: 'App.js', 
          type: 'file', 
          content: `import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import TodoList from './components/TodoList';
import Footer from './components/Footer';

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
    <div className="App">
      <Header />
      <main className="main-content">
        <TodoList 
          todos={todos} 
          onAddTodo={addTodo}
          onToggleTodo={toggleTodo}
          onDeleteTodo={deleteTodo}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;`, 
          language: 'javascript' 
        },
        { 
          name: 'App.css', 
          type: 'file', 
          content: `.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}`, 
          language: 'css' 
        },
        { 
          name: 'index.css', 
          type: 'file', 
          content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  background-color: #f5f5f5;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`, 
          language: 'css' 
        },
        {
          name: 'components',
          type: 'folder',
          children: [
            { 
              name: 'Header.js', 
              type: 'file', 
              content: `import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">
          <span className="logo-icon">⚡</span>
          React Todo App
        </h1>
        <p className="subtitle">Built with SwiStack</p>
      </div>
    </header>
  );
}

export default Header;`, 
              language: 'javascript' 
            },
            { 
              name: 'Header.css', 
              type: 'file', 
              content: `.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
  color: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.logo {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 3rem;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .logo {
    font-size: 2rem;
  }
  
  .logo-icon {
    font-size: 2.5rem;
  }
  
  .container {
    padding: 0 1rem;
  }
}`, 
              language: 'css' 
            },
            { 
              name: 'TodoList.js', 
              type: 'file', 
              content: `import React, { useState } from 'react';
import TodoItem from './TodoItem';
import './TodoList.css';

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
    <div className="todo-list">
      <div className="todo-header">
        <h2>My Tasks</h2>
        <p>{todos.filter(todo => !todo.completed).length} remaining</p>
      </div>
      
      <form onSubmit={handleSubmit} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add Task
        </button>
      </form>

      <div className="todos">
        {todos.length === 0 ? (
          <p className="empty-state">No tasks yet. Add one above!</p>
        ) : (
          todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggleTodo}
              onDelete={onDeleteTodo}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TodoList;`, 
              language: 'javascript' 
            },
            { 
              name: 'TodoList.css', 
              type: 'file', 
              content: `.todo-list {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.todo-header {
  text-align: center;
  margin-bottom: 2rem;
}

.todo-header h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.todo-header p {
  color: #666;
  font-size: 1rem;
}

.todo-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.todo-input {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.todo-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-button {
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.add-button:hover {
  transform: translateY(-2px);
}

.todos {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 2rem;
}

@media (max-width: 768px) {
  .todo-list {
    padding: 1.5rem;
  }
  
  .todo-form {
    flex-direction: column;
  }
  
  .todo-header h2 {
    font-size: 1.5rem;
  }
}`, 
              language: 'css' 
            },
            { 
              name: 'TodoItem.js', 
              type: 'file', 
              content: `import React from 'react';
import './TodoItem.css';

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
      <div className="todo-content">
        <button
          className="toggle-button"
          onClick={() => onToggle(todo.id)}
        >
          {todo.completed ? '✓' : '○'}
        </button>
        <span className="todo-text">{todo.text}</span>
      </div>
      <button
        className="delete-button"
        onClick={() => onDelete(todo.id)}
      >
        ×
      </button>
    </div>
  );
}

export default TodoItem;`, 
              language: 'javascript' 
            },
            { 
              name: 'TodoItem.css', 
              type: 'file', 
              content: `.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.todo-item:hover {
  background: #e9ecef;
}

.todo-item.completed {
  opacity: 0.7;
  background: #d4edda;
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.toggle-button {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid #667eea;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  color: #667eea;
  transition: all 0.3s ease;
}

.todo-item.completed .toggle-button {
  background: #667eea;
  color: white;
}

.todo-text {
  font-size: 1rem;
  color: #333;
  transition: all 0.3s ease;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #666;
}

.delete-button {
  width: 2rem;
  height: 2rem;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.delete-button:hover {
  background: #c82333;
}`, 
              language: 'css' 
            },
            { 
              name: 'Footer.js', 
              type: 'file', 
              content: `import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; 2024 React Todo App. Built with ❤️ using SwiStack.</p>
        <div className="footer-links">
          <a href="#" className="footer-link">About</a>
          <a href="#" className="footer-link">Contact</a>
          <a href="#" className="footer-link">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;`, 
              language: 'javascript' 
            },
            { 
              name: 'Footer.css', 
              type: 'file', 
              content: `.footer {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 2rem 0;
  margin-top: auto;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-link {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.footer-link:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 0 1rem;
  }
  
  .footer-links {
    gap: 1.5rem;
  }
}`, 
              language: 'css' 
            }
          ]
        }
      ]
    },
    { 
      name: 'package.json', 
      type: 'file', 
      content: `{
  "name": "react-todo-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`, 
      language: 'json' 
    },
    { 
      name: 'README.md', 
      type: 'file', 
      content: `# React Todo App

A beautiful, responsive todo application built with React and SwiStack.

## Features

- ✅ Add, toggle, and delete tasks
- 🎨 Beautiful gradient design
- 📱 Fully responsive
- ⚡ Fast and lightweight
- 🔥 Hot reload development

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm start
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

- \`npm start\` - Runs the app in development mode
- \`npm test\` - Launches the test runner
- \`npm run build\` - Builds the app for production
- \`npm run eject\` - Ejects from Create React App

## Built With

- [React](https://reactjs.org/) - The web framework used
- [SwiStack](https://swistack.com) - The development platform
- CSS3 - For styling and animations

## License

This project is licensed under the MIT License.
`, 
      language: 'markdown' 
    }
  ]);

  useEffect(() => {
    // Check for project data (from AI creation) first
    const projectData = searchParams.get('project');
    if (projectData) {
      try {
        const project = JSON.parse(decodeURIComponent(projectData));
        setTemplate(project);
        
        // Set AI-specific welcome message
        if (project.createdBy === 'ai') {
          setMessages([
            { 
              role: 'assistant', 
              content: `Welcome to your AI-generated project "${project.name}"! 🎉\n\nI've created this project based on your description: "${project.description}"\n\nThe project structure is ready and includes all the necessary files. You can start editing the code or ask me any questions about the implementation. What would you like to work on first?`
            }
          ]);
        } else {
          setMessages([
            { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
          ]);
        }
      } catch (e) {
        console.error('Error parsing project data:', e);
        setTemplate({ name: 'New Project', language: 'JavaScript', description: 'A new project' });
        setMessages([
          { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
        ]);
      }
    } else {
      // Fall back to template data
      const templateData = searchParams.get('template');
      if (templateData) {
        try {
          const parsedTemplate = JSON.parse(decodeURIComponent(templateData));
          setTemplate(parsedTemplate);
          setMessages([
            { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
          ]);
        } catch (e) {
          setTemplate({ name: 'New Project', language: 'JavaScript', description: 'A new project' });
          setMessages([
            { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
          ]);
        }
      } else {
        setTemplate({ name: 'New Project', language: 'JavaScript', description: 'A new project' });
        setMessages([
          { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
        ]);
      }
    }
  }, [searchParams]);

  // Initialize editor with first file content
  useEffect(() => {
    if (openTabs.length > 0 && activeTab !== 'ai-chat') {
      const activeFile = openTabs.find(t => t.id === activeTab);
      if (activeFile && activeFile.type === 'file') {
        // If the tab doesn't have content yet, load it from the file tree
        if (!activeFile.content) {
          const fileInTree = findFileByPath(fileTree, activeFile.id);
          if (fileInTree?.content) {
            setEditorValue(fileInTree.content);
            // Update the tab with the content
            setOpenTabs(tabs => tabs.map(tab => 
              tab.id === activeTab ? { ...tab, content: fileInTree.content } : tab
            ));
          }
        } else {
          setEditorValue(activeFile.content);
        }
      }
    }
  }, [activeTab, openTabs, fileTree]);


  // Keyboard shortcuts for panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B to toggle left panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setShowLeftPane(!showLeftPane);
      }
      // Cmd/Ctrl + Shift + E to toggle right panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setShowRightPane(!showRightPane);
      }
      // Cmd/Ctrl + ` to toggle terminal
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        setShowBottomPanel(!showBottomPanel);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showLeftPane, showRightPane, showBottomPanel]);

  // Handle pane resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft && showLeftPane) {
        const toolsSidebarWidth = 48; // Tools sidebar width
        const newWidth = Math.max(200, Math.min(800, e.clientX - toolsSidebarWidth));
        setLeftPaneWidth(newWidth);
      } else if (isDraggingRight && showRightPane) {
        const newWidth = Math.max(200, Math.min(800, window.innerWidth - e.clientX));
        setRightPaneWidth(newWidth);
      } else if (isDraggingBottom && showBottomPanel) {
        const headerHeight = 40; // Approximate header height
        const newHeight = Math.max(200, Math.min(600, window.innerHeight - e.clientY - headerHeight));
        setBottomPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
      setIsDraggingBottom(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDraggingLeft || isDraggingRight || isDraggingBottom) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDraggingBottom ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight, isDraggingBottom, showLeftPane, showRightPane, showBottomPanel]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const openFile = (file: FileNode, path: string) => {
    const tabId = path;
    const existingTab = openTabs.find(t => t.id === tabId);
    
    if (!existingTab) {
      setOpenTabs([...openTabs, { 
        id: tabId, 
        name: file.name, 
        type: 'file',
        content: file.content || '',
        icon: File
      }]);
    }
    setActiveTab(tabId);
    setEditorValue(file.content || '');
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't allow closing the AI chat tab
    if (tabId === 'ai-chat') return;
    
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);
    
    if (activeTab === tabId) {
      // Switch to AI chat if closing active tab
      setActiveTab('ai-chat');
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    setMessages([...messages, { role: 'user', content: inputMessage }]);
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I understand you want help with: "${inputMessage}". Let me assist you with that.` 
      }]);
    }, 1000);
    setInputMessage('');
  };

  const createNewFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      const tabId = `new-${Date.now()}`;
      const defaultContent = fileName.endsWith('.js') || fileName.endsWith('.jsx') 
        ? '// New JavaScript file\n' 
        : fileName.endsWith('.ts') || fileName.endsWith('.tsx')
        ? '// New TypeScript file\n'
        : fileName.endsWith('.css')
        ? '/* New CSS file */\n'
        : fileName.endsWith('.html')
        ? '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  \n</body>\n</html>'
        : '// New file\n';
        
      setOpenTabs([...openTabs, {
        id: tabId,
        name: fileName,
        type: 'file',
        content: defaultContent,
        icon: File
      }]);
      setActiveTab(tabId);
      setEditorValue(defaultContent);
    }
  };

  const renderFileTree = (nodes: FileNode[], parentPath: string = '') => {
    return nodes.map((node) => {
      const path = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.has(path);
        return (
          <div key={path}>
            <div
              className="flex items-center space-x-1 px-2 py-1 hover:bg-gray-800 cursor-pointer rounded text-sm"
              onClick={() => toggleFolder(path)}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-300">{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div className="ml-3">
                {renderFileTree(node.children, path)}
              </div>
            )}
          </div>
        );
      }
      
      return (
        <div
          key={path}
          className="flex items-center space-x-1 px-2 py-1 ml-4 hover:bg-gray-800 cursor-pointer rounded text-sm"
          onClick={() => openFile(node, path)}
        >
          <File className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">{node.name}</span>
        </div>
      );
    });
  };

  const tools = [
    { id: 'files', icon: FolderTree, tooltip: 'Files' },
    { id: 'search', icon: Search, tooltip: 'Search' },
    { id: 'git', icon: GitBranch, tooltip: 'Source Control' },
    { id: 'collaboration', icon: Users, tooltip: 'Collaboration' },
    { id: 'extensions', icon: Package, tooltip: 'Extensions' }
  ];

  const availableRightTools = [
    { id: 'console', icon: FileText, label: 'Console' },
    { id: 'database', icon: Database, label: 'Database' },
    { id: 'deploy', icon: Globe, label: 'Deploy' }
  ];
  
  // Mock project data for components
  const mockProject = {
    id: template?.slug || 'ai-project',
    name: template?.name || 'AI Project',
    description: template?.description || 'AI Generated Project',
    isPublic: false,
    ownerId: user?.id || 'current-user',
    status: 'active' as const,
    branch: 'main',
    storageUsed: 0,
    storageLimit: 1024 * 1024 * 1024, // 1GB
    createdAt: new Date(),
    updatedAt: new Date(),
    lastAccessedAt: new Date(),
    members: [
      {
        id: 'member-1',
        projectId: template?.slug || 'ai-project',
        userId: user?.id || 'current-user',
        role: 'owner' as const,
        status: 'accepted' as const,
        permissions: [],
        invitedAt: new Date(),
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    settings: {},
    environment: {},
    slug: template?.slug || 'ai-project',
    template: template?.template || 'ai-generated'
  };

  const addRightPaneTab = () => {
    // Show available tools that aren't already open
    const unopenedTools = availableRightTools.filter(
      tool => !rightPaneTabs.find(tab => tab.id === tool.id)
    );
    
    if (unopenedTools.length === 0) {
      alert('All tools are already open');
      return;
    }
    
    // For simplicity, add the first available tool
    // In a real app, you'd show a dropdown menu
    const toolToAdd = unopenedTools[0];
    setRightPaneTabs([...rightPaneTabs, toolToAdd]);
    setActiveRightTab(toolToAdd.id);
  };

  const closeRightPaneTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't allow closing the preview tab
    if (tabId === 'preview') return;
    
    const newTabs = rightPaneTabs.filter(t => t.id !== tabId);
    setRightPaneTabs(newTabs);
    
    if (activeRightTab === tabId) {
      setActiveRightTab('preview');
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div key="editor-layout-v2" className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-10 bg-gray-950 border-b border-gray-800 px-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/workspace')}
              className="flex items-center space-x-1 px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded text-sm transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium">{template?.name || 'Untitled'}</span>
              {template?.createdBy === 'ai' && (
                <span className="text-xs px-2 py-0.5 bg-purple-600/20 border border-purple-600/30 rounded text-purple-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Generated</span>
                </span>
              )}
              <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400">{template?.language || 'JavaScript'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Saved</span>
            </div>
            <button className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors">
              <Save className="w-3 h-3 inline mr-1" />
              Save All
            </button>
            <button className="px-3 py-1 text-xs bg-teal-600 hover:bg-teal-700 rounded transition-colors">
              <Play className="w-3 h-3 inline mr-1" />
              Run
            </button>
            <div className="flex items-center space-x-1">
              {/* Panel Toggle Controls */}
              <button 
                onClick={() => setShowLeftPane(!showLeftPane)}
                className={`p-2 rounded transition-colors ${
                  showLeftPane ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'bg-gray-700 text-white'
                }`}
                title="Toggle Left Panel"
              >
                {showLeftPane ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setShowRightPane(!showRightPane)}
                className={`p-2 rounded transition-colors ${
                  showRightPane ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'bg-gray-700 text-white'
                }`}
                title="Toggle Right Panel"
              >
                {showRightPane ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
              
              <div className="w-px h-4 bg-gray-600 mx-1" />
              
              <NotificationSystem className="" />
              <button 
                onClick={() => setShowProjectSettings(!showProjectSettings)}
                className={`p-2 rounded transition-colors ${
                  showProjectSettings ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="Project Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowBottomPanel(!showBottomPanel)}
                className={`p-2 rounded transition-colors ${
                  showBottomPanel ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="Toggle Terminal"
              >
                <TerminalIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tools Sidebar */}
          <div className="w-12 bg-gray-950 border-r border-gray-800 flex flex-col">
            <div className="flex-1">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveLeftTool(tool.id as any)}
                  className={`w-full p-3 flex justify-center items-center hover:bg-gray-800 transition-colors ${
                    activeLeftTool === tool.id ? 'bg-gray-800 border-l-2 border-teal-500' : ''
                  }`}
                  title={tool.tooltip}
                >
                  <tool.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            <div className="border-t border-gray-800">
              <button 
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className={`w-full p-3 flex justify-center items-center transition-colors ${
                  showSettingsPanel ? 'bg-gray-800 border-l-2 border-teal-500' : 'hover:bg-gray-800'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Left Pane - File Explorer */}
          {showLeftPane && (
            <div className="bg-gray-900 border-r border-gray-800 relative flex-shrink-0" style={{ width: `${leftPaneWidth}px` }}>
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-gray-800">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {activeLeftTool === 'files' && 'Explorer'}
                  {activeLeftTool === 'search' && 'Search'}
                  {activeLeftTool === 'git' && 'Source Control'}
                  {activeLeftTool === 'collaboration' && 'Collaboration'}
                  {activeLeftTool === 'extensions' && 'Extensions'}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {activeLeftTool === 'files' && renderFileTree(fileTree)}
                
                {activeLeftTool === 'search' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      No recent searches
                    </div>
                  </div>
                )}
                
                {activeLeftTool === 'git' && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-300">Source Control</div>
                    <div className="space-y-2 text-xs">
                      <div className="text-gray-400">• No changes</div>
                      <div className="text-gray-400">• Clean working tree</div>
                    </div>
                    <button className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded text-sm transition-colors">
                      Initialize Repository
                    </button>
                  </div>
                )}
                
                {activeLeftTool === 'collaboration' && (
                  <CollaborationPanel 
                    projectId={mockProject.id}
                    currentFile={openTabs.find(t => t.id === activeTab)?.name}
                    className="border-0 bg-transparent"
                  />
                )}
                
                {activeLeftTool === 'extensions' && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-300">Extensions</div>
                    <div className="space-y-2 text-xs text-gray-400">
                      <div>• TypeScript</div>
                      <div>• ESLint</div>
                      <div>• Prettier</div>
                      <div>• GitLens</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Resize handle */}
            <div
              className={`absolute top-0 right-0 w-2 h-full cursor-col-resize transition-colors z-20 ${
                isDraggingLeft ? 'bg-teal-500' : 'hover:bg-teal-500/50 bg-transparent'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingLeft(true);
              }}
              style={{ touchAction: 'none', right: '-1px' }}
              title="Drag to resize left panel"
            />
          </div>
          )}

          {/* Middle Pane - Tabbed Interface */}
          <div className="flex-1 flex flex-col bg-gray-900 relative">
            {/* Left resize handle for Monaco editor */}
            {showLeftPane && (
              <div
                className={`absolute top-0 left-0 h-full cursor-col-resize transition-all z-30 ${
                  isDraggingLeft 
                    ? 'bg-teal-500 shadow-lg' 
                    : 'hover:bg-teal-500/50 hover:shadow-md bg-gray-600/20'
                }`}
                style={{ width: '0.5px', touchAction: 'none', left: '-1px' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingLeft(true);
                }}
                title="Drag to resize left panel (adjust Monaco editor width)"
              />
            )}
            {/* Tabs */}
            <div className="h-9 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center overflow-x-auto">
                {openTabs.map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.type === 'file') {
                        setEditorValue(tab.content || '');
                      }
                    }}
                    className={`flex items-center px-3 py-1.5 border-r border-gray-800 cursor-pointer text-sm ${
                      activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-950 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon className="w-3 h-3 mr-1.5" />
                    <span>{tab.name}</span>
                    {tab.id !== 'ai-chat' && (
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className="ml-2 p-0.5 hover:bg-gray-700 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={createNewFile}
                className="px-2 py-1 hover:bg-gray-800 transition-colors mr-2"
                title="New File"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'ai-chat' ? (
                /* AI Chat Interface */
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Chat Header */}
                    {messages.length === 0 && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600/20 rounded-2xl mb-3">
                          <Sparkles className="w-8 h-8 text-teal-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-1">AI Assistant</h2>
                        <p className="text-sm text-gray-400">I can help you write code, debug, and answer questions</p>
                      </div>
                    )}

                    {/* Messages */}
                    <div className="space-y-4">
                      {messages.map((msg, idx) => (
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
              ) : (
                /* Enhanced Code Editor */
                <div className={`h-full relative overflow-hidden ${
                  editorTheme === 'dark' ? 'bg-gray-950' :
                  editorTheme === 'light' ? 'bg-white' :
                  'bg-black'
                }`}>
                  {/* Editor Header */}
                  <div className={`h-8 flex items-center justify-between px-4 border-b ${
                    editorTheme === 'dark' ? 'border-gray-800 bg-gray-900' :
                    editorTheme === 'light' ? 'border-gray-200 bg-gray-50' :
                    'border-gray-700 bg-gray-900'
                  }`}>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className={`${
                        editorTheme === 'dark' ? 'text-gray-400' :
                        editorTheme === 'light' ? 'text-gray-600' :
                        'text-gray-300'
                      }`}>
                        {openTabs.find(t => t.id === activeTab)?.name || 'Untitled'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        editorTheme === 'dark' ? 'bg-gray-800 text-gray-500' :
                        editorTheme === 'light' ? 'bg-gray-200 text-gray-600' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        JavaScript
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                        className={`p-1 rounded transition-colors ${
                          editorTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' :
                          editorTheme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200' :
                          'text-gray-300 hover:text-white hover:bg-gray-700'
                        }`}
                        title="Decrease font size"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </button>
                      <span className={`text-xs px-2 ${
                        editorTheme === 'dark' ? 'text-gray-400' :
                        editorTheme === 'light' ? 'text-gray-600' :
                        'text-gray-300'
                      }`}>
                        {fontSize}px
                      </span>
                      <button
                        onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                        className={`p-1 rounded transition-colors ${
                          editorTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' :
                          editorTheme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200' :
                          'text-gray-300 hover:text-white hover:bg-gray-700'
                        }`}
                        title="Increase font size"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      
                      <div className={`w-px h-4 mx-2 ${
                        editorTheme === 'dark' ? 'bg-gray-700' :
                        editorTheme === 'light' ? 'bg-gray-300' :
                        'bg-gray-600'
                      }`} />
                      
                      <button
                        onClick={() => setWordWrap(!wordWrap)}
                        className={`p-1 rounded transition-colors ${
                          wordWrap 
                            ? (editorTheme === 'dark' ? 'text-teal-400 bg-teal-400/10' :
                               editorTheme === 'light' ? 'text-teal-600 bg-teal-100' :
                               'text-teal-400 bg-teal-400/20')
                            : (editorTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' :
                               editorTheme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200' :
                               'text-gray-300 hover:text-white hover:bg-gray-700')
                        }`}
                        title="Toggle word wrap"
                      >
                        <Type className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => setMinimap(!minimap)}
                        className={`p-1 rounded transition-colors ${
                          minimap 
                            ? (editorTheme === 'dark' ? 'text-teal-400 bg-teal-400/10' :
                               editorTheme === 'light' ? 'text-teal-600 bg-teal-100' :
                               'text-teal-400 bg-teal-400/20')
                            : (editorTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' :
                               editorTheme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200' :
                               'text-gray-300 hover:text-white hover:bg-gray-700')
                        }`}
                        title="Toggle minimap"
                      >
                        <Map className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Monaco Editor */}
                  <div className="flex-1 h-full">
                    <Editor
                      value={editorValue}
                      onChange={(value) => {
                        setEditorValue(value || '');
                        // Update the active tab's content
                        const activeTabData = openTabs.find(t => t.id === activeTab);
                        if (activeTabData && activeTabData.type === 'file') {
                          setOpenTabs(tabs => tabs.map(tab => 
                            tab.id === activeTab ? { ...tab, content: value || '' } : tab
                          ));
                        }
                      }}
                      language={(() => {
                        const activeFile = openTabs.find(t => t.id === activeTab);
                        if (!activeFile) return 'javascript';
                        const extension = activeFile.name.split('.').pop()?.toLowerCase();
                        switch (extension) {
                          case 'js': case 'jsx': return 'javascript';
                          case 'ts': case 'tsx': return 'typescript';
                          case 'css': return 'css';
                          case 'html': return 'html';
                          case 'json': return 'json';
                          case 'md': return 'markdown';
                          case 'py': return 'python';
                          default: return 'javascript';
                        }
                      })()}
                      theme={editorTheme === 'light' ? 'light' : editorTheme === 'high-contrast' ? 'hc-black' : 'vs-dark'}
                      options={{
                        fontSize: fontSize,
                        wordWrap: wordWrap ? 'on' : 'off',
                        lineNumbers: showLineNumbers ? 'on' : 'off',
                        minimap: { enabled: minimap },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        renderWhitespace: 'selection',
                        tabSize: 2,
                        insertSpaces: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: 'on',
                        accessibilitySupport: 'off',
                        cursorBlinking: 'blink',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        mouseWheelZoom: true,
                        scrollbar: {
                          verticalScrollbarSize: 10,
                          horizontalScrollbarSize: 10,
                        },
                        contextmenu: true,
                        copyWithSyntaxHighlighting: true
                      }}
                      loading={
                        <div className="flex items-center justify-center h-full">
                          <div className="text-gray-400">Loading editor...</div>
                        </div>
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane - Preview/Console */}
          {showRightPane && (
            <div className="bg-gray-900 border-l border-gray-800 relative flex-shrink-0" style={{ width: `${rightPaneWidth}px` }}>
            {/* Resize handle */}
            <div
              className={`absolute top-0 left-0 w-1 h-full cursor-col-resize transition-colors z-10 ${
                isDraggingRight ? 'bg-teal-500' : 'hover:bg-teal-500/50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingRight(true);
              }}
              style={{ touchAction: 'none' }}
            />
            <div className="h-full flex flex-col">
              {/* Tool Tabs */}
              <div className="h-9 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center overflow-x-auto">
                  {rightPaneTabs.map(tab => (
                    <div
                      key={tab.id}
                      onClick={() => setActiveRightTab(tab.id)}
                      className={`flex items-center px-3 py-1.5 border-r border-gray-800 cursor-pointer text-xs ${
                        activeRightTab === tab.id 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-950 text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      <tab.icon className="w-3 h-3 mr-1" />
                      <span>{tab.label}</span>
                      {tab.id !== 'preview' && (
                        <button
                          onClick={(e) => closeRightPaneTab(tab.id, e)}
                          className="ml-2 p-0.5 hover:bg-gray-700 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addRightPaneTab}
                  className="px-2 py-1 hover:bg-gray-800 transition-colors mr-2"
                  title="Add Tool"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tool Content */}
              <div className="flex-1 p-4 overflow-auto">
                {activeRightTab === 'preview' && (
                  <LivePreview
                    fileTree={fileTree}
                    activeFile={activeTab}
                    activeFileContent={editorValue}
                    className="h-full -m-4"
                  />
                )}
                
                {activeRightTab === 'collaboration' && (
                  <CollaborationPanel 
                    projectId={mockProject.id}
                    currentFile={openTabs.find(t => t.id === activeTab)?.name}
                    className="h-full"
                  />
                )}
                
                {activeRightTab === 'console' && (
                  <div className="font-mono text-xs text-gray-400">
                    <div>› Starting development server...</div>
                    <div>› Server running at http://localhost:3000</div>
                    <div className="text-green-400">✓ Compiled successfully</div>
                  </div>
                )}
                
                {activeRightTab === 'database' && (
                  <div className="text-gray-400 text-sm">
                    <div className="mb-3 font-medium">Database Explorer</div>
                    <div className="text-xs space-y-2">
                      <div>• Connect to your database</div>
                      <div>• Run queries</div>
                      <div>• View schema</div>
                    </div>
                  </div>
                )}
                
                {activeRightTab === 'deploy' && (
                  <div className="text-gray-400 text-sm">
                    <div className="mb-3 font-medium">Deployment</div>
                    <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded text-white text-sm">
                      Deploy to Production
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
        
        {/* Bottom Panel - Terminal & Team Chat */}
        {showBottomPanel && (
          <div className="border-t border-gray-800 relative" style={{ height: `${bottomPanelHeight}px` }}>
            {/* Resize handle */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 cursor-row-resize transition-colors z-10 ${
                isDraggingBottom ? 'bg-teal-500' : 'hover:bg-teal-500/50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingBottom(true);
              }}
              style={{ touchAction: 'none' }}
            />
            
            <div className="h-full flex flex-col">
              {/* Bottom Panel Tabs */}
              <div className="h-8 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => setActiveBottomTab('terminal')}
                    className={`flex items-center space-x-2 px-3 py-1.5 text-xs transition-colors ${
                      activeBottomTab === 'terminal'
                        ? 'bg-gray-900 text-white border-b-2 border-teal-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <TerminalIcon className="w-3 h-3" />
                    <span>Terminal</span>
                  </button>
                  <button
                    onClick={() => setActiveBottomTab('team-chat')}
                    className={`flex items-center space-x-2 px-3 py-1.5 text-xs transition-colors ${
                      activeBottomTab === 'team-chat'
                        ? 'bg-gray-900 text-white border-b-2 border-teal-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Team Chat</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowBottomPanel(false)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded mr-2"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Bottom Panel Content */}
              <div className="flex-1 overflow-hidden">
                {activeBottomTab === 'terminal' && (
                  <Terminal className="h-full" />
                )}
                {activeBottomTab === 'team-chat' && (
                  <ChatPanel 
                    projectId={mockProject.id}
                    className="h-full"
                  />
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Editor Settings Panel */}
        {showSettingsPanel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg w-96 max-h-96 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-teal-400" />
                  <h3 className="font-medium text-white">Editor Settings</h3>
                </div>
                <button
                  onClick={() => setShowSettingsPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Settings Content */}
              <div className="p-4 space-y-6">
                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <Palette className="w-4 h-4 inline mr-2" />
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'dark' as const, label: 'Dark', bg: 'bg-gray-900', border: 'border-gray-700' },
                      { id: 'light' as const, label: 'Light', bg: 'bg-white', border: 'border-gray-200' },
                      { id: 'high-contrast' as const, label: 'High Contrast', bg: 'bg-black', border: 'border-gray-600' }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setEditorTheme(theme.id)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          editorTheme === theme.id
                            ? 'border-teal-500'
                            : theme.border
                        } ${theme.bg}`}
                      >
                        <div className="text-xs font-medium text-gray-300">{theme.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Type className="w-4 h-4 inline mr-2" />
                    Font Size: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* Toggle Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Line Numbers</span>
                    </div>
                    <button
                      onClick={() => setShowLineNumbers(!showLineNumbers)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        showLineNumbers ? 'bg-teal-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        showLineNumbers ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Type className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Word Wrap</span>
                    </div>
                    <button
                      onClick={() => setWordWrap(!wordWrap)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        wordWrap ? 'bg-teal-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        wordWrap ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Map className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Minimap</span>
                    </div>
                    <button
                      onClick={() => setMinimap(!minimap)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        minimap ? 'bg-teal-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        minimap ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Auto Save</span>
                    </div>
                    <button
                      onClick={() => setAutoSave(!autoSave)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        autoSave ? 'bg-teal-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        autoSave ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      setEditorTheme('dark');
                      setFontSize(14);
                      setWordWrap(true);
                      setShowLineNumbers(true);
                      setAutoSave(true);
                      setMinimap(false);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSettingsPanel(false)}
                      className="px-4 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 rounded transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Project Settings Panel */}
        {showProjectSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-medium text-white">Project Settings</h2>
                <button
                  onClick={() => setShowProjectSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <ProjectSettingsPanel 
                  project={mockProject}
                  className="border-0 rounded-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}