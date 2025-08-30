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
  Map as MapIcon,
  Users,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Layout,
  FilePlus,
  FolderPlus
} from 'lucide-react';

// Import our custom components
import CollaborationPanel from '@/components/collaboration/CollaborationPanel';
import ChatPanel from '@/components/collaboration/ChatPanel';
import Terminal from '@/components/ide/Terminal';
import NotificationSystem from '@/components/notifications/NotificationSystem';
import ProjectSettingsPanel from '@/components/ProjectSettingsPanel';
import LivePreview from '@/components/preview/LivePreview';
import AIAssistantPanel from '@/components/ai/AIAssistantPanel';
import { getTemplateByKey } from '@/utils/templateManager';

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

// Helper function to convert backend template files to FileNode structure
const convertBackendFilesToFileTree = (files: any[]): FileNode[] => {
  const tree: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();
  
  // Convert array of TemplateFile objects to sorted paths
  // Include both files and directories for proper tree structure
  const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path));
  
  for (const templateFile of sortedFiles) {
    // Skip if this is a directory entry from the database
    if (templateFile.type === 'directory') {
      continue; // Directories are created implicitly from file paths
    }
    
    const parts = templateFile.path.split('/');
    let currentPath = '';
    let currentLevel = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (isFile) {
        // Add file
        const fileExtension = part.split('.').pop()?.toLowerCase() || '';
        const language = getLanguageFromExtension(fileExtension);
        
        currentLevel.push({
          name: part,
          type: 'file',
          content: templateFile.content || '',
          language: language
        });
      } else {
        // Add or find folder
        let folder = currentLevel.find(node => node.name === part && node.type === 'folder');
        if (!folder) {
          folder = {
            name: part,
            type: 'folder',
            children: []
          };
          currentLevel.push(folder);
          folderMap.set(currentPath, folder);
        }
        currentLevel = folder.children!;
      }
    }
  }
  
  return tree;
};

// Helper function to find the first file in a file tree
const findFirstFile = (nodes: FileNode[], path: string = ''): { name: string; path: string; content?: string } | null => {
  for (const node of nodes) {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    if (node.type === 'file') {
      return { name: node.name, path: currentPath, content: node.content };
    } else if (node.type === 'folder' && node.children) {
      const found = findFirstFile(node.children, currentPath);
      if (found) return found;
    }
  }
  return null;
};

// Helper function to determine preview type based on framework
const determinePreviewType = (framework?: string): 'react' | 'api-docs' | 'static' | 'nextjs' => {
  if (!framework) return 'react';
  
  const fw = framework.toLowerCase();
  if (fw.includes('next')) return 'nextjs';
  if (fw.includes('react')) return 'react';
  if (fw.includes('express') || fw.includes('flask') || fw.includes('fastapi')) return 'api-docs';
  
  return 'react';
};

