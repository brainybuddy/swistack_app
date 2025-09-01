'use client';

  import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

  interface User {
    id: string;
    name: string;
    email: string;
  }

  interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Auto-login for demo purposes
    useEffect(() => {
      setUser({
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com'
      });
      setIsAuthenticated(true);
    }, []);

    const signIn = async (email: string, password: string) => {
      try {
        const mockUser = { id: '1', name: 'Demo User', email };
        setUser(mockUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    };

    const signOut = async () => {
      try {
        setUser(null);
        setIsAuthenticated(false);
      } catch (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    };

    return (
      <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  }