'use client';

  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { BookOpen, User, LogOut } from 'lucide-react';
  import SignOutModal from './SignOutModal';
  import { useAuth } from '@/lib/auth/AuthContext';

  export default function Navbar() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

    const handleSignOut = async () => {
      try {
        await signOut();
        setIsSignOutModalOpen(false);
        router.push('/');
      } catch (error) {
        console.error('Sign out error:', error);
      }
    };

    return (
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold">EduLearn</span>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-4">
              <button className="flex items-center text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
                <User className="h-5 w-5" />
                <span className="ml-1 text-sm">{user?.name || 'Guest'}</span>
              </button>
              <button 
                onClick={() => setIsSignOutModalOpen(true)}
                className="flex items-center text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-1 text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />
      </nav>
    );
  }