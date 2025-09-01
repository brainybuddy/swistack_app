import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  projectId?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface WebSocketEvents {
  'ai:thinking': () => void;
  'ai:response': (data: any) => void;
  'ai:actionStarted': (data: any) => void;
  'ai:actionCompleted': (data: any) => void;
  'ai:actionFailed': (data: any) => void;
  'ai:progress': (data: any) => void;
  'ai:output': (data: any) => void;
  'ai:status': (data: any) => void;
  'file:changed': (data: any) => void;
  'terminal:output': (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, Function>>(new Map());

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No auth token found for WebSocket connection');
      return;
    }

    // Connect to WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
      query: options.projectId ? { projectId: options.projectId } : {},
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      options.onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      options.onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      setConnectionError(error.message);
      options.onError?.(error);
    });

    // Project joined confirmation
    socket.on('project:joined', (data) => {
      console.log('Joined project room:', data.projectId);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log('Cleaning up WebSocket connection');
        socket.disconnect();
      }
    };
  }, [options.projectId]); // Reconnect if projectId changes

  // Generic event listener registration
  const on = useCallback(<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ) => {
    if (!socketRef.current) {
      console.warn('Cannot add event listener: socket not connected');
      return;
    }

    // Remove old handler if exists
    const oldHandler = eventHandlersRef.current.get(event);
    if (oldHandler) {
      socketRef.current.off(event, oldHandler as any);
    }

    // Add new handler
    socketRef.current.on(event, handler as any);
    eventHandlersRef.current.set(event, handler);

    // Return cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler as any);
        eventHandlersRef.current.delete(event);
      }
    };
  }, []);

  // Emit event to server
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current || !isConnected) {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return;
    }

    socketRef.current.emit(event, data);
  }, [isConnected]);

  // Clean up all event handlers
  const removeAllListeners = useCallback(() => {
    if (!socketRef.current) return;

    eventHandlersRef.current.forEach((handler, event) => {
      socketRef.current?.off(event, handler as any);
    });
    eventHandlersRef.current.clear();
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    on,
    emit,
    removeAllListeners,
  };
}