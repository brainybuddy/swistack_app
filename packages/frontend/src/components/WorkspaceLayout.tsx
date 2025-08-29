'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LogoutModal from '@/components/LogoutModal';
import {
  Home,
  Layout,
  Code2,
  Database,
  Cloud,
  GitBranch,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Bell,
  User,
  Terminal,
  FileCode2,
  Boxes,
  Shield,
  Zap,
  Globe,
  Rocket,
  UserPlus,
  CreditCard
} from 'lucide-react';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: any) => void;
}

export default function WorkspaceLayout({ children, activeView, onViewChange }: WorkspaceLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Debug user data
  console.log('WorkspaceLayout - Current user data:', user);
  console.log('WorkspaceLayout - User avatar:', user?.avatar);
  console.log('WorkspaceLayout - Avatar type:', typeof user?.avatar);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, badge: null },
    { id: 'templates', label: 'Templates', icon: Layout, badge: null },
    { id: 'mycodes', label: 'Repositories', icon: GitBranch, badge: null },
    { id: 'deployments', label: 'Deployments', icon: Rocket, badge: null },
    { id: 'teams', label: 'Teams', icon: UserPlus, badge: null },
    { id: 'community', label: 'Community', icon: Users, badge: null },
  ];

  const bottomMenuItems = [
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogoutClick = () => {
    setShowUserMenu(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gray-900/50 border-r border-gray-800 flex flex-col transition-all duration-300 h-screen sticky top-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && <span className="text-lg font-bold">Swistack</span>}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 hover:bg-gray-800 rounded-lg transition-colors ${sidebarCollapsed ? 'mx-auto mt-2' : ''}`}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                activeView === item.id 
                  ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                  : 'hover:bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.badge && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  item.badge === 'NEW' 
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-gray-800 space-y-1 flex-shrink-0">
          {bottomMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                activeView === item.id 
                  ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                  : 'hover:bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-gray-900/50 border-b border-gray-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-white">
              {activeView === 'templates' && 'Templates'}
              {activeView === 'home' && 'Home'}
              {activeView === 'mycodes' && 'Repositories'}
              {activeView === 'deployments' && 'Deployments'}
              {activeView === 'teams' && 'Teams'}
              {activeView === 'community' && 'Community'}
              {activeView === 'billing' && 'Billing'}
              {activeView === 'settings' && 'Settings'}
            </h2>
          </div>
          
          {/* Right side - User menu */}
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            
            {/* User Avatar and Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-800 rounded-lg transition-colors"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium hidden md:block">{user?.firstName} {user?.lastName}</span>
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onViewChange('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        userName={user?.firstName}
        isLoading={isLoggingOut}
      />
    </div>
  );
}