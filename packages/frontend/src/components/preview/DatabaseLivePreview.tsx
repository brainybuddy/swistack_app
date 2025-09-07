'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Monitor, Zap, ZapOff, Server, Database, Wifi, WifiOff } from 'lucide-react';
import { usePreviewWebSocket } from '../../hooks/usePreviewWebSocket';

interface DatabaseLivePreviewProps {
  projectId: string;
  userId: string;
  activeFile?: string;
  activeFileContent?: string;
  className?: string;
  onError?: (error: string) => void;
}

interface PreviewProject {
  id: string;
  name: string;
  template: string;
  ports: {
    frontend: number;
    backend: number;
    reserved: number[];
  };
  files: Array<{
    path: string;
    name: string;
    content: string;
    mimeType?: string;
    type: 'file' | 'directory';
  }>;
}

export default function DatabaseLivePreview({ 
  projectId,
  userId,
  activeFile, 
  activeFileContent, 
  className = '',
  onError
}: DatabaseLivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isHotReloadEnabled, setIsHotReloadEnabled] = useState(true);
  const [compileTime, setCompileTime] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [project, setProject] = useState<PreviewProject | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Get authentication token (you may need to adjust this based on your auth setup)
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('accessToken') || '';
  }, []);

  // WebSocket integration for real-time updates
  const { updateFile, refreshPreview } = usePreviewWebSocket({
    projectId,
    userId,
    token: getAuthToken(),
    onPreviewUpdate: (data) => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(data.html);
          doc.close();
          setLastUpdate(Date.now());
          setIsLoading(false);
          console.log('🔄 Preview updated via WebSocket:', data.filePath || 'full refresh');
        }
      }
    },
    onPreviewError: (error) => {
      setHasError(true);
      setErrorDetails(error);
      setIsLoading(false);
      if (onError) onError(error);
    },
    onConnected: () => {
      setWsConnected(true);
      console.log('🔌 WebSocket connected');
    },
    onDisconnected: () => {
      setWsConnected(false);
      console.log('🔌 WebSocket disconnected');
    }
  });

  // Load project data from database
  const loadProjectData = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/preview/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load project');
      }

      setProject(data.data);
      setIsConnected(true);
      console.log('🗄️ Database project loaded:', data.data.name);
      console.log('🔌 Port allocation:', data.data.ports);
    } catch (error) {
      console.error('Failed to load project data:', error);
      setHasError(true);
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
      setIsConnected(false);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to load project');
      }
    }
  }, [projectId, getAuthToken, onError]);

  // Update preview by fetching compiled HTML from backend
  const updatePreview = useCallback(async () => {
    if (!iframeRef.current || !project) return;

    const startTime = Date.now();
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorDetails('');

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // If there's an active file with updated content, update it first
      if (activeFile && activeFileContent !== undefined) {
        console.log('📝 Updating file:', activeFile);
        const updateResponse = await fetch(`/api/preview/project/${projectId}/file`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filePath: activeFile,
            content: activeFileContent
          })
        });

        if (!updateResponse.ok) {
          throw new Error(`Failed to update file: ${updateResponse.status}`);
        }

        const updateData = await updateResponse.json();
        if (!updateData.success) {
          throw new Error(updateData.error || 'Failed to update file');
        }

        // Use the generated HTML directly
        if (updateData.html) {
          const doc = iframeRef.current.contentDocument;
          if (doc) {
            doc.open();
            doc.write(updateData.html);
            doc.close();
            
            const endTime = Date.now();
            setCompileTime(endTime - startTime);
            setIsLoading(false);
            setLastUpdate(endTime);
            return;
          }
        }
      }

      // Otherwise, get the compiled HTML from the backend
      const response = await fetch(`/api/preview/project/${projectId}/html`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Preview generation failed: ${response.status}`);
      }

      const html = await response.text();
      
      // Write the compiled HTML to the iframe
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        
        // Handle iframe load
        iframeRef.current.onload = () => {
          const endTime = Date.now();
          setCompileTime(endTime - startTime);
          setIsLoading(false);
          setLastUpdate(endTime);
          console.log(`🚀 Preview updated in ${endTime - startTime}ms`);
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
      console.error('Failed to update preview:', error);
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
      setHasError(true);
      setIsLoading(false);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Preview update failed');
      }
    }
  }, [projectId, activeFile, activeFileContent, project, getAuthToken, onError]);

  // Load project data on mount
  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Update preview when project data is loaded or files change
  useEffect(() => {
    if (!project || !isHotReloadEnabled) return;
    
    // If we have an active file with new content, use WebSocket for faster updates
    if (activeFile && activeFileContent !== undefined && wsConnected) {
      const timeoutId = setTimeout(() => {
        updateFile(activeFile, activeFileContent);
      }, 300); // 300ms debounce for WebSocket updates
      
      return () => clearTimeout(timeoutId);
    } else {
      // Fallback to HTTP update
      const timeoutId = setTimeout(() => {
        updatePreview();
      }, 500); // 500ms debounce for HTTP updates
      
      return () => clearTimeout(timeoutId);
    }
  }, [project, isHotReloadEnabled, activeFile, activeFileContent, wsConnected, updateFile, updatePreview]);

  const handleRefresh = () => {
    if (wsConnected) {
      refreshPreview();
    } else {
      loadProjectData().then(() => updatePreview());
    }
  };

  const handleOpenInNewTab = async () => {
    if (!project) return;
    
    console.log('🚀 [DatabaseLivePreview] handleOpenInNewTab called for project:', project.name);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // First, start the development server if not already running
      console.log('🚀 Starting development server for external browser...');
      console.log('📡 Making request to:', `/api/devserver/start/${projectId}`);
      
      const startResponse = await fetch(`/api/devserver/start/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📨 Response status:', startResponse.status);

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to start development server: ${startResponse.status}`);
      }

      const startData = await startResponse.json();
      console.log('📊 Response data:', startData);
      
      if (!startData.success) {
        throw new Error(startData.error || 'Failed to start development server');
      }

      // Open the development server URL in a new tab
      const devServerUrl = startData.data.url;
      console.log('🌍 Opening development server:', devServerUrl);
      window.open(devServerUrl, '_blank');

      // Show a brief success message (optional)
      console.log('✅ External browser opened to actual development server');

    } catch (error) {
      console.error('Failed to open in external browser:', error);
      // Fallback to opening the compiled preview URL
      const fallbackUrl = `http://localhost:${project.ports.frontend}`;
      console.log('📱 Falling back to port URL:', fallbackUrl);
      window.open(fallbackUrl, '_blank');
    }
  };

  if (hasError) {
    return (
      <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Database Preview</span>
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
            <p className="text-lg font-medium mb-2">Preview Error</p>
            <p className="text-sm mb-3">Failed to load project preview</p>
            {errorDetails && (
              <div className="text-xs text-red-300 bg-red-900/20 p-3 rounded border border-red-800 mb-4 text-left">
                <pre className="whitespace-pre-wrap">{errorDetails}</pre>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Loading Project...</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm">Loading from database...</p>
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
          <span className="text-xs text-blue-400">{project.name}</span>
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
          {isConnected && (
            <div className="flex items-center space-x-1 text-xs text-green-400">
              <Database className="w-3 h-3" />
              <span>DB</span>
            </div>
          )}
          {wsConnected ? (
            <div className="flex items-center space-x-1 text-xs text-green-400">
              <Wifi className="w-3 h-3" />
              <span>Live</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}
          {project.ports && (
            <div className="flex items-center space-x-1 text-xs text-purple-400">
              <Server className="w-3 h-3" />
              <span>:{project.ports.frontend}</span>
            </div>
          )}
          {!isLoading && compileTime > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <span>{compileTime}ms</span>
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
            title="Start development server and open in browser"
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
          title={`${project.name} - Live Preview`}
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Compiling {project.template}...</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-800 border-t border-gray-700 px-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Template: {project.template}</span>
          <span>Files: {project.files.filter(f => f.type === 'file').length}</span>
          <span>Last update: {new Date(lastUpdate).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Frontend: {project.ports.frontend}</span>
          <span>Backend: {project.ports.backend}</span>
        </div>
      </div>
    </div>
  );
}