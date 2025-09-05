'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
  projectId?: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, projectId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user, token } = useAuth();

  useEffect(() => {
    console.log('SocketProvider useEffect:', { isAuthenticated, user: user?.email, token: token?.substring(0, 20) + '...' });
    
    if (isAuthenticated && user) {
      console.log('Attempting to create socket connection...');
      
      // Create socket connection with authentication
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        auth: {
          userId: user.id,
          token: token || undefined
        },
        query: projectId ? { projectId } : undefined
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.error('Connection error details:', { 
          message: error.message, 
          description: error.description,
          type: error.type 
        });
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount or auth change
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Cleanup socket when not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user, token, projectId]);

  // Join project room when socket is available
  useEffect(() => {
    if (socket && isConnected) {
      // Auto-join project rooms based on URL or project context
      // This could be moved to individual components or pages as needed
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
