'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Folder,
  File,
  FolderPlus,
  FilePlus,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Copy,
  Scissors,
  Move,
  Activity,
  Edit3,
  Eye,
  AlertCircle,
  Loader2,
  X,
  Check,
  Plus
} from 'lucide-react';
import { ProjectFile } from '@swistack/shared';
import { ProjectActivityFeed } from './activity/ProjectActivityFeed';

interface FileExplorerProps {
  projectId: string;
  onFileSelect?: (file: ProjectFile) => void;
  selectedFile?: ProjectFile | null;
  className?: string;
}

interface FileTreeNode extends ProjectFile {
  children?: FileTreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  file: ProjectFile | null;
}

interface DragState {
  isDragging: boolean;
  draggedFile: ProjectFile | null;
  dropTarget: ProjectFile | null;
}

export default function FileExplorer({ 
  projectId, 
  onFileSelect, 
  selectedFile, 
  className = '' 
}: FileExplorerProps) {
  const { httpClient } = useAuth();
  const [files, setFiles] = useState<FileTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProjectFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    file: null
  });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedFile: null,
    dropTarget: null
  });
  const [clipboard, setClipboard] = useState<{
    file: ProjectFile | null;
    operation: 'copy' | 'cut' | null;
  }>({ file: null, operation: null });
  const [newItemDialog, setNewItemDialog] = useState<{
    visible: boolean;
    type: 'file' | 'folder' | null;
    parentPath: string;
    name: string;
  }>({ visible: false, type: null, parentPath: '', name: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [showActivityFeed, setShowActivityFeed] = useState(false);

  useEffect(() => {
    fetchFileTree();
  }, [projectId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchFiles();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchFileTree = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await httpClient.get(`/api/files/projects/${projectId}/tree`);
      
      if (response.success && response.data?.files) {
        const treeNodes = buildFileTree(response.data.files);
        setFiles(treeNodes);
      } else {
        throw new Error(response.error || 'Failed to fetch file tree');
      }
    } catch (err) {
      console.error('Error fetching file tree:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch file tree');
    } finally {
      setIsLoading(false);
    }
  };

  const buildFileTree = (fileList: ProjectFile[]): FileTreeNode[] => {
    const fileMap = new Map<string, FileTreeNode>();
    const rootFiles: FileTreeNode[] = [];

    // Create nodes for all files
    fileList.forEach(file => {
      fileMap.set(file.id, { ...file, children: [], isExpanded: false });
    });

    // Build tree structure
    fileList.forEach(file => {
      const node = fileMap.get(file.id)!;
      if (file.parentId) {
        const parent = fileMap.get(file.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootFiles.push(node);
      }
    });

    // Sort files - directories first, then alphabetically
    const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    const sortRecursively = (nodes: FileTreeNode[]): FileTreeNode[] => {
      const sorted = sortNodes(nodes);
      sorted.forEach(node => {
        if (node.children) {
          node.children = sortRecursively(node.children);
        }
      });
      return sorted;
    };

    return sortRecursively(rootFiles);
  };

  const searchFiles = async () => {
    try {
      setIsSearching(true);
      
      const response = await httpClient.get(`/api/files/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (response.success && response.data?.files) {
        setSearchResults(response.data.files);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching files:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleExpanded = (fileId: string) => {
    setFiles(prev => updateNodeInTree(prev, fileId, node => ({ ...node, isExpanded: !node.isExpanded })));
  };

  const updateNodeInTree = (nodes: FileTreeNode[], targetId: string, updater: (node: FileTreeNode) => FileTreeNode): FileTreeNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) {
        return updater(node);
      }
      if (node.children) {
        return { ...node, children: updateNodeInTree(node.children, targetId, updater) };
      }
      return node;
    });
  };

  const handleFileClick = (file: ProjectFile) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: ProjectFile) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const handleDragStart = (e: React.DragEvent, file: ProjectFile) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
    
    setDragState({
      isDragging: true,
      draggedFile: file,
      dropTarget: null
    });
  };

  const handleDragOver = (e: React.DragEvent, targetFile?: ProjectFile) => {
    e.preventDefault();
    
    if (targetFile && targetFile.type === 'directory') {
      e.dataTransfer.dropEffect = 'move';
      setDragState(prev => ({ ...prev, dropTarget: targetFile }));
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDragState(prev => ({ ...prev, dropTarget: null }));
    }
  };

  const handleDragLeave = () => {
    setDragState(prev => ({ ...prev, dropTarget: null }));
  };

  const handleDrop = async (e: React.DragEvent, targetFile?: ProjectFile) => {
    e.preventDefault();
    
    const { draggedFile, dropTarget } = dragState;
    
    if (!draggedFile || !dropTarget || draggedFile.id === dropTarget.id) {
      setDragState({ isDragging: false, draggedFile: null, dropTarget: null });
      return;
    }

    try {
      const newPath = dropTarget.path === '/' ? draggedFile.name : `${dropTarget.path}/${draggedFile.name}`;
      
      const response = await httpClient.post(`/api/files/projects/${projectId}/files/${draggedFile.path}/move`, {
        destinationPath: newPath
      });

      if (response.success) {
        await fetchFileTree();
      } else {
        throw new Error(response.error || 'Failed to move file');
      }
    } catch (err) {
      console.error('Error moving file:', err);
      setError(err instanceof Error ? err.message : 'Failed to move file');
    } finally {
      setDragState({ isDragging: false, draggedFile: null, dropTarget: null });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetPath = '') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const filePath = targetPath ? `${targetPath}/${file.name}` : file.name;
        
        setUploadProgress(prev => ({ ...prev, [filePath]: 0 }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', filePath);

        // Show scanning progress
        setUploadProgress(prev => ({ ...prev, [filePath]: 25 }));

        const response = await httpClient.postRaw(`/api/files/projects/${projectId}/upload`, formData);
        const data = await response.json();

        if (response.ok && data.success) {
          setUploadProgress(prev => ({ ...prev, [filePath]: 100 }));
        } else {
          // Handle virus scan errors specifically
          if (data.code === 'VIRUS_DETECTED') {
            setError(`🚨 Upload blocked: ${data.error}`);
            setUploadProgress(prev => ({ ...prev, [filePath]: -1 })); // Indicate failure
          } else if (data.code === 'SCAN_ERROR') {
            setError(`🔍 Security scan failed: ${data.error}`);
            setUploadProgress(prev => ({ ...prev, [filePath]: -1 }));
          } else {
            throw new Error(data.error || 'Failed to upload file');
          }
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload file');
      }
    }

    setIsUploading(false);
    setUploadProgress({});
    await fetchFileTree();
  };

  const createNewItem = async () => {
    const { type, parentPath, name } = newItemDialog;
    if (!type || !name.trim()) return;

    try {
      const itemPath = parentPath ? `${parentPath}/${name}` : name;

      if (type === 'folder') {
        const response = await httpClient.post(`/api/files/projects/${projectId}/directories`, {
          path: itemPath
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to create directory');
        }
      } else {
        const response = await httpClient.put(`/api/files/projects/${projectId}/files/${itemPath}`, {
          content: '',
          encoding: 'utf8'
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to create file');
        }
      }

      setNewItemDialog({ visible: false, type: null, parentPath: '', name: '' });
      await fetchFileTree();
    } catch (err) {
      console.error('Error creating item:', err);
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  const deleteFile = async (file: ProjectFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      const response = await httpClient.delete(`/api/files/projects/${projectId}/files/${file.path}`);
      
      if (response.success) {
        await fetchFileTree();
        setContextMenu(prev => ({ ...prev, visible: false }));
      } else {
        throw new Error(response.error || 'Failed to delete file');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === 'directory') {
      return <Folder className="w-4 h-4 text-blue-400" />;
    }
    
    return <File className="w-4 h-4 text-gray-400" />;
  };

  const renderFileNode = (node: FileTreeNode, depth = 0) => {
    const isSelected = selectedFile?.id === node.id;
    const isDragTarget = dragState.dropTarget?.id === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center space-x-2 px-2 py-1 rounded cursor-pointer transition-colors group ${
            isSelected ? 'bg-teal-500/20 text-teal-400' : 'hover:bg-gray-800/50 text-gray-300'
          } ${isDragTarget ? 'bg-teal-500/10 border border-teal-500/30' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
        >
          {node.type === 'directory' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              className="p-0.5 hover:bg-gray-700 rounded"
            >
              {node.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          {getFileIcon(node)}
          
          <span className="flex-1 text-sm truncate">{node.name}</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, node);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-opacity"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>

        {node.type === 'directory' && node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderContextMenu = () => {
    if (!contextMenu.visible || !contextMenu.file) return null;

    return (
      <div
        className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          onClick={() => {
            setNewItemDialog({
              visible: true,
              type: 'file',
              parentPath: contextMenu.file?.type === 'directory' ? contextMenu.file.path : '',
              name: ''
            });
            setContextMenu(prev => ({ ...prev, visible: false }));
          }}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center space-x-2"
        >
          <FilePlus className="w-4 h-4" />
          <span>New File</span>
        </button>
        
        <button
          onClick={() => {
            setNewItemDialog({
              visible: true,
              type: 'folder',
              parentPath: contextMenu.file?.type === 'directory' ? contextMenu.file.path : '',
              name: ''
            });
            setContextMenu(prev => ({ ...prev, visible: false }));
          }}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center space-x-2"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
        </button>
        
        <hr className="border-gray-700 my-1" />
        
        <button
          onClick={() => {
            setClipboard({ file: contextMenu.file, operation: 'copy' });
            setContextMenu(prev => ({ ...prev, visible: false }));
          }}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center space-x-2"
        >
          <Copy className="w-4 h-4" />
          <span>Copy</span>
        </button>
        
        <button
          onClick={() => {
            setClipboard({ file: contextMenu.file, operation: 'cut' });
            setContextMenu(prev => ({ ...prev, visible: false }));
          }}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center space-x-2"
        >
          <Scissors className="w-4 h-4" />
          <span>Cut</span>
        </button>
        
        <hr className="border-gray-700 my-1" />
        
        <button
          onClick={() => {
            deleteFile(contextMenu.file!);
          }}
          className="w-full px-3 py-2 text-left text-sm hover:bg-red-600/20 text-red-400 flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    );
  };

  const renderNewItemDialog = () => {
    if (!newItemDialog.visible) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-w-[300px]">
          <h3 className="text-lg font-medium text-white mb-4">
            Create New {newItemDialog.type === 'file' ? 'File' : 'Folder'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={newItemDialog.name}
                onChange={(e) => setNewItemDialog(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                placeholder={`Enter ${newItemDialog.type} name...`}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setNewItemDialog({ visible: false, type: null, parentPath: '', name: '' })}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewItem}
                disabled={!newItemDialog.name.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${showActivityFeed ? 'space-x-4' : ''} ${className}`}>
      <div className={`bg-gray-800/30 border border-gray-700 rounded-lg ${
        showActivityFeed ? 'flex-1' : 'w-full'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-white">Files</h3>
        <div className="flex items-center space-x-1">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="p-1.5 hover:bg-gray-700 rounded cursor-pointer transition-colors"
            title="Upload files"
          >
            <Upload className="w-4 h-4 text-gray-400" />
          </label>
          <button
            onClick={() => setNewItemDialog({ visible: true, type: 'file', parentPath: '', name: '' })}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="New file"
          >
            <FilePlus className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setNewItemDialog({ visible: true, type: 'folder', parentPath: '', name: '' })}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="New folder"
          >
            <FolderPlus className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={fetchFileTree}
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowActivityFeed(!showActivityFeed)}
            className={`p-1.5 hover:bg-gray-700 rounded transition-colors ${
              showActivityFeed ? 'bg-teal-600/20 text-teal-400' : 'text-gray-400'
            }`}
            title="Activity feed"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="h-64 overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        ) : searchQuery.trim() ? (
          <div className="p-2">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No files found matching "{searchQuery}"
              </div>
            ) : (
              searchResults.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center space-x-2 px-2 py-1 rounded cursor-pointer transition-colors hover:bg-gray-800/50 ${
                    selectedFile?.id === file.id ? 'bg-teal-500/20 text-teal-400' : 'text-gray-300'
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  {getFileIcon(file)}
                  <span className="flex-1 text-sm truncate">{file.path}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-2">
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No files in this project
              </div>
            ) : (
              files.map(file => renderFileNode(file))
            )}
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="border-t border-gray-700 p-2">
          <div className="space-y-1">
            {Object.entries(uploadProgress).map(([path, progress]) => (
              <div key={path} className="flex items-center space-x-2 text-xs">
                <span className="flex-1 truncate text-gray-400">{path}</span>
                <div className="w-16 bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-teal-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-gray-500">{progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {renderContextMenu()}
      {renderNewItemDialog()}
      </div>

      {showActivityFeed && (
        <div className="w-80 flex-shrink-0">
          <ProjectActivityFeed
            projectId={projectId}
            maxHeight="500px"
            showHeader={true}
            autoUpdate={true}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
}