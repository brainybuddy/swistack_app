'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { SocketProvider } from '@/contexts/SocketContext';
import SaveTemplateAsProjectModal from '@/components/SaveTemplateAsProjectModal';
import LogoutModal from '@/components/LogoutModal';
import ProjectCreatedDialog from '@/components/ProjectCreatedDialog';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeft, 
  Code2, 
  Save, 
  Play, 
  Settings,
  FolderTree,
  LogOut,
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
  Layout
} from 'lucide-react';

// Import our custom components
import CollaborationPanel from '@/components/collaboration/CollaborationPanel';
import ChatPanel from '@/components/collaboration/ChatPanel';
import AIAssistantEnhanced from '@/components/ai/AIAssistantEnhanced';
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
  const { user, httpClient, logout } = useAuth();
  const [template, setTemplate] = useState<any>(null);
  
  // Template restriction state
  const [isTemplate, setIsTemplate] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [restrictedFeatureRequested, setRestrictedFeatureRequested] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdProjectName, setCreatedProjectName] = useState('');
  
  // Logout state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Tools state
  const [activeLeftTool, setActiveLeftTool] = useState<'files' | 'search' | 'git' | 'collaboration' | 'extensions'>('files');
  const [rightPaneTabs, setRightPaneTabs] = useState<Array<{id: string, label: string, icon: any}>>([
    { id: 'preview', label: 'Preview', icon: Monitor },
    { id: 'collaboration', label: 'Collaboration', icon: Users }
  ]);
  const [activeRightTab, setActiveRightTab] = useState<string>('preview');
  
  // Editor state - Start with AI Assistant for templates, file for projects
  const [openTabs, setOpenTabs] = useState<Tab[]>([
    { id: 'ai-chat', name: 'AI Assistant', type: 'chat', icon: MessageSquare }
  ]);
  const [activeTab, setActiveTab] = useState<string>('ai-chat');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/app']));
  
  // Chat state
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Monaco Editor state  
  const [editorValue, setEditorValue] = useState('');
  
  // Pane sizes - force new default widths
  const [leftPaneWidth, setLeftPaneWidth] = useState(199);
  const [rightPaneWidth, setRightPaneWidth] = useState(799);
  
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
  // Dev server state
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [devStatus, setDevStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [devError, setDevError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [devLogs, setDevLogs] = useState<string[]>([]);

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

  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  // Fetch dev server status for projects on load/switch
  useEffect(() => {
    const projectId = (template as any)?.id;
    if (!projectId || isTemplate) {
      setDevStatus('stopped');
      setDevUrl(null);
      return;
    }
    (async () => {
      try {
        const res = await httpClient.get(`/api/devserver/status/${projectId}`);
        if (res.success) {
          const data: any = (res as any).data;
          setDevStatus(data.status === 'running' ? 'running' : 'stopped');
          setDevUrl(data.url || null);
        }
      } catch {}
    })();
  }, [template, isTemplate, httpClient]);

  // Auto-start dev server once when entering a project editor if not running
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (isTemplate || autoStartedRef.current) return;
    const projectId = (template as any)?.id;
    if (!projectId) return;
    (async () => {
      try {
        const st = await httpClient.get(`/api/devserver/status/${projectId}`);
        if (st.success) {
          const d: any = (st as any).data;
          if (d.status !== 'running') {
            autoStartedRef.current = true;
            setDevStatus('starting');
            await httpClient.post(`/api/devserver/start/${projectId}`);
          }
        }
      } catch {/* ignore */}
    })();
  }, [isTemplate, template, httpClient]);

  const startDevServer = async () => {
    const projectId = (template as any)?.id;
    if (!projectId || isTemplate) return;
    try {
      setDevError(null);
      setDevStatus('starting');
      const res = await httpClient.post(`/api/devserver/start/${projectId}`);
      if (res.success) {
        const data: any = (res as any).data;
        if (data?.url) setDevUrl(data.url);
        // Check status once after starting
        const st = await httpClient.get(`/api/devserver/status/${projectId}`);
        if (st.success) {
          const d: any = (st as any).data;
          setDevStatus(d.status === 'running' ? 'running' : 'starting');
          if (d.url) setDevUrl(d.url);
        }
      } else {
        setDevStatus('error');
        setDevError(res.error || 'Failed to start development server');
      }
    } catch (e: any) {
      setDevStatus('error');
      setDevError(e?.message || 'Failed to start development server');
    }
  };

  const stopDevServer = async () => {
    const projectId = (template as any)?.id;
    if (!projectId || isTemplate) return;
    try {
      setDevError(null);
      const res = await httpClient.post(`/api/devserver/stop/${projectId}`);
      if (res.success) {
        setDevStatus('stopped');
        setDevUrl(null);
      } else {
        setDevStatus('error');
        setDevError(res.error || 'Failed to stop development server');
      }
    } catch (e: any) {
      setDevStatus('error');
      setDevError(e?.message || 'Failed to stop development server');
    }
  };

  // Logs: poll when modal is open
  useEffect(() => {
    if (!showLogs || isTemplate) return;
    const projectId = (template as any)?.id;
    if (!projectId) return;

    let cancelled = false;
    const fetchLogs = async () => {
      try {
        const res = await httpClient.get(`/api/devserver/logs/${projectId}`);
        if (res.success && !cancelled) {
          const data: any = (res as any).data;
          setDevLogs(data.logs || []);
          if (data.url) setDevUrl(data.url);
          // Only advance status forward; don't downgrade starting -> stopped
          if (data.status === 'running' && devStatus !== 'running') {
            setDevStatus('running');
          }
        }
      } catch {}
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [showLogs, isTemplate, template, httpClient, devStatus]);

  // While starting, poll status periodically until running
  useEffect(() => {
    if (isTemplate) return;
    const projectId = (template as any)?.id;
    if (!projectId) return;
    if (devStatus !== 'starting') return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await httpClient.get(`/api/devserver/status/${projectId}`);
        if (!res.success) return;
        const data: any = (res as any).data;
        if (cancelled) return;
        if (data.status === 'running') {
          setDevStatus('running');
          setDevUrl(data.url || null);
          clearInterval(interval);
        }
      } catch {/* ignore */}
    }, 2000);

    return () => { cancelled = true; clearInterval(interval); };
  }, [devStatus, isTemplate, template, httpClient]);
  
  // Fetch project file tree for saved projects
  const fetchProjectFileTree = async (projectId: string) => {
    try {
      console.log('📁 Fetching project file tree for:', projectId);
      const res = await httpClient.get(`/api/files/projects/${projectId}/tree`);
      if (!res.success || !(res as any)?.data?.files) {
        console.warn('No files returned for project:', res.error);
        return;
      }

      const files = (res as any).data.files as Array<{ path: string; type: 'file' | 'directory'; content?: string }>;

      // Optional: ensure files match template definition by merging any missing template files
      let mergedFlat = [...files];
      const templateKey = (template as any)?.template as string | undefined;
      if (templateKey) {
        try {
          const tplRes = await httpClient.post('/api/projects/templates/full-data', { templateKey });
          if (tplRes.success && tplRes.data?.files) {
            const dbPaths = new Set(mergedFlat.map(f => f.path));
            const tplFiles = tplRes.data.files as Array<{ path: string; type: 'file' | 'directory'; content?: string }>;
            for (const tf of tplFiles) {
              if (!dbPaths.has(tf.path)) {
                mergedFlat.push({ path: tf.path, type: tf.type, content: tf.content });
                dbPaths.add(tf.path);
              }
            }
          }
        } catch (e) {
          console.warn('Template merge skipped due to error:', e);
        }
      }

      // Reuse converter: turn flat list into nested FileNode tree
      const buildTreeFromFlat = (flat: typeof files): FileNode[] => {
        const pathMap = new Map<string, FileNode>();
        const roots: FileNode[] = [];

        flat.forEach((entry) => {
          const parts = entry.path.split('/');
          let currentPath = '';

          parts.forEach((part, index) => {
            const prevPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!pathMap.has(currentPath)) {
              const isFile = index === parts.length - 1 && entry.type === 'file';
              const node: FileNode = {
                name: part,
                type: isFile ? 'file' : 'folder',
                content: isFile ? entry.content : undefined,
                children: isFile ? undefined : [],
                language: isFile ? (currentPath.endsWith('.tsx') ? 'typescript' : currentPath.endsWith('.js') ? 'javascript' : currentPath.endsWith('.css') ? 'css' : currentPath.endsWith('.html') ? 'html' : 'text') : undefined,
              };
              pathMap.set(currentPath, node);

              if (prevPath) {
                const parent = pathMap.get(prevPath);
                if (parent && parent.children) parent.children.push(node);
              } else {
                roots.push(node);
              }
            }
          });
        });

        return roots;
      };

      const tree = buildTreeFromFlat(mergedFlat);
      setFileTree(tree);
      // Do not auto-open any code file; keep AI Assistant as the only open tab
      setOpenTabs([{ id: 'ai-chat', name: 'AI Assistant', type: 'chat', icon: MessageSquare }]);
      setActiveTab('ai-chat');
    } catch (err) {
      console.error('Failed to fetch project file tree:', err);
    }
  };

  // Function to fetch full template data via POST to avoid 431 errors
  const fetchTemplateData = async (templateKey: string) => {
    try {
      console.log('🔍 Fetching template data for key:', templateKey);
      const response = await httpClient.post('/api/projects/templates/full-data', {
        templateKey: templateKey
      });
      
      if (response.success && response.data) {
        console.log('✅ Received template data:', response.data.name);
        setTemplate(response.data);
        setMessages([
          { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
        ]);
      } else {
        console.error('❌ Failed to fetch template data:', response.error);
        // Fall back to basic template
        setTemplate({ 
          name: 'Template Project', 
          language: 'TypeScript', 
          description: 'A template project',
          key: templateKey 
        });
      }
    } catch (error) {
      console.error('❌ Error fetching template data:', error);
      // Fall back to basic template
      setTemplate({ 
        name: 'Template Project', 
        language: 'TypeScript', 
        description: 'A template project',
        key: templateKey 
      });
    }
  };

  useEffect(() => {
    // Check for project data (from AI creation) first
    const projectData = searchParams.get('project');
    if (projectData) {
      try {
        const project = JSON.parse(decodeURIComponent(projectData));
        setTemplate(project);
        setIsTemplate(false); // This is a project, not a template
        // Load project files from backend
        if (project?.id) {
          fetchProjectFileTree(project.id);
        }
        
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
      // Handle template key - fetch full template data via POST to avoid 431 errors
      const templateKey = searchParams.get('templateKey');
      if (templateKey) {
        setIsTemplate(true); // This is a template
        fetchTemplateData(templateKey);
      } else {
        // Fall back to legacy template data (deprecated)
        const templateData = searchParams.get('template');
        if (templateData) {
          try {
            const parsedTemplate = JSON.parse(decodeURIComponent(templateData));
            setTemplate(parsedTemplate);
            setIsTemplate(true); // This is a template
            setMessages([
              { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
            ]);
          } catch (e) {
            console.error('Template parsing error:', e);
            setTemplate({ name: 'Default Template', language: 'TypeScript', description: 'Project template' });
            setIsTemplate(true);
            setMessages([
              { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
            ]);
          }
        } else {
          // Final fallback: if a projectId is present, treat as project and fetch from backend
          const projectId = searchParams.get('projectId');
          if (projectId) {
            console.log('🔗 Detected projectId without project payload. Loading project tree...');
            setIsTemplate(false);
            fetchProjectFileTree(projectId);
            setTemplate({ name: 'Project', language: 'JavaScript', slug: projectId, id: projectId });
            setMessages([
              { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
            ]);
          } else {
            setTemplate({ name: 'Default Template', language: 'TypeScript', description: 'Project template' });
            setIsTemplate(true);
            setMessages([
              { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you write code, debug issues, and answer questions about your project.' }
            ]);
          }
        }
      }
    }
  }, [searchParams]);

  // Convert template files to fileTree structure (for templates opened directly)
  useEffect(() => {
    console.log('Template conversion useEffect triggered:', { template, hasFiles: template?.files, isArray: Array.isArray(template?.files) });
    if (template && template.files && Array.isArray(template.files)) {
      const convertTemplateToFileTree = (templateFiles: any[]): FileNode[] => {
        const buildTree = (files: any[]): FileNode[] => {
          const pathMap = new Map<string, FileNode>();
          const rootNodes: FileNode[] = [];

          // First pass: create all nodes
          files.forEach((file) => {
            const parts = file.path.split('/');
            let currentPath = '';
            
            parts.forEach((part: string, index: number) => {
              const previousPath = currentPath;
              currentPath = currentPath ? `${currentPath}/${part}` : part;
              
              if (!pathMap.has(currentPath)) {
                const isFile = index === parts.length - 1 && file.type === 'file';
                const node: FileNode = {
                  name: part,
                  type: isFile ? 'file' : 'folder',
                  language: isFile ? (file.path.endsWith('.tsx') ? 'typescript' : file.path.endsWith('.js') ? 'javascript' : file.path.endsWith('.css') ? 'css' : 'text') : undefined,
                  content: isFile ? file.content : undefined,
                  children: isFile ? undefined : []
                };
                pathMap.set(currentPath, node);
                
                if (previousPath) {
                  const parent = pathMap.get(previousPath);
                  if (parent && parent.children) {
                    parent.children.push(node);
                  }
                } else {
                  rootNodes.push(node);
                }
              }
            });
          });

          return rootNodes;
        };

        return buildTree(templateFiles);
      };

      const templateFiles = template.files || [];
      const newFileTree = convertTemplateToFileTree(templateFiles);
      setFileTree(newFileTree);
      // Do not auto-open any code file; only AI Assistant should be open/active
      setOpenTabs([{ id: 'ai-chat', name: 'AI Assistant', type: 'chat', icon: MessageSquare }]);
      setActiveTab('ai-chat');
    }
  }, [template, isTemplate]);

  // Lazy-load file content when opening a file without content (projects)
  const loadProjectFileContent = async (path: string) => {
    try {
      const projectId = template?.id;
      if (!projectId) return null;
      const safePath = path.split('/').map(encodeURIComponent).join('/');
      const res = await httpClient.get(`/api/files/projects/${projectId}/files/${safePath}`);
      if (res.success && (res as any).data?.file) {
        const content = (res as any).data.file.content || '';
        // Update tree with content
        const updateContent = (nodes: FileNode[], prefix = ''): FileNode[] => nodes.map(n => {
          const p = prefix ? `${prefix}/${n.name}` : n.name;
          if (n.type === 'file' && p === path) return { ...n, content };
          if (n.type === 'folder' && n.children) return { ...n, children: updateContent(n.children, p) };
          return n;
        });
        setFileTree(prev => updateContent(prev));
        return content;
      }
    } catch (err) {
      console.error('Failed to load file content:', path, err);
    }
    return null;
  };

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

  // Ensure preview has content: prefetch main Next.js page for projects
  const [prefetchedMainPage, setPrefetchedMainPage] = useState(false);
  useEffect(() => {
    if (isTemplate || prefetchedMainPage || !template?.id || fileTree.length === 0) return;

    // Preferred Next.js entry files
    const candidates = [
      'src/app/page.tsx',
      'app/page.tsx',
      'src/pages/index.tsx',
      'pages/index.tsx'
    ];

    const target = candidates.find((p) => {
      const node = findFileByPath(fileTree, p);
      return !!node; // exists in tree
    });

    if (!target) return;

    const node = findFileByPath(fileTree, target);
    if (!node || node.type !== 'file') return;

    // If content is missing or empty, fetch it so LivePreview can render it
    if (!node.content || node.content.length === 0) {
      loadProjectFileContent(target).finally(() => setPrefetchedMainPage(true));
    } else {
      setPrefetchedMainPage(true);
    }
  }, [isTemplate, template?.id, fileTree]);


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

  const openFile = async (file: FileNode, path: string) => {
    const tabId = path;
    const existingTab = openTabs.find(t => t.id === tabId);
    
    // Ensure content is loaded for project files
    let content = file.content;
    if ((!content || content.length === 0) && !isTemplate) {
      const loaded = await loadProjectFileContent(path);
      if (loaded !== null) content = loaded;
    }

    if (!existingTab) {
      setOpenTabs([...openTabs, { id: tabId, name: file.name, type: 'file', content: content || '', icon: File }]);
    }
    setActiveTab(tabId);
    setEditorValue(content || '');
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

  // Template restriction functions
  const checkTemplateRestriction = (featureName: string): boolean => {
    if (isTemplate) {
      setRestrictedFeatureRequested(featureName);
      setShowSaveModal(true);
      return false;
    }
    return true;
  };

  const handleSaveAsProject = async (projectName: string) => {
    try {
      const response = await httpClient.post('/api/projects', {
        name: projectName,
        description: template?.description || 'Project created from template',
        template: template?.key || template?.slug || 'custom',
        isPublic: false,
        files: template?.files || []
      });

      if (response.success && response.data) {
        // Normalize project from API shape { project } vs direct
        const createdProject: any = (response as any).data.project || (response as any).data;
        setIsTemplate(false);
        setShowSaveModal(false);
        setRestrictedFeatureRequested(null);
        
        // Update the URL to reflect this is now a project
        const newUrl = `/editor?project=${encodeURIComponent(JSON.stringify(createdProject))}`;
        window.history.replaceState({}, '', newUrl);
        
        // Try to start the dev server automatically (Nix-based if available)
        try {
          if (createdProject?.id) {
            await httpClient.post(`/api/devserver/start/${createdProject.id}`);
          }
        } catch (e) {
          console.warn('Dev server auto-start failed (non-blocking):', e);
        }
        
        // Show success dialog
        setCreatedProjectName(projectName);
        setShowSuccessDialog(true);
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  // Logout functions
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
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
    id: (template as any)?.id || template?.slug || 'ai-project',
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

  // Prefer real project ID from template or URL param for socket tools
  // Derive the real DB project ID (UUID) for sockets/tools
  const rawProjectId = ((template as any)?.id as string) || (searchParams.get && (searchParams.get('projectId') || '')) || '';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const projectIdForSocket = uuidRegex.test(rawProjectId) ? rawProjectId : undefined;

  return (
    <ProtectedRoute requireAuth={true}>
      <SocketProvider projectId={projectIdForSocket}>
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
              {isTemplate && (
                <span className="text-xs px-2 py-0.5 bg-orange-600/20 border border-orange-600/30 rounded text-orange-400 flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>Template</span>
                </span>
              )}
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
            {isTemplate ? (
              <button 
                onClick={() => setShowSaveModal(true)}
                className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 rounded transition-colors flex items-center space-x-1"
              >
                <Save className="w-3 h-3" />
                <span>Save as Project</span>
              </button>
            ) : (
              <>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Saved</span>
                </div>
                <button className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors">
                  <Save className="w-3 h-3 inline mr-1" />
                  Save All
                </button>
                {devStatus !== 'running' ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={startDevServer}
                      className={`px-3 py-1 text-xs rounded transition-colors ${devStatus === 'starting' ? 'bg-teal-700 opacity-75' : 'bg-teal-600 hover:bg-teal-700'}`}
                      disabled={devStatus === 'starting'}
                      title="Start Next.js dev server"
                    >
                      <Play className="w-3 h-3 inline mr-1" />
                      {devStatus === 'starting' ? 'Starting…' : 'Run'}
                    </button>
                    <button
                      onClick={() => setShowLogs(true)}
                      className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      title={devStatus === 'starting' ? 'View logs while starting' : 'View last logs'}
                    >
                      Logs
                    </button>
                    {devStatus === 'error' && (
                      <button
                        onClick={async () => {
                          const projectId = (template as any)?.id;
                          if (!projectId) return;
                          try {
                            setDevError(null);
                            setDevStatus('starting');
                            const res = await httpClient.post(`/api/devserver/restart/${projectId}`);
                            if (!res.success) {
                              setDevStatus('error');
                              setDevError(res.error || 'Failed to restart');
                            }
                          } catch (e: any) {
                            setDevStatus('error');
                            setDevError(e?.message || 'Failed to restart');
                          }
                        }}
                        className="px-3 py-1 text-xs bg-yellow-700 hover:bg-yellow-600 rounded transition-colors"
                        title="Restart after error"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {devUrl && (
                      <a
                        href={devUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs bg-green-700 hover:bg-green-600 rounded transition-colors"
                        title="Open development server"
                      >
                        Open
                      </a>
                    )}
                    <button
                      onClick={() => setShowLogs(true)}
                      className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      title="View logs"
                    >
                      Logs
                    </button>
                    <button
                      onClick={async () => {
                        const projectId = (template as any)?.id;
                        if (!projectId) return;
                        try {
                          setDevError(null);
                          setDevStatus('starting');
                          const res = await httpClient.post(`/api/devserver/restart/${projectId}`);
                          if (res.success) {
                            const statusRes = await httpClient.get(`/api/devserver/status/${projectId}`);
                            if (statusRes.success) {
                              const d: any = (statusRes as any).data;
                              setDevStatus(d.status === 'running' ? 'running' : 'starting');
                              if (d.url) setDevUrl(d.url);
                            }
                          } else {
                            setDevStatus('error');
                            setDevError(res.error || 'Failed to restart');
                          }
                        } catch (e: any) {
                          setDevStatus('error');
                          setDevError(e?.message || 'Failed to restart');
                        }
                      }}
                      className="px-3 py-1 text-xs bg-yellow-700 hover:bg-yellow-600 rounded transition-colors"
                      title="Restart development server"
                    >
                      Restart
                    </button>
                    <button
                      onClick={stopDevServer}
                      className="px-3 py-1 text-xs bg-red-700 hover:bg-red-600 rounded transition-colors"
                      title="Stop development server"
                    >
                      Stop
                    </button>
                  </div>
                )}
              </>
            )}
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
              {!isTemplate && (
                <div className="text-xs text-gray-400 mr-2 whitespace-nowrap">
                  {devStatus === 'running' && devUrl && (
                    <span title="Dev server running">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      <a href={devUrl} target="_blank" rel="noopener noreferrer" className="underline">{devUrl}</a>
                    </span>
                  )}
                  {devStatus === 'starting' && (
                    <span title="Starting dev server" className="text-yellow-400">Starting…</span>
                  )}
                  {devStatus === 'error' && devError && (
                    <span title={devError} className="text-red-400">Dev error</span>
                  )}
                </div>
              )}
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
                onClick={handleLogoutClick}
                className="p-2 rounded transition-colors text-gray-400 hover:text-white hover:bg-gray-800"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setShowBottomPanel(!showBottomPanel);
                  if (isTemplate && !showBottomPanel) {
                    setActiveBottomTab('terminal');
                  }
                }}
                className={`p-2 rounded transition-colors ${
                  showBottomPanel ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={isTemplate ? 'Terminal (restricted for templates)' : 'Toggle Terminal'}
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
                  onClick={() => {
                    if (tool.id === 'collaboration' && !checkTemplateRestriction('Collaboration')) {
                      return;
                    }
                    setActiveLeftTool(tool.id as any);
                  }}
                  className={`w-full p-3 flex justify-center items-center transition-colors ${
                    activeLeftTool === tool.id ? 'bg-gray-800 border-l-2 border-teal-500' : ''
                  } ${
                    tool.id === 'collaboration' && isTemplate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800 cursor-pointer'
                  }`}
                  title={tool.id === 'collaboration' && isTemplate ? 'Save as project to access collaboration' : tool.tooltip}
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
                  isTemplate ? (
                    <div className="p-4 text-center text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Collaboration features are not available for templates.</p>
                      <p className="text-xs mt-2">Save this template as a project to collaborate with others.</p>
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="mt-3 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded transition-colors"
                      >
                        Save as Project
                      </button>
                    </div>
                  ) : (
                    <CollaborationPanel 
                      projectId={mockProject.id}
                      currentFile={openTabs.find(t => t.id === activeTab)?.name}
                      className="border-0 bg-transparent"
                    />
                  )
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
                      // Check if this is AI chat and we're in a template
                      if (tab.id === 'ai-chat' && !checkTemplateRestriction('AI Assistant')) {
                        return;
                      }
                      setActiveTab(tab.id);
                      if (tab.type === 'file') {
                        setEditorValue(tab.content || '');
                      }
                    }}
                    className={`flex items-center px-3 py-1.5 border-r border-gray-800 text-sm ${
                      activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-950 text-gray-400 hover:bg-gray-800'
                    } ${
                      tab.id === 'ai-chat' && isTemplate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
                isTemplate ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
                    <Bot className="w-16 h-16 mb-4 opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">AI Assistant Not Available</h2>
                    <p className="text-sm text-center mb-4 max-w-md">The AI Assistant is only available for projects. Save this template as a project to get AI-powered code assistance.</p>
                    <button onClick={() => setShowSaveModal(true)} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save as Project</span>
                    </button>
                  </div>
                ) : (
                  <AIAssistantEnhanced
                    projectId={projectIdForSocket || ''}
                    currentFile={openTabs.find(t => t.id === activeTab)?.name}
                    fileContent={editorValue}
                    className="h-full"
                  />
                )
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
                {/* Keep LivePreview mounted to prevent iframe reset/flicker */}
                <LivePreview
                  fileTree={fileTree}
                  activeFile={activeTab}
                  activeFileContent={editorValue}
                  previewKey={(template?.id as string) || (template?.key as string) || 'editor'}
                  projectId={!isTemplate ? (template?.id as string) : undefined}
                  className={`h-full -m-4 ${activeRightTab === 'preview' ? '' : 'hidden'}`}
                />
                
                {activeRightTab === 'collaboration' && (
                  isTemplate ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                      <Users className="w-12 h-12 mb-3 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Collaboration Not Available</h3>
                      <p className="text-sm text-center mb-4">Collaboration features are only available for projects, not templates.</p>
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded transition-colors"
                      >
                        Save as Project
                      </button>
                    </div>
                  ) : (
                    <CollaborationPanel 
                      projectId={mockProject.id}
                      currentFile={openTabs.find(t => t.id === activeTab)?.name}
                      className="h-full"
                    />
                  )
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
                    title={isTemplate ? 'Terminal (restricted for templates)' : 'Terminal'}
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
                  isTemplate ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                      <TerminalIcon className="w-12 h-12 mb-3 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Terminal Not Available</h3>
                      <p className="text-sm text-center mb-4">Terminal access is only available for projects, not templates.</p>
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded transition-colors"
                      >
                        Save as Project
                      </button>
                    </div>
                  ) : (
                    <Terminal className="h-full" />
                  )
                )}
                {activeBottomTab === 'team-chat' && (
                  isTemplate ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                      <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Team Chat Not Available</h3>
                      <p className="text-sm text-center mb-4">Team chat is only available for projects, not templates.</p>
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded transition-colors"
                      >
                        Save as Project
                      </button>
                    </div>
                  ) : (
                    <ChatPanel 
                      projectId={mockProject.id}
                      className="h-full"
                    />
                  )
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
        
        {/* Save Template as Project Modal */}
        <SaveTemplateAsProjectModal
          isOpen={showSaveModal}
          onClose={() => {
            setShowSaveModal(false);
            setRestrictedFeatureRequested(null);
          }}
          templateName={template?.name || 'Untitled Template'}
          templateId={template?.key || template?.slug || 'template'}
          onSaveAsProject={handleSaveAsProject}
        />
        
        {/* Logout Modal */}
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={handleLogoutCancel}
          onConfirm={handleLogoutConfirm}
          userName={user?.firstName}
          isLoading={isLoggingOut}
        />

        {/* Project Created Success Dialog */}
        <ProjectCreatedDialog
          isOpen={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          projectName={createdProjectName}
          onOpenProject={() => {
            // Get the project data from the current state
            const currentProject = searchParams.get('project');
            if (currentProject) {
              try {
                const project = JSON.parse(decodeURIComponent(currentProject));
                if (project.id) {
                  router.push(`/editor/${project.id}`);
                } else if (project.slug) {
                  router.push(`/editor/${project.slug}`);
                }
              } catch (e) {
                console.error('Error parsing project data:', e);
              }
            }
          }}
        />
        
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

      {/* Logs Modal */}
      {showLogs && !isTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-[800px] max-w-[95vw] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="text-sm text-gray-300">Development Server Logs</div>
              <div className="flex items-center space-x-2">
                {devUrl && (
                  <a href={devUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-gray-400">{devUrl}</a>
                )}
                <button onClick={() => setShowLogs(false)} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm">Close</button>
              </div>
            </div>
            <div className="p-3 overflow-auto" style={{maxHeight: '60vh'}}>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                {devLogs.length ? devLogs.join('\n') : 'No logs yet. If the server is starting, logs will appear here shortly.'}
              </pre>
            </div>
            <div className="p-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
              <div>Status: {devStatus}</div>
              <div className="space-x-2">
                <button
                  onClick={() => setDevLogs([])}
                  className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
                >
                  Clear
                </button>
                <button
                  onClick={() => { /* manual refresh happens via polling; noop */ }}
                  className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </SocketProvider>
    </ProtectedRoute>
  );
}