// Helper function to get language from file extension
const getLanguageFromExtension = (extension: string): string => {
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'css': 'css',
    'html': 'html',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'php': 'php',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'vue': 'vue',
    'svelte': 'svelte',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml'
  };
  
  return langMap[extension] || 'text';
};

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, httpClient } = useAuth();
  const [template, setTemplate] = useState<any>(null);
  const [templateConfig, setTemplateConfig] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  
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
  
  // AI Assistant is now handled by AIAssistantPanel component
  
  // Monaco Editor state  
  const [editorValue, setEditorValue] = useState('');
  
  // Pane sizes - matching the layout from the image
  const [leftPaneWidth, setLeftPaneWidth] = useState(240);
  const [rightPaneWidth, setRightPaneWidth] = useState(400);
  
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

  // Project creation state
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Auto-save status state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // File/folder creation state
  const [showCreateDialog, setShowCreateDialog] = useState<{ type: 'file' | 'folder', parentPath: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');

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

  // Dynamic file tree based on template
  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  useEffect(() => {
    const loadTemplateData = async () => {
      console.log('🔍 Editor loading with URL params:', window.location.href);
      console.log('📋 Search params:', searchParams.toString());
      console.log('Available params:', {
        projectId: searchParams.get('projectId'),
        templateKey: searchParams.get('templateKey'), 
        project: searchParams.get('project'),
        template: searchParams.get('template')
      });
      
      // Check for project data (from AI creation) first
      const projectData = searchParams.get('project');
      if (projectData) {
        try {
          const project = JSON.parse(decodeURIComponent(projectData));
          setTemplate(project);
          
          // AI welcome message is now handled by AIAssistantPanel
        } catch (e) {
          console.error('Error parsing project data:', e);
          setTemplate({ name: 'New Project', language: 'JavaScript', description: 'A new project' });
        }
        return;
      }

      // Check for projectId parameter and fetch project from backend
      const projectId = searchParams.get('projectId');
      console.log('🔍 Editor loading - projectId:', projectId, 'user:', user?.id, 'httpClient:', !!httpClient);
      
      if (projectId && user && httpClient) {
        console.log('✅ All conditions met, fetching project from backend...');
        try {
          // Fetch project details and files
          const [projectResponse, filesResponse] = await Promise.all([
            httpClient.get(`/api/projects/${projectId}`),
            httpClient.get(`/api/projects/${projectId}/files`)
          ]);
          
          if (projectResponse.success && projectResponse.data) {
            console.log('✅ Project loaded from backend:', projectResponse.data);
            const project = projectResponse.data.project || projectResponse.data;
            
            // Get project files if available
            let projectFiles = [];
            if (filesResponse.success && filesResponse.data) {
              projectFiles = filesResponse.data;
              console.log('Project files loaded:', projectFiles.length, 'files');
              if (projectFiles.length > 0) {
                console.log('File paths:', projectFiles.map((f: any) => f.path));
                console.log('First file details:', {
                  path: projectFiles[0].path,
                  hasContent: !!projectFiles[0].content,
                  contentLength: projectFiles[0].content?.length || 0,
                  contentPreview: projectFiles[0].content?.substring(0, 100)
                });
              }
            } else {
              console.log('❌ Failed to load project files:', filesResponse);
            }
            
            // If no project files, get the original template files
            if (projectFiles.length === 0 && project.template) {
              console.log('No project files found, fetching template files for:', project.template);
              try {
                const templateResponse = await httpClient.get(`/api/projects/templates/${project.template}`);
                if (templateResponse.success && templateResponse.data?.files) {
                  projectFiles = templateResponse.data.files;
                  console.log('Using template files as fallback:', projectFiles.map((f: any) => f.path));
                }
              } catch (templateError) {
                console.error('Failed to fetch template files:', templateError);
              }
            }
            
            // Set the actual project data
            setProject(project);
            
            // Convert project to template format for editor compatibility
            const templateData = {
              name: project.name,
              description: project.description,
              template: project.template,
              slug: project.slug,
              id: project.id,
              key: project.template,
              files: projectFiles,
              // Determine framework from template key
              framework: project.template?.includes('nextjs') ? 'nextjs' : 
                        project.template?.includes('react') ? 'react' :
                        project.template?.includes('express') ? 'express' :
                        project.template?.includes('flask') ? 'flask' : 'nextjs'
            };
            console.log('📝 Setting template data:', templateData);
            setTemplate(templateData);
            
            // Set project context for auto-save
            setCurrentProjectId(project.id);
            console.log('🔧 Project ID set for auto-save:', project.id);
            
            // AI welcome message is now handled by AIAssistantPanel
            return;
          } else {
            console.log('❌ Project response failed or no data:', projectResponse);
          }
        } catch (e) {
          console.error('❌ Error fetching project data:', e);
        }
      } else if (projectId) {
        console.log('⚠️ Missing requirements for project load:', {
          hasProjectId: !!projectId,
          hasUser: !!user,
          hasHttpClient: !!httpClient
        });
        // Don't continue to template fallbacks if we have a projectId
        // Wait for user/httpClient to be available
        return;
      }

      // Check for templateKey parameter and fetch template from backend
      const templateKey = searchParams.get('templateKey');
      if (templateKey && user && httpClient) {
        try {
          const response = await httpClient.get(`/api/projects/templates/${templateKey}`);
          
          if (response.success && response.data) {
            console.log('Template loaded from backend:', response.data);
            setTemplate(response.data);
            // AI welcome message is now handled by AIAssistantPanel
            return;
          }
        } catch (e) {
          console.error('Error fetching template data:', e);
        }
      }

      // Fall back to legacy template data in URL (backward compatibility)
      const templateData = searchParams.get('template');
      if (templateData) {
        try {
          const parsedTemplate = JSON.parse(decodeURIComponent(templateData));
          setTemplate(parsedTemplate);
          // AI welcome message is now handled by AIAssistantPanel
        } catch (e) {
          setTemplate({ name: 'New Project', language: 'JavaScript', description: 'A new project' });
          // AI welcome message is now handled by AIAssistantPanel
        }
      } else {
        setTemplate({ name: 'New Project', language: 'JavaScript', description: 'A new project' });
        // AI welcome message is now handled by AIAssistantPanel
      }
    };

    loadTemplateData();
  }, [searchParams, user, httpClient]);

  // Initialize template configuration and file tree
  useEffect(() => {
    if (template) {
      console.log('🔧 Processing template in useEffect:', {
        name: template.name,
        id: template.id,
        hasFiles: !!template.files,
        filesCount: template.files?.length || 0,
        key: template.key,
        slug: template.slug
      });
      let config = null;
      let fileTree: FileNode[] = [];
      
      // If template has files (from backend), use those directly
      if (template.files && Array.isArray(template.files) && template.files.length > 0) {
        console.log('✅ Using backend template files:', template.files.length, 'files');
        console.log('File details:', template.files.map((f: any) => ({
          path: f.path,
          type: f.type,
          hasContent: !!f.content,
          contentLength: f.content?.length || 0
        })));
        // Convert backend template files to FileNode structure
        fileTree = convertBackendFilesToFileTree(template.files);
        console.log('🌳 Generated file tree:', fileTree);
        
        // Create a temporary config for this template
        config = {
          key: template.key || 'backend-template',
          name: template.name || 'Template',
          category: template.category || 'fullstack',
          framework: template.framework || 'nextjs',
          previewType: determinePreviewType(template.framework),
          fileTree: fileTree
        };
      } else {
        console.log('⚠️ No backend files, checking for template configs...');
        // Fallback to frontend template configs only if this is a template, not a project
        if (template.key && !template.id) {
          console.log('Looking for template by key:', template.key);
          config = getTemplateByKey(template.key);
        } else if (template.slug && !template.id) {
          console.log('Looking for template by slug:', template.slug);
          // Try common template key mappings
          const keyMap: Record<string, string> = {
            'react-app': 'react',
            'react': 'react',
            'nodejs-express': 'nodejs-express', 
            'express-api': 'nodejs-express',
            'python-flask': 'python-flask',
            'flask-api': 'python-flask',
            'nextjs-fullstack': 'nextjs-fullstack',
            'nextjs': 'nextjs-fullstack'
          };
          const mappedKey = keyMap[template.slug] || keyMap[template.name?.toLowerCase()];
          if (mappedKey) {
            config = getTemplateByKey(mappedKey);
          }
        }

        // Only default to React template if this is not a project from the repository
        if (!config && !template.id) {
          console.log('⚠️ No template config found, defaulting to React template');
          config = getTemplateByKey('react');
        } else if (!config && template.id) {
          // This is a project from repository, create minimal config
          console.log('📁 Creating config for repository project:', template.name);
          config = {
            key: 'custom-project',
            name: template.name || 'Project',
            category: 'fullstack',
            framework: 'react',
            previewType: 'react',
            fileTree: []
          };
        }
        
        if (config) {
          fileTree = config.fileTree;
        }
      }

      if (config) {
        setTemplateConfig(config);
        setFileTree(fileTree);

        // Update open tabs based on template
        const defaultFile = config.previewType === 'react' ? 'src/App.js' : 
                          config.previewType === 'nextjs' ? 'app/page.tsx' :
                          config.previewType === 'api-docs' ? (
                            config.framework === 'flask' ? 'app.py' : 'src/server.js'
                          ) : 'README.md';

        // Only set default file if it exists in the tree or if we have no files
        const hasFiles = fileTree.length > 0;
        if (hasFiles) {
          // Find first actual file in tree
          const firstFile = findFirstFile(fileTree);
          if (firstFile) {
            setOpenTabs([
              { id: firstFile.path, name: firstFile.name, type: 'file', icon: Code2 },
              { id: 'ai-chat', name: 'AI Assistant', type: 'chat', icon: MessageSquare }
            ]);
            setActiveTab(firstFile.path);
          } else {
            // No files found, use default
            setOpenTabs([
              { id: 'ai-chat', name: 'AI Assistant', type: 'chat', icon: MessageSquare }
            ]);
            setActiveTab('ai-chat');
          }
        } else {
          setOpenTabs([
            { id: defaultFile, name: defaultFile.split('/').pop() || 'file', type: 'file', icon: Code2 },
            { id: 'ai-chat', name: 'AI Assistant', type: 'chat', icon: MessageSquare }
          ]);
          setActiveTab(defaultFile);
        }
      } else if (fileTree.length > 0) {
        // We have files but no config (e.g., project from repository)
        console.log('📂 Setting file tree without config:', fileTree.length, 'items');
        setFileTree(fileTree);
        
        // Find first file to open
        const firstFile = findFirstFile(fileTree);
        if (firstFile) {
          setOpenTabs([
            { id: firstFile.path, name: firstFile.name, type: 'file', content: firstFile.content, icon: Code2 },
            { id: 'ai-chat', name: 'AI Assistant', type: 'chat', icon: MessageSquare }
          ]);
          setActiveTab(firstFile.path);
        }
      }
    }
  }, [template]);

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
        const calculatedWidth = e.clientX - toolsSidebarWidth;
        
        // Ensure left panel stays within reasonable bounds
        // Min: 200px, Max: 40% of screen width
        const maxLeftWidth = Math.floor(window.innerWidth * 0.4);
        const newWidth = Math.max(200, Math.min(maxLeftWidth, calculatedWidth));
        
        // Debug logging for left panel resize
        console.log('Left panel resize:', { clientX: e.clientX, calculatedWidth, finalWidth: newWidth });
        
        setLeftPaneWidth(newWidth);
      } else if (isDraggingRight && showRightPane) {
        // Calculate new width for right panel based on mouse position
        // When dragging RIGHT (increasing Monaco): e.clientX increases, rightPanel should DECREASE
        // When dragging LEFT (decreasing Monaco): e.clientX decreases, rightPanel should INCREASE
        const calculatedWidth = window.innerWidth - e.clientX;
        
        // Calculate available space (accounting for left panel and tools sidebar)
        const toolsSidebarWidth = 48;
        const currentLeftWidth = showLeftPane ? leftPaneWidth : 0;
        const availableWidth = window.innerWidth - toolsSidebarWidth - currentLeftWidth;
        
        // Monaco editor needs minimum width (let's say 300px)
        const minMonacoWidth = 300;
        const maxRightWidth = Math.max(200, availableWidth - minMonacoWidth);
        
        // Right panel minimum width - allow it to get quite small to maximize Monaco space
        const minRightWidth = 150;
        const newWidth = Math.max(minRightWidth, Math.min(maxRightWidth, calculatedWidth));
        
        // Debug logging for right panel resize  
        console.log('🔴 RIGHT PANEL RESIZE:', { 
          clientX: e.clientX, 
          windowWidth: window.innerWidth,
          calculatedWidth, 
          availableWidth,
          maxRightWidth,
          minRightWidth,
          finalWidth: newWidth,
          currentWidth: rightPaneWidth,
          direction: newWidth > rightPaneWidth ? 'expanding' : 'shrinking',
          isAtMinimum: newWidth === minRightWidth,
          isAtMaximum: newWidth === maxRightWidth,
          leftPanelWidth: currentLeftWidth,
          willUpdate: newWidth !== rightPaneWidth
        });
        
        setRightPaneWidth(newWidth);
      } else if (isDraggingBottom && showBottomPanel) {
        const headerHeight = 40; // Approximate header height
        const newHeight = Math.max(200, Math.min(600, window.innerHeight - e.clientY - headerHeight));
        setBottomPanelHeight(newHeight);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      console.log('🟢 Mouse up at clientX:', e.clientX, 'Was dragging right:', isDraggingRight, 'Was dragging left:', isDraggingLeft);
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

  // Force Monaco Editor to resize when pane sizes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if ((window as any).monacoEditor) {
        (window as any).monacoEditor.layout();
      }
    }, 100); // Small delay to ensure DOM has updated

    return () => clearTimeout(timeoutId);
  }, [leftPaneWidth, rightPaneWidth, showLeftPane, showRightPane]);

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

  // Create project from template
  const createProject = async () => {
    if (!httpClient || !template || !projectName.trim()) return;
    
    setIsCreatingProject(true);
    try {
      const response = await httpClient.post('/api/projects', {
        name: projectName.trim(),
        description: projectDescription.trim(),
        template: template.key || template.slug || template.name,
        isPublic: false
      });

      if (response.success && response.data) {
        const newProjectId = response.data.project?.id || response.data.id;
        setCurrentProjectId(newProjectId);
        setShowCreateProjectModal(false);
        setProjectName('');
        setProjectDescription('');
        
        // Redirect to project editor
        router.push(`/editor?projectId=${newProjectId}`);
        
        // Show success toast notification (will show after redirect)
        if ((window as any).addNotification) {
          (window as any).addNotification({
            type: 'success',
            title: 'Project Created Successfully!',
            message: `"${projectName}" is now a project with auto-save enabled.`,
            persistent: true,
            actions: [
              {
                label: 'View in Workspace',
                action: () => router.push('/workspace'),
                type: 'primary'
              },
              {
                label: 'Continue Editing',
                action: () => {},
                type: 'secondary'
              }
            ]
          });
        } else {
          // Fallback alert if notification system not loaded
          alert(`Project "${projectName}" created successfully! Your changes will now auto-save.`);
        }
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  // AI messaging is now handled by AIAssistantPanel component

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

  // Create new file or folder
  const createNewItem = async (type: 'file' | 'folder', name: string, parentPath: string = '') => {
    if (!name.trim() || !httpClient) return;

    // Validate file/folder name
    const invalidChars = /[<>:"/\\|?*\0]/;
    if (invalidChars.test(name)) {
      alert('File/folder names cannot contain: < > : " / \\ | ? *');
      return;
    }

    try {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      
      if (type === 'file') {
        // Create new file
        const response = await httpClient.put(`/api/files/projects/${project?.id}/files/${encodeURIComponent(fullPath)}`, {
          content: '',
          encoding: 'utf8'
        });

        if (response.success) {
          // Add file to file tree
          const newFile: FileNode = {
            name,
            type: 'file',
            content: ''
          };
          
          // Update file tree by adding to the appropriate parent
          setFileTree(prevTree => addNodeToTree(prevTree, parentPath, newFile));
          
          // Open the new file in editor
          openFile(newFile, fullPath);
        }
      } else {
        // Create new folder (just update UI - folder will be created when files are added)
        const newFolder: FileNode = {
          name,
          type: 'folder',
          children: []
        };
        
        setFileTree(prevTree => addNodeToTree(prevTree, parentPath, newFolder));
        
        // Expand the parent folder and the new folder
        if (parentPath) {
          setExpandedFolders(prev => new Set([...prev, parentPath, fullPath]));
        } else {
          setExpandedFolders(prev => new Set([...prev, fullPath]));
        }
      }
      
      setShowCreateDialog(null);
      setNewItemName('');
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
    }
  };

  // Helper function to add a node to the file tree at the correct location
  const addNodeToTree = (tree: FileNode[], parentPath: string, newNode: FileNode): FileNode[] => {
    if (!parentPath) {
      // Add to root
      return [...tree, newNode].sort((a, b) => {
        // Folders first, then files
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    }

    return tree.map(node => {
      const nodePath = node.name;
      if (nodePath === parentPath.split('/')[0]) {
        if (parentPath.includes('/')) {
          // Deeper nesting
          const remainingPath = parentPath.substring(parentPath.indexOf('/') + 1);
          return {
            ...node,
            children: node.children ? addNodeToTree(node.children, remainingPath, newNode) : [newNode]
          };
        } else {
          // Direct child
          const updatedChildren = [...(node.children || []), newNode].sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          return { ...node, children: updatedChildren };
        }
      }
      return node;
    });
  };

  const renderFileTree = (nodes: FileNode[], parentPath: string = '') => {
    return nodes.map((node) => {
      const path = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.has(path);
        return (
          <div key={path}>
            <div
              className="group flex items-center space-x-1 px-2 py-1 hover:bg-gray-800 cursor-pointer rounded text-sm"
              onClick={() => toggleFolder(path)}
              onContextMenu={(e) => {
                e.preventDefault();
                // Show context menu for folder
                setShowCreateDialog({ type: 'file', parentPath: path });
              }}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-300">{node.name}</span>
              {/* Quick create buttons on hover */}
              <div className="ml-auto opacity-0 group-hover:opacity-100 flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateDialog({ type: 'file', parentPath: path });
                    setNewItemName('');
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="New File"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateDialog({ type: 'folder', parentPath: path });
                    setNewItemName('');
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="New Folder"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
              </div>
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
  
  // Project data for components - use real project if loaded, otherwise fallback to mock
  const projectData = project || {
    id: template?.slug || template?.id || 'ai-project',
    name: template?.name || 'AI Project',
    description: template?.description || 'AI Generated Project',
    isPublic: false,
    ownerId: user?.id || 'current-user',
    status: 'active' as const,
    branch: 'main',
    storageUsed: 0,
    storageLimit: 1024 * 1024 * 1024, // 1GB
    createdAt: project?.createdAt || new Date(),
    updatedAt: project?.updatedAt || new Date(),
    lastAccessedAt: project?.lastAccessedAt || new Date(),
    members: project?.members || [
      {
        id: 'member-1',
        projectId: template?.slug || template?.id || 'ai-project',
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
    settings: project?.settings || {},
    environment: project?.environment || {},
    slug: project?.slug || template?.slug || 'ai-project',
    template: project?.template || template?.template || 'ai-generated'
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
              <span className="text-sm font-medium">{project?.name || template?.name || 'Untitled'}</span>
              {template?.createdBy === 'ai' && (
                <span className="text-xs px-2 py-0.5 bg-purple-600/20 border border-purple-600/30 rounded text-purple-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Generated</span>
                </span>
              )}
              <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400">{project?.template || template?.language || 'JavaScript'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              {autoSaveStatus === 'saving' && (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400">Saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-green-400">Saved</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  <span className="text-red-400">Error</span>
                </>
              )}
            </div>
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
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {activeLeftTool === 'files' && 'Explorer'}
                    {activeLeftTool === 'search' && 'Search'}
                    {activeLeftTool === 'git' && 'Source Control'}
                    {activeLeftTool === 'collaboration' && 'Collaboration'}
                    {activeLeftTool === 'extensions' && 'Extensions'}
                  </div>
                  {activeLeftTool === 'files' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setShowCreateDialog({ type: 'file', parentPath: '' });
                          setNewItemName('');
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="New File"
                      >
                        <FilePlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateDialog({ type: 'folder', parentPath: '' });
                          setNewItemName('');
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="New Folder"
                      >
                        <FolderPlus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
                    projectId={projectData.id}
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
              className={`absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors z-20 ${
                isDraggingLeft ? 'bg-teal-500' : 'hover:bg-teal-500/50 bg-transparent'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingLeft(true);
              }}
              style={{ touchAction: 'none', right: '-0.5px' }}
              title="Drag to resize left panel"
            />
          </div>
          )}

          {/* Middle Pane - Tabbed Interface */}
          <div className="flex-1 flex flex-col bg-gray-900 relative min-w-0" style={{ minWidth: '300px' }}>
            {/* Left resize handle for Monaco editor */}
            {showLeftPane && (
              <div
                className={`absolute top-0 left-0 h-full cursor-col-resize transition-all z-30 ${
                  isDraggingLeft 
                    ? 'bg-teal-500 shadow-lg' 
                    : 'hover:bg-teal-500/50 hover:shadow-md bg-transparent'
                }`}
                style={{ width: '4px', touchAction: 'none', left: '-2px' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Starting left drag at clientX:', e.clientX);
                  setIsDraggingLeft(true);
                }}
                title="Drag to resize left panel (adjust Monaco editor width)"
              />
            )}
            {/* Right resize handle for Monaco editor */}
            {showRightPane && (
              <div
                className={`absolute top-0 right-0 h-full cursor-col-resize transition-all z-30 ${
                  isDraggingRight 
                    ? 'bg-teal-500 shadow-lg' 
                    : 'hover:bg-teal-500/50 hover:shadow-md bg-transparent'
                }`}
                style={{ width: '4px', touchAction: 'none', right: '-2px' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔵 Starting RIGHT drag at clientX:', e.clientX, 'Current right panel width:', rightPaneWidth);
                  setIsDraggingRight(true);
                }}
                title="Drag to resize right panel (adjust Monaco editor width)"
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
                <AIAssistantPanel
                  projectId={projectData.id}
                  currentFile={activeTab !== 'ai-chat' ? activeTab : undefined}
                  selectedCode={undefined} // TODO: Get selected code from Monaco editor
                  fileContent={editorValue}
                  className="h-full"
                />
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
                      {/* Save as Project button - only show for templates */}
                      {!currentProjectId && template && (
                        <button
                          onClick={() => {
                            setProjectName(template.name || 'My Project');
                            setProjectDescription(template.description || '');
                            setShowCreateProjectModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            editorTheme === 'dark' ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' :
                            editorTheme === 'light' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                            'bg-blue-600/30 text-blue-300 hover:bg-blue-600/40'
                          }`}
                          title="Save template as a new project"
                        >
                          <Save className="w-3 h-3 inline mr-1" />
                          Save as Project
                        </button>
                      )}
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
                        <MapIcon className="w-3 h-3" />
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
                          
                          // Auto-save if enabled and we have a project context
                          if (autoSave && currentProjectId && httpClient) {
                            // Show saving indicator immediately when user types
                            setAutoSaveStatus('saving');
                            
                            // Debounced auto-save with 2 second delay
                            clearTimeout((window as any).autoSaveTimeout);
                            (window as any).autoSaveTimeout = setTimeout(async () => {
                              try {
                                console.log(`Auto-saving ${activeTabData.name} to project ${currentProjectId}...`);
                                
                                // Use the correct API endpoint for updating project files
                                const filePath = activeTabData.id; // Use the full path from tab ID
                                const response = await httpClient.put(`/api/files/projects/${currentProjectId}/files/${encodeURIComponent(filePath)}`, {
                                  content: value || '',
                                  encoding: 'utf8'
                                });
                                
                                if (response.success) {
                                  console.log(`✅ Auto-saved ${activeTabData.name}`);
                                  setAutoSaveStatus('saved');
                                } else {
                                  console.error('❌ Auto-save failed:', response.error);
                                  setAutoSaveStatus('error');
                                }
                              } catch (error) {
                                console.error('❌ Auto-save error:', error);
                                setAutoSaveStatus('error');
                              }
                            }, 2000);
                          }
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
                      onMount={(editor, monaco) => {
                        // Store editor reference for manual layout updates
                        (window as any).monacoEditor = editor;
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
            {/* Resize handle - REMOVED DUPLICATE: Monaco editor handles right panel resizing */}
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
                    previewType={templateConfig?.previewType || 'react'}
                    templateKey={template?.key || template?.template || templateConfig?.key}
                    className="h-full -m-4"
                  />
                )}
                
                {activeRightTab === 'collaboration' && (
                  <CollaborationPanel 
                    projectId={projectData.id}
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
                  <Terminal 
                    className="h-full" 
                    projectId={project?.id || (templateKey ? 'template' : undefined)}
                  />
                )}
                {activeBottomTab === 'team-chat' && (
                  <ChatPanel 
                    projectId={projectData.id}
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
                      <MapIcon className="w-4 h-4 text-gray-400" />
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
                  project={projectData}
                  className="border-0 rounded-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateProjectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 w-full max-w-md mx-4 ${
              editorTheme === 'dark' ? 'bg-gray-800 text-white' :
              editorTheme === 'light' ? 'bg-white text-gray-900' :
              'bg-gray-900 text-gray-100'
            }`}>
              <h2 className="text-lg font-semibold mb-4">Create Project from Template</h2>
              <p className={`text-sm mb-4 ${
                editorTheme === 'dark' ? 'text-gray-300' :
                editorTheme === 'light' ? 'text-gray-600' :
                'text-gray-400'
              }`}>
                Save this template as a project to enable auto-save and collaboration features.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    editorTheme === 'dark' ? 'text-gray-300' :
                    editorTheme === 'light' ? 'text-gray-700' :
                    'text-gray-400'
                  }`}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editorTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' :
                      editorTheme === 'light' ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500' :
                      'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                    }`}
                    maxLength={100}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    editorTheme === 'dark' ? 'text-gray-300' :
                    editorTheme === 'light' ? 'text-gray-700' :
                    'text-gray-400'
                  }`}>
                    Description (optional)
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe your project"
                    rows={3}
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      editorTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' :
                      editorTheme === 'light' ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500' :
                      'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                    }`}
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateProjectModal(false);
                    setProjectName('');
                    setProjectDescription('');
                  }}
                  disabled={isCreatingProject}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    editorTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' :
                    editorTheme === 'light' ? 'text-gray-600 hover:bg-gray-100' :
                    'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={isCreatingProject || !projectName.trim()}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isCreatingProject || !projectName.trim()
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isCreatingProject ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Create Project</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create File/Folder Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg w-80">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white">
                  Create New {showCreateDialog.type === 'file' ? 'File' : 'Folder'}
                </h3>
                {showCreateDialog.parentPath && (
                  <p className="text-sm text-gray-400 mt-1">
                    in {showCreateDialog.parentPath}
                  </p>
                )}
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {showCreateDialog.type === 'file' ? 'File' : 'Folder'} Name
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={showCreateDialog.type === 'file' ? 'index.js' : 'components'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newItemName.trim()) {
                        createNewItem(showCreateDialog.type, newItemName.trim(), showCreateDialog.parentPath);
                      } else if (e.key === 'Escape') {
                        setShowCreateDialog(null);
                        setNewItemName('');
                      }
                    }}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateDialog(null);
                      setNewItemName('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createNewItem(showCreateDialog.type, newItemName.trim(), showCreateDialog.parentPath)}
                    disabled={!newItemName.trim()}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center space-x-2 ${
                      !newItemName.trim()
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {showCreateDialog.type === 'file' ? <FilePlus className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                    <span>Create</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}