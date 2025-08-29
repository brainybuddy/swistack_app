'use client';

import { useState } from 'react';
import {
  Rocket,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Globe,
  GitBranch,
  Activity,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Settings,
  TrendingUp,
  TrendingDown,
  Server
} from 'lucide-react';

interface Deployment {
  id: string;
  projectName: string;
  environment: 'production' | 'staging' | 'development';
  status: 'success' | 'failed' | 'pending' | 'building';
  branch: string;
  commit: string;
  url: string;
  deployedBy: string;
  deployedAt: string;
  duration: string;
}

export default function DeploymentsView() {
  const [filterEnvironment, setFilterEnvironment] = useState<'all' | 'production' | 'staging' | 'development'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'pending' | 'building'>('all');

  const deployments: Deployment[] = [
    {
      id: '1',
      projectName: 'portfolio-website',
      environment: 'production',
      status: 'success',
      branch: 'main',
      commit: 'feat: add contact form',
      url: 'https://portfolio.app',
      deployedBy: 'John Doe',
      deployedAt: '10 minutes ago',
      duration: '2m 15s'
    },
    {
      id: '2',
      projectName: 'api-backend',
      environment: 'staging',
      status: 'building',
      branch: 'develop',
      commit: 'fix: resolve database connection issue',
      url: 'https://staging-api.app',
      deployedBy: 'Jane Smith',
      deployedAt: '5 minutes ago',
      duration: '1m 30s'
    },
    {
      id: '3',
      projectName: 'mobile-app',
      environment: 'production',
      status: 'failed',
      branch: 'main',
      commit: 'update: dependencies',
      url: 'https://mobile.app',
      deployedBy: 'Mike Johnson',
      deployedAt: '2 hours ago',
      duration: '3m 45s'
    },
    {
      id: '4',
      projectName: 'machine-learning-project',
      environment: 'development',
      status: 'success',
      branch: 'feature/new-model',
      commit: 'feat: implement new classification model',
      url: 'https://dev-ml.app',
      deployedBy: 'Sarah Wilson',
      deployedAt: '1 day ago',
      duration: '5m 12s'
    },
    {
      id: '5',
      projectName: 'microservices-template',
      environment: 'staging',
      status: 'success',
      branch: 'release/v2.0',
      commit: 'chore: prepare for release',
      url: 'https://staging-services.app',
      deployedBy: 'Alex Brown',
      deployedAt: '2 days ago',
      duration: '4m 8s'
    },
    {
      id: '6',
      projectName: 'data-pipeline',
      environment: 'production',
      status: 'pending',
      branch: 'main',
      commit: 'perf: optimize data processing',
      url: 'https://pipeline.app',
      deployedBy: 'Chris Lee',
      deployedAt: 'Scheduled',
      duration: '-'
    }
  ];

  const filteredDeployments = deployments.filter(deployment => {
    const matchesEnvironment = filterEnvironment === 'all' || deployment.environment === filterEnvironment;
    const matchesStatus = filterStatus === 'all' || deployment.status === filterStatus;
    return matchesEnvironment && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'building':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'staging':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'development':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Stats
  const stats = {
    total: deployments.length,
    successful: deployments.filter(d => d.status === 'success').length,
    failed: deployments.filter(d => d.status === 'failed').length,
    pending: deployments.filter(d => d.status === 'pending' || d.status === 'building').length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Deployments</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Deployments</p>
                <p className="text-2xl font-semibold text-white">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-teal-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Successful</p>
                <p className="text-2xl font-semibold text-green-400">{stats.successful}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Failed</p>
                <p className="text-2xl font-semibold text-red-400">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">In Progress</p>
                <p className="text-2xl font-semibold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Environment:</span>
            <div className="flex items-center space-x-1">
              {['all', 'production', 'staging', 'development'].map((env) => (
                <button
                  key={env}
                  onClick={() => setFilterEnvironment(env as any)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    filterEnvironment === env
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Status:</span>
            <div className="flex items-center space-x-1">
              {['all', 'success', 'failed', 'pending', 'building'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    filterStatus === status
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-3">
        {filteredDeployments.map(deployment => (
          <div
            key={deployment.id}
            className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusIcon(deployment.status)}
                
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-sm font-medium text-white">{deployment.projectName}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${getEnvironmentColor(deployment.environment)}`}>
                      {deployment.environment}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <GitBranch className="w-3 h-3" />
                      <span>{deployment.branch}</span>
                    </div>
                    <span className="text-gray-500">•</span>
                    <span>{deployment.commit}</span>
                    <span className="text-gray-500">•</span>
                    <span>by {deployment.deployedBy}</span>
                    <span className="text-gray-500">•</span>
                    <span>{deployment.deployedAt}</span>
                    {deployment.duration !== '-' && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span>Duration: {deployment.duration}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {deployment.status === 'success' && (
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe className="w-3 h-3" />
                    <span>View Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                
                {deployment.status === 'failed' && (
                  <button className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors">
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
                
                {deployment.status === 'building' && (
                  <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
                    <Pause className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                )}
                
                <button className="p-1.5 hover:bg-gray-700 rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDeployments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
            <Rocket className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No deployments found</h3>
          <p className="text-gray-400 text-sm">Try adjusting your filters or deploy a project</p>
        </div>
      )}
    </div>
  );
}