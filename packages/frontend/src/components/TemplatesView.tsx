'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Globe,
  Users,
  Star,
  Database,
  Smartphone,
  Cloud,
  Shield,
  Zap,
  Layout,
  Terminal,
  Code2,
  Server,
  Loader2,
  AlertCircle,
  ArrowRight,
  Monitor,
  Brain,
  Package,
  Wrench,
  Gamepad2,
  ShoppingCart,
  BookOpen,
  Filter,
  Grid3X3,
  List,
  Clock,
  TrendingUp,
  Award,
  ChevronDown,
  Tag
} from 'lucide-react';
import { ProjectTemplate, CreateProjectRequest } from '@swistack/shared';

interface TemplatesViewProps {
  onSelectTemplate?: (template: ProjectTemplate) => void;
}

export default function TemplatesView({ onSelectTemplate }: TemplatesViewProps) {
  const router = useRouter();
  const { user, httpClient } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'created' | 'updated'>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await httpClient.get('/api/projects/templates');
      
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced category configurations
  const CATEGORY_CONFIG = {
    frontend: { icon: Monitor, label: 'Frontend', color: 'text-blue-400' },
    backend: { icon: Server, label: 'Backend', color: 'text-green-400' },
    fullstack: { icon: Globe, label: 'Full Stack', color: 'text-purple-400' },
    mobile: { icon: Smartphone, label: 'Mobile', color: 'text-pink-400' },
    data: { icon: Database, label: 'Data & AI', color: 'text-orange-400' },
    ml: { icon: Brain, label: 'Machine Learning', color: 'text-red-400' },
    tools: { icon: Wrench, label: 'Developer Tools', color: 'text-gray-400' },
    games: { icon: Gamepad2, label: 'Games', color: 'text-yellow-400' },
    ecommerce: { icon: ShoppingCart, label: 'E-commerce', color: 'text-teal-400' },
    education: { icon: BookOpen, label: 'Education', color: 'text-indigo-400' }
  };

  const DIFFICULTY_CONFIG = {
    beginner: { label: 'Beginner', color: 'text-green-400 bg-green-400/10' },
    intermediate: { label: 'Intermediate', color: 'text-yellow-400 bg-yellow-400/10' },
    advanced: { label: 'Advanced', color: 'text-red-400 bg-red-400/10' }
  };

  const getTemplateIcon = (category: string, framework?: string) => {
    const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
    if (config) return config.icon;
    
    // Fallback logic
    if (framework === 'react' || category === 'frontend') return Code2;
    if (framework === 'express' || category === 'backend') return Server;
    if (category === 'mobile') return Smartphone;
    if (category === 'fullstack') return Globe;
    if (category === 'data' || category === 'ml') return Database;
    return Layout;
  };

  const categoryMap = templates.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { id: 'all', label: 'All', count: templates.length },
    ...Object.keys(CATEGORY_CONFIG).map(categoryId => ({
      id: categoryId,
      label: CATEGORY_CONFIG[categoryId as keyof typeof CATEGORY_CONFIG].label,
      count: categoryMap[categoryId] || 0
    }))
  ];

  const handleTemplateSelect = async (template: ProjectTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      return;
    }

    if (!user) return;

    try {
      setIsLoading(true);
      
      // First, get the full template data via POST to avoid 431 errors
      console.log('🔍 Fetching full template data for:', template.key);
      const fullTemplateResponse = await httpClient.post('/api/projects/templates/full-data', {
        templateKey: template.key
      });
      
      if (!fullTemplateResponse.success || !fullTemplateResponse.data) {
        throw new Error(fullTemplateResponse.error || 'Failed to fetch template data');
      }
      
      const fullTemplate = fullTemplateResponse.data;
      console.log('✅ Got full template data:', fullTemplate.name, 'with', fullTemplate.files?.length, 'files');
      
      // Now create the project with full template data
      const createRequest: CreateProjectRequest = {
        name: `My ${template.name} Project`,
        description: template.description || '',
        template: template.key,
        templateData: fullTemplate, // Send full template data to avoid 431 errors
        isPublic: false
      };

      const response = await httpClient.post('/api/projects', createRequest);
      
      if (response.success && response.data) {
        const project = response.data.project;
        router.push(`/editor/${project.slug}`);
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.framework || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.language || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || (template as any).difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'updated':
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      case 'popularity':
      default:
        return ((b as any).downloads || 0) - ((a as any).downloads || 0);
    }
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
          <h3 className="text-lg font-medium text-white mb-2">Failed to load templates</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchTemplates}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Templates</h1>
        <p className="text-gray-400">Choose a template to get started with your new project</p>
      </div>

      {/* Controls Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        
        {/* Categories Row */}
        <div className="flex items-center justify-between">
          {/* Categories */}
          <div className="flex items-center space-x-2 flex-wrap">
            {categories.map(cat => {
              const categoryConfig = cat.id === 'all' ? null : CATEGORY_CONFIG[cat.id as keyof typeof CATEGORY_CONFIG];
              const IconComponent = categoryConfig?.icon;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                  <span>{cat.label}</span>
                  <span className="text-xs opacity-75">({cat.count})</span>
                </button>
              );
            })}
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center space-x-2">
            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Levels</option>
              {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="popularity">Most Popular</option>
              <option value="name">Name A-Z</option>
              <option value="created">Newest</option>
              <option value="updated">Recently Updated</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-700 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        : "space-y-3"
      }>
        {filteredTemplates.map(template => {
          const IconComponent = getTemplateIcon(template.category, template.framework);
          const categoryConfig = CATEGORY_CONFIG[template.category as keyof typeof CATEGORY_CONFIG];
          const difficultyConfig = DIFFICULTY_CONFIG[(template as any).difficulty as keyof typeof DIFFICULTY_CONFIG];
          
          if (viewMode === 'list') {
            return (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 hover:border-teal-500/50 transition-colors cursor-pointer group flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-6 h-6 text-teal-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-white text-base truncate">
                      {template.name}
                    </h3>
                    <div className="flex items-center space-x-2 ml-4">
                      {template.isOfficial && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-medium">OFFICIAL</span>
                      )}
                      {difficultyConfig && (
                        <span className={`px-2 py-1 text-xs rounded font-medium ${difficultyConfig.color}`}>
                          {difficultyConfig.label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                    {template.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4 text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Tag className="w-4 h-4" />
                        <span className="capitalize">{template.language}</span>
                      </div>
                      {template.framework && (
                        <span>{template.framework}</span>
                      )}
                      {categoryConfig && (
                        <span className={categoryConfig.color}>{categoryConfig.label}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="text-teal-400">v{template.version}</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{(template as any).downloads || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          // Grid view
          return (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 hover:border-teal-500/50 transition-colors cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-teal-400" />
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {template.isOfficial && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded font-medium">OFFICIAL</span>
                  )}
                  {difficultyConfig && (
                    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${difficultyConfig.color}`}>
                      {difficultyConfig.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <h3 className="font-medium text-white text-sm mb-1">
                {template.name}
              </h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {template.description || 'No description provided'}
              </p>

              {/* Category Badge */}
              {categoryConfig && (
                <div className="flex items-center space-x-1 mb-3">
                  <span className={`text-xs px-2 py-1 rounded ${categoryConfig.color} bg-current/10`}>
                    {categoryConfig.label}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="capitalize">{template.language}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-teal-400">v{template.version}</span>
                  {template.framework && (
                    <span className="text-gray-400">{template.framework}</span>
                  )}
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{(template as any).downloads || 0} downloads</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Updated {new Date(template.updatedAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
            <Layout className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
          <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}