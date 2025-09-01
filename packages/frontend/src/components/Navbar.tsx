'use client';

import { useState } from 'react';
import { BookOpen, User, Menu, X, Search, Bell, LogOut, Settings } from 'lucide-react';
import SignOutModal from './SignOutModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsSignOutModalOpen(false);
    router.push('/login');
  };

  const handleProfileSettings = () => {
    router.push('/settings');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EduLearn</span>
            </div>
          </div>

          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
            <button className="flex items-center text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
              <User className="h-5 w-5" />
              <span className="ml-1 text-sm">Profile</span>
            </button>
            <button 
              onClick={handleProfileSettings}
              className="flex items-center text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
              <span className="ml-1 text-sm">Settings</span>
            </button>
            <button 
              onClick={() => setIsSignOutModalOpen(true)}
              className="flex items-center text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-1 text-sm">Sign Out</span>
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                Notifications
              </button>
              <button className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                Profile
              </button>
              <button 
                onClick={handleProfileSettings}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Settings
              </button>
              <button 
                onClick={() => setIsSignOutModalOpen(true)}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />
    </nav>
  );
}