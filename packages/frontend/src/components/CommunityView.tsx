'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Award,
  HelpCircle,
  Code2,
  Lightbulb,
  Bug,
  Users,
  Search,
  Filter,
  ChevronDown,
  Eye,
  ThumbsUp,
  Clock,
  Hash,
  Star,
  GitPullRequest,
  CheckCircle
} from 'lucide-react';

interface Post {
  id: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  title: string;
  content: string;
  category: 'discussion' | 'showcase' | 'help' | 'announcement';
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
  isPinned?: boolean;
  isSolved?: boolean;
}

export default function CommunityView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'discussion' | 'showcase' | 'help' | 'announcement'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

  const posts: Post[] = [
    {
      id: '1',
      author: 'Sarah Wilson',
      authorAvatar: 'SW',
      authorRole: 'Pro Developer',
      title: '🚀 Just deployed my first full-stack application!',
      content: 'After 3 months of learning, I finally deployed my e-commerce platform using Next.js, Tailwind, and PostgreSQL. The journey was amazing!',
      category: 'showcase',
      tags: ['nextjs', 'tailwind', 'postgresql', 'deployment'],
      likes: 234,
      comments: 45,
      views: 1520,
      createdAt: '2 hours ago',
      isLiked: true,
      isBookmarked: false,
      isPinned: true
    },
    {
      id: '2',
      author: 'Mike Johnson',
      authorAvatar: 'MJ',
      authorRole: 'Community Member',
      title: 'How to optimize React performance in large applications?',
      content: 'I\'m working on a dashboard with hundreds of components. Looking for best practices on memoization, lazy loading, and state management.',
      category: 'help',
      tags: ['react', 'performance', 'optimization'],
      likes: 87,
      comments: 23,
      views: 892,
      createdAt: '5 hours ago',
      isLiked: false,
      isBookmarked: true,
      isSolved: true
    },
    {
      id: '3',
      author: 'Alex Brown',
      authorAvatar: 'AB',
      authorRole: 'Team Admin',
      title: '📢 New AI-powered code completion feature is live!',
      content: 'We\'re excited to announce that our new AI assistant is now available for all Pro users. It can help you write code faster and catch bugs early.',
      category: 'announcement',
      tags: ['announcement', 'ai', 'features'],
      likes: 456,
      comments: 89,
      views: 3200,
      createdAt: '1 day ago',
      isLiked: true,
      isBookmarked: true,
      isPinned: true
    },
    {
      id: '4',
      author: 'Jane Smith',
      authorAvatar: 'JS',
      authorRole: 'Pro Developer',
      title: 'Discussion: Microservices vs Monolithic Architecture',
      content: 'What are your thoughts on choosing between microservices and monolithic architecture for a startup? Share your experiences!',
      category: 'discussion',
      tags: ['architecture', 'microservices', 'discussion'],
      likes: 145,
      comments: 67,
      views: 2100,
      createdAt: '2 days ago',
      isLiked: false,
      isBookmarked: false
    },
    {
      id: '5',
      author: 'Chris Lee',
      authorAvatar: 'CL',
      authorRole: 'Community Member',
      title: 'My open-source contribution journey - 100 PRs merged! 🎉',
      content: 'Started contributing to open source 6 months ago. Today I hit 100 merged pull requests across 20 different projects. Here\'s what I learned...',
      category: 'showcase',
      tags: ['opensource', 'github', 'achievement'],
      likes: 312,
      comments: 54,
      views: 1850,
      createdAt: '3 days ago',
      isLiked: true,
      isBookmarked: false
    },
    {
      id: '6',
      author: 'Emma Davis',
      authorAvatar: 'ED',
      authorRole: 'Community Member',
      title: 'Bug: Terminal not working in Safari browser',
      content: 'The integrated terminal seems to have issues in Safari. Console shows WebSocket connection errors. Anyone else experiencing this?',
      category: 'help',
      tags: ['bug', 'terminal', 'safari'],
      likes: 23,
      comments: 12,
      views: 456,
      createdAt: '4 days ago',
      isLiked: false,
      isBookmarked: false,
      isSolved: false
    }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'popular') return b.likes - a.likes;
    if (sortBy === 'trending') return b.views - a.views;
    return 0; // 'latest' is default order
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'discussion':
        return <MessageSquare className="w-4 h-4" />;
      case 'showcase':
        return <Award className="w-4 h-4" />;
      case 'help':
        return <HelpCircle className="w-4 h-4" />;
      case 'announcement':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discussion':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'showcase':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'help':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'announcement':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Community stats
  const stats = {
    totalPosts: 1234,
    activeUsers: 892,
    discussions: 456,
    solved: 234
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-6">Community</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Total Posts</p>
              <p className="text-2xl font-semibold text-white">{stats.totalPosts}</p>
            </div>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Active Users</p>
              <p className="text-2xl font-semibold text-teal-400">{stats.activeUsers}</p>
            </div>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Discussions</p>
              <p className="text-2xl font-semibold text-blue-400">{stats.discussions}</p>
            </div>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Solved</p>
              <p className="text-2xl font-semibold text-green-400">{stats.solved}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search posts, tags, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-sm font-medium">
              New Post
            </button>
          </div>

          {/* Categories and Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {['all', 'discussion', 'showcase', 'help', 'announcement'].map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    activeCategory === category
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                <span>{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {sortedPosts.map(post => (
            <div
              key={post.id}
              className="bg-gray-800/30 border border-gray-700 rounded-lg p-5 hover:bg-gray-800/50 transition-colors"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {post.authorAvatar}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-white">{post.author}</h3>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{post.authorRole}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{post.createdAt}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {post.isPinned && (
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-full text-xs">
                      Pinned
                    </span>
                  )}
                  {post.isSolved && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs">
                      <CheckCircle className="w-3 h-3" />
                      <span>Solved</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <h2 className="text-lg font-medium text-white mb-2 hover:text-teal-400 transition-colors cursor-pointer">
                {post.title}
              </h2>
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {post.content}
              </p>

              {/* Category and Tags */}
              <div className="flex items-center space-x-2 mb-3">
                <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border ${getCategoryColor(post.category)}`}>
                  {getCategoryIcon(post.category)}
                  <span>{post.category}</span>
                </span>
                {post.tags.map(tag => (
                  <span key={tag} className="flex items-center space-x-1 px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                    <Hash className="w-3 h-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <div className="flex items-center space-x-4">
                  <button className={`flex items-center space-x-1 text-sm transition-colors ${post.isLiked ? 'text-teal-400' : 'text-gray-400 hover:text-white'}`}>
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments}</span>
                  </button>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span>{post.views}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className={`p-1.5 rounded transition-colors ${post.isBookmarked ? 'text-teal-400' : 'text-gray-400 hover:text-white'}`}>
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No posts found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}