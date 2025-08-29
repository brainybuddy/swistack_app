'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import TemplatesView from '@/components/TemplatesView';
import RepositoriesView from '@/components/RepositoriesView';
import DeploymentsView from '@/components/DeploymentsView';
import TeamsView from '@/components/TeamsView';
import CommunityView from '@/components/CommunityView';
import BillingView from '@/components/BillingView';
import SettingsView from '@/components/SettingsView';
import { 
  Code2, 
  Rocket, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Users, 
  Star,
  Play,
  BookOpen,
  Zap,
  Globe,
  Database,
  Terminal,
  GitBranch,
  Search,
  Cloud,
  UserPlus,
  Settings
} from 'lucide-react';
import AIProjectCreationModal from '@/components/AIProjectCreationModal';

export default function WorkspacePage() {
  const [activeView, setActiveView] = useState<'home' | 'templates' | 'mycodes' | 'deployments' | 'teams' | 'community' | 'billing' | 'settings'>('home');
  const [projectPrompt, setProjectPrompt] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleTemplateSelect = (template: any) => {
    // Navigate to editor with template data
    const templateData = encodeURIComponent(JSON.stringify(template));
    router.push(`/editor?template=${templateData}`);
  };


  const recentActivity = [
    { type: 'project', name: 'Personal Website', time: '2 hours ago', status: 'building' },
    { type: 'template', name: 'React Starter', time: '1 day ago', status: 'completed' },
    { type: 'deployment', name: 'E-commerce API', time: '2 days ago', status: 'success' },
  ];

  const renderHomeView = () => (
    <div className="p-6">
      {/* Create with AI */}
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-semibold text-white mb-2 text-center">Create</h1>
        <p className="text-gray-400 text-sm mb-6 text-center">Describe what you want to build</p>
        <div className="relative">
          <textarea
            value={projectPrompt}
            onChange={(e) => setProjectPrompt(e.target.value)}
            placeholder="Build a todo app with React and TypeScript..."
            className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-teal-500 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                if (projectPrompt.trim()) {
                  setShowAIModal(true);
                }
              }
            }}
          />
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            <span className="text-xs text-gray-500">Press ⌘+Enter</span>
            <button
              onClick={() => {
                if (projectPrompt.trim()) {
                  setShowAIModal(true);
                }
              }}
              disabled={!projectPrompt.trim()}
              className="px-4 py-1.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <button
            onClick={() => setActiveView('templates')}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Or browse templates →
          </button>
        </div>
        
        {/* Example Prompts */}
        <div className="mt-8">
          <p className="text-xs text-gray-500 mb-3">Try these examples:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'A personal portfolio website with dark mode',
              'REST API with JWT authentication',
              'Real-time chat application using WebSockets',
              'Machine learning model for image classification'
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => setProjectPrompt(prompt)}
                className="text-left p-3 bg-gray-800/30 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Recent - aligned with examples */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-white mb-4">Recent</h2>
          <div className="space-y-2">
            {recentActivity.slice(0, 3).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'building' ? 'bg-yellow-500' :
                  activity.status === 'completed' ? 'bg-green-500' : 'bg-teal-500'
                }`}></div>
                <Code2 className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm font-medium">{activity.name}</span>
                <span className="text-gray-500 text-xs ml-auto">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlaceholderView = (title: string, description: string, icon: any) => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <p className="text-gray-400 mb-8 max-w-md">{description}</p>
        <button className="px-6 py-3 bg-teal-600 rounded-xl font-semibold hover:bg-teal-700 transition-colors">
          Coming Soon
        </button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requireAuth={true}>
      <WorkspaceLayout 
        activeView={activeView} 
        onViewChange={setActiveView}
      >
        {activeView === 'home' && renderHomeView()}
        {activeView === 'templates' && (
          <TemplatesView 
            onSelectTemplate={handleTemplateSelect}
          />
        )}
        {activeView === 'mycodes' && <RepositoriesView />}
        {activeView === 'deployments' && <DeploymentsView />}
        {activeView === 'teams' && <TeamsView />}
        {activeView === 'community' && <CommunityView />}
        {activeView === 'billing' && <BillingView />}
        {activeView === 'settings' && <SettingsView />}
      </WorkspaceLayout>
      
      {/* AI Project Creation Modal */}
      <AIProjectCreationModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        projectDescription={projectPrompt}
      />
    </ProtectedRoute>
  );
}