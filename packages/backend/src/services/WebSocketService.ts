import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { aiOrchestrator, OrchestratorEvent } from './ai/AIOrchestrator';
import { authenticateSocket } from '../middleware/socketAuth';

export class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private projectRooms: Map<string, Set<string>> = new Map(); // projectId -> socketIds

  constructor(io: SocketIOServer) {
    this.io = io;

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupAIOrchestratorListeners();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(authenticateSocket);
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);
      
      const userId = (socket as any).userId;
      const projectId = socket.handshake.query.projectId as string;

      // Track user socket
      if (userId) {
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socket.id);
      }

      // Join project room
      if (projectId) {
        socket.join(`project:${projectId}`);
        if (!this.projectRooms.has(projectId)) {
          this.projectRooms.set(projectId, new Set());
        }
        this.projectRooms.get(projectId)!.add(socket.id);
        
        socket.emit('project:joined', { projectId });
      }

      // AI Assistant events (legacy orchestrator)
      socket.on('ai:chat', async (data) => {
        const { projectId, message, conversationId, options } = data;
        
        try {
          // Send typing indicator
          socket.emit('ai:thinking', { projectId });
          
          // Process through orchestrator
          const result = await aiOrchestrator.processChat(
            projectId,
            message,
            conversationId,
            options
          );

          // Send response
          socket.emit('ai:response', {
            projectId,
            response: result.response,
            actions: result.executedActions,
            results: result.results
          });
        } catch (error) {
          socket.emit('ai:error', {
            projectId,
            error: error instanceof Error ? error.message : 'AI processing failed'
          });
        }
      });

      // Mistral Agent events
      socket.on('agent:message', async (data) => {
        const { conversationId, message } = data;
        
        try {
          // Import here to avoid circular dependency
          const { mistralAgentService } = await import('./ai/MistralAgentService');
          
          // Verify conversation belongs to user
          const conversation = mistralAgentService.getConversation(conversationId);
          if (!conversation || conversation.userId !== userId) {
            socket.emit('agent:error', { error: 'Conversation not found' });
            return;
          }

          // Send typing indicator
          socket.emit('agent:thinking', { conversationId });
          
          // Stream response from agent
          const responseStream = await mistralAgentService.sendMessage(conversationId, message);
          
          for await (const chunk of responseStream) {
            socket.emit('agent:stream', {
              conversationId,
              ...chunk
            });
          }

          socket.emit('agent:complete', { conversationId });
        } catch (error) {
          socket.emit('agent:error', {
            conversationId,
            error: error instanceof Error ? error.message : 'Agent processing failed'
          });
        }
      });

      // Execute AI action
      socket.on('ai:executeAction', async (data) => {
        const { projectId, action } = data;
        
        try {
          const result = await aiOrchestrator.executeAction(projectId, action);
          
          socket.emit('ai:actionResult', {
            projectId,
            action,
            result
          });
        } catch (error) {
          socket.emit('ai:actionError', {
            projectId,
            action,
            error: error instanceof Error ? error.message : 'Action execution failed'
          });
        }
      });

      // Terminal events
      socket.on('terminal:command', async (data) => {
        const { projectId, sessionId, command } = data;
        
        // Broadcast to project room
        this.io.to(`project:${projectId}`).emit('terminal:output', {
          sessionId,
          type: 'command',
          data: `$ ${command}`
        });
      });

      // File events
      socket.on('file:changed', (data) => {
        const { projectId, filePath, changeType } = data;
        
        // Broadcast to project room except sender
        socket.to(`project:${projectId}`).emit('file:updated', {
          filePath,
          changeType,
          timestamp: new Date()
        });
      });

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
        
        // Remove from user sockets
        if (userId) {
          const userSocketSet = this.userSockets.get(userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(userId);
            }
          }
        }

        // Remove from project rooms
        if (projectId) {
          const projectSocketSet = this.projectRooms.get(projectId);
          if (projectSocketSet) {
            projectSocketSet.delete(socket.id);
            if (projectSocketSet.size === 0) {
              this.projectRooms.delete(projectId);
              // Cleanup AI orchestrator resources
              aiOrchestrator.cleanup(projectId);
            }
          }
        }
      });
    });
  }

  private setupAIOrchestratorListeners() {
    // Listen to orchestrator events and broadcast to relevant clients
    aiOrchestrator.on('action_started', (event: OrchestratorEvent) => {
      this.broadcastToProject(event.projectId, 'ai:actionStarted', event);
    });

    aiOrchestrator.on('action_completed', (event: OrchestratorEvent) => {
      this.broadcastToProject(event.projectId, 'ai:actionCompleted', event);
    });

    aiOrchestrator.on('action_failed', (event: OrchestratorEvent) => {
      this.broadcastToProject(event.projectId, 'ai:actionFailed', event);
    });

    aiOrchestrator.on('progress', (event: OrchestratorEvent) => {
      this.broadcastToProject(event.projectId, 'ai:progress', event);
    });

    aiOrchestrator.on('output', (event: OrchestratorEvent) => {
      this.broadcastToProject(event.projectId, 'ai:output', event);
    });
  }

  /**
   * Broadcast event to all clients in a project room
   */
  private broadcastToProject(projectId: string | undefined, event: string, data: any) {
    if (projectId) {
      this.io.to(`project:${projectId}`).emit(event, data);
    }
  }

  /**
   * Send event to specific user
   */
  public sendToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Broadcast file change to project
   */
  public broadcastFileChange(projectId: string, filePath: string, changeType: string, content?: string) {
    this.io.to(`project:${projectId}`).emit('file:changed', {
      filePath,
      changeType,
      content,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast terminal output to project
   */
  public broadcastTerminalOutput(projectId: string, sessionId: string, output: string, type: 'output' | 'error' = 'output') {
    this.io.to(`project:${projectId}`).emit('terminal:output', {
      sessionId,
      type,
      data: output,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast AI status update
   */
  public broadcastAIStatus(projectId: string, status: 'thinking' | 'executing' | 'completed' | 'error', details?: any) {
    this.io.to(`project:${projectId}`).emit('ai:status', {
      status,
      details,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast agent message to user
   */
  public broadcastAgentMessage(userId: string, data: any) {
    this.sendToUser(userId, 'agent:broadcast', data);
  }

  /**
   * Broadcast agent tool call to project
   */
  public broadcastAgentToolCall(projectId: string, toolCall: any) {
    this.io.to(`project:${projectId}`).emit('agent:toolCall', {
      ...toolCall,
      timestamp: new Date()
    });
  }
}

// Export singleton instance (to be initialized in server.ts)
let webSocketService: WebSocketService | null = null;

export const initializeWebSocket = (io: SocketIOServer): WebSocketService => {
  if (!webSocketService) {
    webSocketService = new WebSocketService(io);
  }
  return webSocketService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketService) {
    throw new Error('WebSocket service not initialized');
  }
  return webSocketService;
};