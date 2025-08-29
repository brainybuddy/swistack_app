'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Code,
  Palette,
  GitBranch,
  Users,
  Lock,
  Shield,
  Globe,
  Monitor,
  Server,
  Terminal,
  Zap
} from 'lucide-react';
import { ProjectSettings, ContainerConfig, BuildConfig, Project } from '@swistack/shared';
import VirusScanStatus from './security/VirusScanStatus';
import ProjectInvitationManager from './invitations/ProjectInvitationManager';

interface ProjectSettingsPanelProps {
  project: Project;
  onProjectUpdate?: (updatedProject: Project) => void;
  className?: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ProjectSettingsPanel({ 
  project, 
  onProjectUpdate, 
  className = '' 
}: ProjectSettingsPanelProps) {
  const { httpClient } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'environment' | 'build' | 'permissions' | 'security'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showEnvValues, setShowEnvValues] = useState<Record<string, boolean>>({});

  // Form state
  const [settings, setSettings] = useState<ProjectSettings>(project.settings || {});
  const [environment, setEnvironment] = useState<Record<string, string>>(project.environment || {});
  const [generalSettings, setGeneralSettings] = useState({
    name: project.name,
    description: project.description || '',
    isPublic: project.isPublic
  });

  // Environment variable management
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'editor', label: 'Editor', icon: Code },
    { id: 'environment', label: 'Environment', icon: Terminal },
    { id: 'build', label: 'Build & Deploy', icon: Zap },
    { id: 'permissions', label: 'Permissions', icon: Users },
    { id: 'security', label: 'Security', icon: Shield }
  ] as const;

  const handleSettingsChange = (key: keyof ProjectSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleContainerConfigChange = (key: keyof ContainerConfig, value: any) => {
    setSettings(prev => ({
      ...prev,
      containerConfig: {
        ...prev.containerConfig,
        [key]: value
      }
    }));
  };

  const handleBuildConfigChange = (key: keyof BuildConfig, value: any) => {
    setSettings(prev => ({
      ...prev,
      buildConfig: {
        ...prev.buildConfig,
        [key]: value
      }
    }));
  };

  const addEnvironmentVariable = () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) {
      setErrors({ env: 'Both key and value are required' });
      return;
    }

    if (!/^[A-Z][A-Z0-9_]*$/.test(newEnvKey)) {
      setErrors({ env: 'Environment key must be uppercase and contain only letters, numbers, and underscores' });
      return;
    }

    setEnvironment(prev => ({
      ...prev,
      [newEnvKey]: newEnvValue
    }));

    setNewEnvKey('');
    setNewEnvValue('');
    setErrors({});
  };

  const removeEnvironmentVariable = (key: string) => {
    setEnvironment(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
    setShowEnvValues(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  };

  const toggleEnvVisibility = (key: string) => {
    setShowEnvValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrors({});

      const updateData = {
        name: generalSettings.name,
        description: generalSettings.description,
        isPublic: generalSettings.isPublic,
        settings,
        environment
      };

      const response = await httpClient.put(`/api/projects/${project.id}`, updateData);

      if (response.success && response.data?.project) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        if (onProjectUpdate) {
          onProjectUpdate(response.data.project);
        }
      } else {
        throw new Error(response.error || 'Failed to update project settings');
      }
    } catch (err) {
      console.error('Error updating project settings:', err);
      setErrors({ general: err instanceof Error ? err.message : 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(project.settings || {});
    setEnvironment(project.environment || {});
    setGeneralSettings({
      name: project.name,
      description: project.description || '',
      isPublic: project.isPublic
    });
    setErrors({});
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Project Name
        </label>
        <input
          type="text"
          value={generalSettings.name}
          onChange={(e) => setGeneralSettings(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={generalSettings.description}
          onChange={(e) => setGeneralSettings(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:border-teal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Visibility
        </label>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setGeneralSettings(prev => ({ ...prev, isPublic: false }))}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              !generalSettings.isPublic
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Private</span>
          </button>
          <button
            onClick={() => setGeneralSettings(prev => ({ ...prev, isPublic: true }))}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              generalSettings.isPublic
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Public</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Template
        </label>
        <div className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-400">
          {project.template}
        </div>
      </div>
    </div>
  );

  const renderEditorTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Theme
        </label>
        <select
          value={settings.theme || 'auto'}
          onChange={(e) => handleSettingsChange('theme', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
        >
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tab Size
        </label>
        <select
          value={settings.tabSize || 2}
          onChange={(e) => handleSettingsChange('tabSize', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
          <option value={8}>8 spaces</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Language
        </label>
        <input
          type="text"
          value={settings.language || ''}
          onChange={(e) => handleSettingsChange('language', e.target.value)}
          placeholder="e.g., javascript, typescript"
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Auto Save</label>
          <button
            onClick={() => handleSettingsChange('autoSave', !settings.autoSave)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.autoSave ? 'bg-teal-600' : 'bg-gray-600'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
              settings.autoSave ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Linting</label>
          <button
            onClick={() => handleSettingsChange('linting', !settings.linting)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.linting ? 'bg-teal-600' : 'bg-gray-600'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
              settings.linting ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Auto Formatting</label>
          <button
            onClick={() => handleSettingsChange('formatting', !settings.formatting)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.formatting ? 'bg-teal-600' : 'bg-gray-600'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
              settings.formatting ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Git Auto Commit</label>
          <button
            onClick={() => handleSettingsChange('gitAutoCommit', !settings.gitAutoCommit)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.gitAutoCommit ? 'bg-teal-600' : 'bg-gray-600'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
              settings.gitAutoCommit ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderEnvironmentTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-4">Environment Variables</h4>
        
        {/* Add new environment variable */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 mb-4">
          <h5 className="text-sm font-medium text-gray-300 mb-3">Add New Variable</h5>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={newEnvKey}
              onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
              placeholder="VARIABLE_NAME"
              className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            />
            <input
              type="text"
              value={newEnvValue}
              onChange={(e) => setNewEnvValue(e.target.value)}
              placeholder="value"
              className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={addEnvironmentVariable}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {errors.env && (
            <p className="text-red-400 text-xs">{errors.env}</p>
          )}
        </div>

        {/* Environment variables list */}
        <div className="space-y-2">
          {Object.entries(environment).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex-1">
                <div className="font-mono text-sm text-white">{key}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <input
                    type={showEnvValues[key] ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => setEnvironment(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={() => toggleEnvVisibility(key)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    {showEnvValues[key] ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeEnvironmentVariable(key)}
                className="p-1 hover:bg-red-600/20 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
          
          {Object.keys(environment).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No environment variables configured
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBuildTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-4">Build Configuration</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Build Command
            </label>
            <input
              type="text"
              value={settings.buildConfig?.buildCommand || ''}
              onChange={(e) => handleBuildConfigChange('buildCommand', e.target.value)}
              placeholder="npm run build"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Command
            </label>
            <input
              type="text"
              value={settings.buildConfig?.startCommand || ''}
              onChange={(e) => handleBuildConfigChange('startCommand', e.target.value)}
              placeholder="npm start"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Test Command
            </label>
            <input
              type="text"
              value={settings.buildConfig?.testCommand || ''}
              onChange={(e) => handleBuildConfigChange('testCommand', e.target.value)}
              placeholder="npm test"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Install Command
            </label>
            <input
              type="text"
              value={settings.buildConfig?.installCommand || ''}
              onChange={(e) => handleBuildConfigChange('installCommand', e.target.value)}
              placeholder="npm install"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Output Directory
            </label>
            <input
              type="text"
              value={settings.buildConfig?.outputDir || ''}
              onChange={(e) => handleBuildConfigChange('outputDir', e.target.value)}
              placeholder="dist"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-4">Container Configuration</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Docker Image
            </label>
            <input
              type="text"
              value={settings.containerConfig?.image || ''}
              onChange={(e) => handleContainerConfigChange('image', e.target.value)}
              placeholder="node:18-alpine"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Working Directory
            </label>
            <input
              type="text"
              value={settings.containerConfig?.workdir || ''}
              onChange={(e) => handleContainerConfigChange('workdir', e.target.value)}
              placeholder="/app"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Memory Limit
            </label>
            <input
              type="text"
              value={settings.containerConfig?.memory || ''}
              onChange={(e) => handleContainerConfigChange('memory', e.target.value)}
              placeholder="512m"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CPU Limit
            </label>
            <input
              type="text"
              value={settings.containerConfig?.cpu || ''}
              onChange={(e) => handleContainerConfigChange('cpu', e.target.value)}
              placeholder="0.5"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPermissionsTab = () => {
    // Check if user can invite (owners and admins can invite)
    const userRole = project.members?.find(member => member.userId === 'current-user')?.role;
    const canInvite = userRole === 'owner' || (userRole as any) === 'admin';

    return (
      <div className="space-y-6">
        <ProjectInvitationManager 
          projectId={project.id} 
          canInvite={canInvite}
        />
      </div>
    );
  };

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-white mb-4">File Security</h4>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <VirusScanStatus showDetails={true} className="mb-4" />
          
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              All uploaded files are automatically scanned for viruses and malware before being stored.
            </p>
            <p>
              File types are validated and potentially dangerous executables are blocked.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-white mb-4">Project Access</h4>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-300">Project Visibility</span>
            <div className="flex items-center space-x-2">
              {project.isPublic ? (
                <Globe className="w-4 h-4 text-green-400" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-300">
                {project.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {project.isPublic 
              ? 'This project is publicly accessible to all users.'
              : 'This project is only accessible to project members.'
            }
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-white mb-4">Authentication & Access</h4>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">JWT Authentication</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Role-based Access Control</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Encrypted Storage</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-800/30 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-medium text-white">Project Settings</h3>
        </div>
        <div className="flex items-center space-x-2">
          {showSuccess && (
            <div className="flex items-center space-x-1 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex space-x-1 p-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'editor' && renderEditorTab()}
        {activeTab === 'environment' && renderEnvironmentTab()}
        {activeTab === 'build' && renderBuildTab()}
        {activeTab === 'permissions' && renderPermissionsTab()}
        {activeTab === 'security' && renderSecurityTab()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-700">
        <div>
          {errors.general && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.general}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}