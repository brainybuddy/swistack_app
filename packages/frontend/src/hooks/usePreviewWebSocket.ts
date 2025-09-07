import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface PreviewWebSocketOptions {
  projectId: string;
  userId: string;
  token: string;
  onPreviewUpdate?: (data: { html: string; filePath?: string; message?: string }) => void;
  onPreviewError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function usePreviewWebSocket({
  projectId,
  userId,
  token,
  onPreviewUpdate,
  onPreviewError,
  onConnected,
  onDisconnected
}: PreviewWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  // Connect to preview WebSocket
  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io('/preview', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    socket.on('connect', () => {
      console.log('🖥️ Connected to preview WebSocket');
      isConnectedRef.current = true;
      
      // Join project room
      socket.emit('join-project', { projectId, userId, token });
      
      if (onConnected) onConnected();
    });

    socket.on('joined-project', ({ message }) => {
      console.log('✅ Joined preview room:', message);
    });

    socket.on('preview-updated', (data) => {
      console.log('🔄 Preview updated:', data.filePath || 'full refresh');
      if (onPreviewUpdate) {
        onPreviewUpdate({
          html: data.html,
          filePath: data.filePath,
          message: data.message
        });
      }
    });

    socket.on('preview-error', ({ error, filePath }) => {
      console.error('❌ Preview error:', error, filePath);
      if (onPreviewError) onPreviewError(error);
    });

    socket.on('disconnect', () => {
      console.log('🖥️ Disconnected from preview WebSocket');
      isConnectedRef.current = false;
      if (onDisconnected) onDisconnected();
    });

    socket.on('error', ({ message }) => {
      console.error('🖥️ Preview WebSocket error:', message);
      if (onPreviewError) onPreviewError(message);
    });

    socketRef.current = socket;
  }, [projectId, userId, token, onPreviewUpdate, onPreviewError, onConnected, onDisconnected]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-project', { projectId });
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, [projectId]);

  // Send file update
  const updateFile = useCallback((filePath: string, content: string) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit('update-file', {
        projectId,
        filePath,
        content,
        userId,
        token
      });
    } else {
      console.warn('Preview WebSocket not connected, cannot update file');
    }
  }, [projectId, userId, token]);

  // Request preview refresh
  const refreshPreview = useCallback(() => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit('refresh-preview', { projectId, userId, token });
    } else {
      console.warn('Preview WebSocket not connected, cannot refresh');
    }
  }, [projectId, userId, token]);

  // Auto-connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect if connection parameters change
  useEffect(() => {
    if (socketRef.current && isConnectedRef.current) {
      disconnect();
      connect();
    }
  }, [projectId, userId, token]);

  return {
    connect,
    disconnect,
    updateFile,
    refreshPreview,
    isConnected: isConnectedRef.current
  };
}