'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  GitBranch,
  Star,
  GitFork,
  Clock,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Lock,
  Globe,
  Code2,
  ChevronDown,
  Loader2,
  AlertCircle,
  Grid3X3,
  List,
  Settings,
  Play,
  Copy,
  Trash2,
  Archive,
  ExternalLink,
  Calendar,
  Users,
  Eye,
  Download
} from 'lucide-react';
import { Project, GetProjectsResponse } from '@swistack/shared';

export default function RepositoriesView() {
  const router = useRouter();
  const { user, httpClient } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'stars'>('updatedAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, [searchQuery, filterType, sortBy]);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        search: searchQuery,
        sortBy: sortBy === 'stars' ? 'updatedAt' : sortBy === 'name' ? 'name' : 'updatedAt', // Map to available sort options
        sortOrder: 'desc',
      });

      if (filterType !== 'all') {
        // Note: API uses isPublic, so we need to map the filter
        // This will be handled in the filtering logic below
      }

      const response = await httpClient.get(`/api/projects/my?${params}`);
      
      if (response.success && response.data) {
        const projectsData = response.data as GetProjectsResponse;
        setProjects(projectsData.projects);
        setTotal(projectsData.total);
      } else {
        throw new Error(response.error || 'Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageColor = (template: string): string => {
    const colorMap: Record<string, string> = {
      'react': '#61dafb',
      'nodejs': '#339933',
      'nodejs-express': '#339933',
      'python': '#3572A5',
      'python-django': '#3572A5',
      'go': '#00ADD8',
      'rust': '#dea584',
      'java': '#ED8B00',
      'typescript': '#3178c6',
      'javascript': '#f1e05a',
      'php': '#777bb4',
      'ruby': '#cc342d',
      'swift': '#fa7343',
      'kotlin': '#7f52ff',
      'dart': '#0175c2',
    };
    return colorMap[template] || '#6b7280';
  };

  const formatUpdatedAt = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const formatFileSize = (bytes: number): string => {
    if (typeof bytes !== 'number' || isNaN(bytes)) {
      return '0 B';
    }
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Project action handlers
  const handleProjectAction = async (projectId: string, action: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      switch (action) {
        case 'open':
          router.push(`/editor/${project.slug}`);
          break;
        case 'settings':
          router.push(`/editor/${project.slug}?tab=settings`);
          break;
        case 'duplicate':
          // Mock duplicate functionality
          console.log('Duplicating project:', project.name);
          // TODO: Implement actual duplicate API call
          break;
        case 'archive':
          // Mock archive functionality
          console.log('Archiving project:', project.name);
          // TODO: Implement actual archive API call
          break;
        case 'delete':
          const confirmed = confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`);
          if (confirmed) {
            console.log('Deleting project:', project.name);
            // TODO: Implement actual delete API call
            // For now, remove from local state
            setProjects(prev => prev.filter(p => p.id !== projectId));
          }
          break;
        case 'download':
          console.log('Downloading project:', project.name);
          // TODO: Implement project download
          break;
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
    }
    setActionMenuOpen(null);
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedProjects(new Set());
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProjects.size === 0) return;
    
    const confirmed = confirm(`Are you sure you want to ${action} ${selectedProjects.size} project(s)?`);
    if (confirmed) {
      console.log(`Performing bulk ${action} on ${selectedProjects.size} projects`);
      // TODO: Implement bulk operations
      clearSelection();
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'public' && project.isPublic) ||
                         (filterType === 'private' && !project.isPublic);
    return matchesFilter;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'updatedAt') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    // Default sort
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to load projects</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchProjects}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Projects</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
              <span>{total} project{total !== 1 ? 's' : ''}</span>
              {selectedProjects.size > 0 && (
                <span className="text-teal-400">{selectedProjects.size} selected</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {selectedProjects.size > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center space-x-1 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Clear
                </button>
              </>
            )}
            <button 
              onClick={() => router.push('/workspace?tab=templates')}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Project</span>
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Filter Dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'public' | 'private')}
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Projects</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updatedAt' | 'name' | 'stars')}
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="name">Name</option>
              <option value="stars">Most Popular</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-800/50 border border-gray-700 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProjects.map(project => (
            <div
              key={project.id}
              className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <input
                  type="checkbox"
                  checked={selectedProjects.has(project.id)}
                  onChange={() => toggleProjectSelection(project.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                />
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectAction(project.id, 'open');
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Open project"
                  >
                    <Play className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectAction(project.id, 'settings');
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Project settings"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(actionMenuOpen === project.id ? null : project.id);
                      }}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {actionMenuOpen === project.id && (
                      <div className="absolute right-0 top-8 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                        <div className="p-2">
                          <button
                            onClick={() => handleProjectAction(project.id, 'duplicate')}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 rounded"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={() => handleProjectAction(project.id, 'download')}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 rounded"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleProjectAction(project.id, 'archive')}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 rounded"
                          >
                            <Archive className="w-4 h-4" />
                            <span>Archive</span>
                          </button>
                          <hr className="border-gray-700 my-2" />
                          <button
                            onClick={() => handleProjectAction(project.id, 'delete')}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div onClick={() => handleProjectAction(project.id, 'open')}>
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getLanguageColor(project.template) }}
                  />
                  <h3 className="font-medium text-white group-hover:text-teal-400 transition-colors">
                    {project.name}
                  </h3>
                </div>

                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {project.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatUpdatedAt(project.updatedAt)}</span>
                    </span>
                    {!project.isPublic ? (
                      <span className="flex items-center space-x-1 text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-gray-500">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600">{formatFileSize(project.storageUsed)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedProjects.map(project => (
            <div
              key={project.id}
              className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors cursor-pointer flex items-center space-x-4 group"
            >
              <input
                type="checkbox"
                checked={selectedProjects.has(project.id)}
                onChange={() => toggleProjectSelection(project.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
              />
              
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getLanguageColor(project.template) }}
              />
              
              <div className="flex-1 min-w-0" onClick={() => handleProjectAction(project.id, 'open')}>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-white truncate group-hover:text-teal-400 transition-colors">
                    {project.name}
                  </h3>
                  {!project.isPublic ? (
                    <Lock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  ) : (
                    <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {project.description || 'No description provided'}
                </p>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>{project.template}</span>
                <span>{formatUpdatedAt(project.updatedAt)}</span>
                <span>{formatFileSize(project.storageUsed)}</span>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectAction(project.id, 'open');
                  }}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Open project"
                >
                  <Play className="w-4 h-4 text-gray-400" />
                </button>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenuOpen(actionMenuOpen === project.id ? null : project.id);
                    }}
                    className="p-2 hover:bg-gray-700 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  {actionMenuOpen === project.id && (
                    <div className="absolute right-0 top-8 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        <button
                          onClick={() => handleProjectAction(project.id, 'settings')}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 rounded"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => handleProjectAction(project.id, 'duplicate')}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 rounded"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={() => handleProjectAction(project.id, 'download')}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 rounded"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleProjectAction(project.id, 'archive')}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700 rounded"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Archive</span>
                        </button>
                        <hr className="border-gray-700 my-2" />
                        <button
                          onClick={() => handleProjectAction(project.id, 'delete')}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
            <Code2 className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {searchQuery || filterType !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first project'}
          </p>
          <button 
            onClick={() => router.push('/workspace?tab=templates')}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create Project</span>
          </button>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
        />
      )}

      {/* Stats Footer */}
      {sortedProjects.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Showing {sortedProjects.length} of {total} projects
            </div>
            <div className="flex items-center space-x-6">
              <div>
                Total size: {formatFileSize(projects.reduce((sum, p) => sum + p.storageUsed, 0))}
              </div>
              <div>
                {projects.filter(p => !p.isPublic).length} private • {projects.filter(p => p.isPublic).length} public
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}