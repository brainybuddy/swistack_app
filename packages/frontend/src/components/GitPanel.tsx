'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Upload,
  Download,
  RefreshCw,
  Clock,
  User,
  Hash,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Terminal,
  GitMerge
} from 'lucide-react';
import { GitOperationRequest, GitOperationResponse } from '../../types/shared';

interface GitPanelProps {
  projectId: string;
  className?: string;
}

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  not_added: string[];
  deleted: string[];
  renamed: string[];
  conflicted: string[];
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
}

export default function GitPanel({ projectId, className = '' }: GitPanelProps) {
  const { httpClient } = useAuth();
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [showInitForm, setShowInitForm] = useState(false);
  const [isOperating, setIsOperating] = useState(false);

  useEffect(() => {
    fetchGitStatus();
    fetchCommitHistory();
  }, [projectId]);

  const fetchGitStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await httpClient.get(`/api/git/projects/${projectId}/status`);
      
      if (response.success && response.data) {
        setStatus(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch Git status');
      }
    } catch (err) {
      console.error('Error fetching Git status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Git status');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommitHistory = async () => {
    try {
      const response = await httpClient.get(`/api/git/projects/${projectId}/history?limit=10`);
      
      if (response.success && response.data?.commits) {
        setCommits(response.data.commits);
      }
    } catch (err) {
      console.error('Error fetching commit history:', err);
    }
  };

  const performGitOperation = async (operation: GitOperationRequest): Promise<boolean> => {
    try {
      setIsOperating(true);
      setError(null);
      
      const response = await httpClient.post(`/api/git/projects/${projectId}/operations`, operation);
      
      if (response.success) {
        // Refresh status and history after successful operation
        await Promise.all([fetchGitStatus(), fetchCommitHistory()]);
        return true;
      } else {
        throw new Error(response.error || 'Git operation failed');
      }
    } catch (err) {
      console.error('Git operation failed:', err);
      setError(err instanceof Error ? err.message : 'Git operation failed');
      return false;
    } finally {
      setIsOperating(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    const success = await performGitOperation({
      operation: 'commit',
      message: commitMessage.trim()
    });
    
    if (success) {
      setCommitMessage('');
    }
  };

  const handlePush = async () => {
    await performGitOperation({
      operation: 'push',
      branch: status?.branch,
      remote: 'origin'
    });
  };

  const handlePull = async () => {
    await performGitOperation({
      operation: 'pull',
      branch: status?.branch,
      remote: 'origin'
    });
  };

  const handleCreateBranch = async () => {
    if (!newBranch.trim()) return;
    
    const success = await performGitOperation({
      operation: 'branch',
      branch: newBranch.trim()
    });
    
    if (success) {
      setNewBranch('');
    }
  };

  const handleInitRepo = async () => {
    try {
      setIsOperating(true);
      setError(null);
      
      const response = await httpClient.post(`/api/git/projects/${projectId}/init`, {
        repositoryUrl: remoteUrl.trim() || undefined
      });
      
      if (response.success) {
        setShowInitForm(false);
        setRemoteUrl('');
        await Promise.all([fetchGitStatus(), fetchCommitHistory()]);
      } else {
        throw new Error(response.error || 'Failed to initialize repository');
      }
    } catch (err) {
      console.error('Repository initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Repository initialization failed');
    } finally {
      setIsOperating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = () => {
    if (!status) return <AlertCircle className="w-4 h-4 text-gray-500" />;
    
    const hasChanges = status.staged.length > 0 || status.modified.length > 0 || 
                     status.not_added.length > 0 || status.deleted.length > 0;
    
    if (hasChanges) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  if (isLoading && !status) {
    return (
      <div className={`bg-gray-800/30 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Show initialization form if no Git status (repository not initialized)
  if (error && error.includes('not a git repository') || showInitForm) {
    return (
      <div className={`bg-gray-800/30 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <GitBranch className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-medium text-white">Initialize Git Repository</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repository URL (optional)
            </label>
            <input
              type="text"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="https://github.com/username/repository.git"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to initialize a new repository
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleInitRepo}
              disabled={isOperating}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
            >
              {isOperating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Initialize</span>
            </button>
            <button
              onClick={() => setShowInitForm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/30 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-medium text-white">Git</h3>
          {getStatusIcon()}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchGitStatus}
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {status && (
        <div className="space-y-4">
          {/* Branch Info */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-teal-400" />
              <span className="text-white font-medium">{status.branch}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              {status.ahead > 0 && (
                <span className="flex items-center space-x-1">
                  <Upload className="w-3 h-3" />
                  <span>{status.ahead}</span>
                </span>
              )}
              {status.behind > 0 && (
                <span className="flex items-center space-x-1">
                  <Download className="w-3 h-3" />
                  <span>{status.behind}</span>
                </span>
              )}
            </div>
          </div>

          {/* Status Summary */}
          {(status.staged.length > 0 || status.modified.length > 0 || 
            status.not_added.length > 0 || status.deleted.length > 0) && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Changes</h4>
              <div className="space-y-1 text-xs">
                {status.staged.length > 0 && (
                  <div className="text-green-400">
                    {status.staged.length} staged for commit
                  </div>
                )}
                {status.modified.length > 0 && (
                  <div className="text-yellow-400">
                    {status.modified.length} modified
                  </div>
                )}
                {status.not_added.length > 0 && (
                  <div className="text-red-400">
                    {status.not_added.length} untracked
                  </div>
                )}
                {status.deleted.length > 0 && (
                  <div className="text-red-400">
                    {status.deleted.length} deleted
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commit Section */}
          <div className="space-y-2">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-teal-500"
              rows={2}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || isOperating}
                className="flex items-center space-x-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded text-sm transition-colors"
              >
                <GitCommit className="w-4 h-4" />
                <span>Commit</span>
                {isOperating && <Loader2 className="w-3 h-3 animate-spin" />}
              </button>
              <button
                onClick={handlePush}
                disabled={isOperating || status.ahead === 0}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Push</span>
              </button>
              <button
                onClick={handlePull}
                disabled={isOperating}
                className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Pull</span>
              </button>
            </div>
          </div>

          {/* Branch Management */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                placeholder="New branch name..."
                className="flex-1 px-3 py-1.5 bg-gray-800/50 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleCreateBranch}
                disabled={!newBranch.trim() || isOperating}
                className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Branch</span>
              </button>
            </div>
          </div>

          {/* Recent Commits */}
          {commits.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Recent Commits</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {commits.map((commit) => (
                  <div
                    key={commit.hash}
                    className="p-2 bg-gray-800/50 rounded border border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{commit.message}</p>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{commit.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(commit.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 ml-2">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono">{commit.hash.substring(0, 7)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}