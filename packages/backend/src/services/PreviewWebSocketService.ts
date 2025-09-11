import { Server, Socket } from 'socket.io';
import { LivePreviewService } from './LivePreviewService';
import { WebSocketService } from './WebSocketService';

export class PreviewWebSocketService {
  private io: Server;
  private previewClients: Map<string, Set<Socket>> = new Map(); // projectId -> Set of sockets

  constructor(io: Server) {
    this.io = io;
    this.setupPreviewNamespace();
  }

  private setupPreviewNamespace() {
    const previewNamespace = this.io.of('/preview');
    
    previewNamespace.on('connection', (socket) => {
      console.log('🖥️ Preview client connected:', socket.id);

      // Join project room
      socket.on('join-project', ({ projectId, userId, token }) => {
        this.handleJoinProject(socket, projectId, userId, token);
      });

      // Leave project room
      socket.on('leave-project', ({ projectId }) => {
        this.handleLeaveProject(socket, projectId);
      });

      // Handle file updates from AI agent or editor
      socket.on('update-file', async ({ projectId, filePath, content, userId, token }) => {
        await this.handleFileUpdate(socket, projectId, filePath, content, userId, token);
      });

      // Request preview refresh
      socket.on('refresh-preview', ({ projectId, userId, token }) => {
        this.handleRefreshPreview(socket, projectId, userId, token);
      });

      socket.on('disconnect', () => {
        console.log('🖥️ Preview client disconnected:', socket.id);
        // Clean up project rooms
        for (const [projectId, clients] of this.previewClients) {
          clients.delete(socket);
          if (clients.size === 0) {
            this.previewClients.delete(projectId);
          }
        }
      });
    });
  }

  private async handleJoinProject(
    socket: Socket, 
    projectId: string, 
    userId: string, 
    token: string
  ) {
    try {
      // TODO: Verify token and user permissions
      // For now, assume valid if projectId and userId are provided
      
      if (!projectId || !userId) {
        socket.emit('error', { message: 'Project ID and User ID are required' });
        return;
      }

      // Add to project room
      if (!this.previewClients.has(projectId)) {
        this.previewClients.set(projectId, new Set());
      }
      this.previewClients.get(projectId)!.add(socket);

      socket.join(`preview:${projectId}`);
      socket.emit('joined-project', { projectId, message: 'Joined preview room' });
      
      console.log(`🖥️ Client ${socket.id} joined preview for project ${projectId}`);
    } catch (error) {
      console.error('Error joining project preview:', error);
      socket.emit('error', { message: 'Failed to join project preview' });
    }
  }

  private handleLeaveProject(socket: Socket, projectId: string) {
    if (this.previewClients.has(projectId)) {
      this.previewClients.get(projectId)!.delete(socket);
      if (this.previewClients.get(projectId)!.size === 0) {
        this.previewClients.delete(projectId);
      }
    }
    socket.leave(`preview:${projectId}`);
    console.log(`🖥️ Client ${socket.id} left preview for project ${projectId}`);
  }

  private async handleFileUpdate(
    socket: Socket,
    projectId: string,
    filePath: string,
    content: string,
    userId: string,
    token: string
  ) {
    try {
      // Update file and generate new preview
      const result = await LivePreviewService.updateFileAndGeneratePreview(
        projectId,
        userId,
        filePath,
        content
      );

      if (result.success && result.html) {
        // Broadcast updated preview to all clients in the project room
        socket.to(`preview:${projectId}`).emit('preview-updated', {
          projectId,
          filePath,
          html: result.html,
          timestamp: Date.now()
        });

        // Also send to the sender
        socket.emit('preview-updated', {
          projectId,
          filePath,
          html: result.html,
          timestamp: Date.now()
        });

        console.log(`🔄 Preview updated for project ${projectId}, file: ${filePath}`);
      } else {
        socket.emit('preview-error', {
          projectId,
          filePath,
          error: result.error || 'Unknown error',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating file preview:', error);
      socket.emit('preview-error', {
        projectId,
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  private async handleRefreshPreview(
    socket: Socket,
    projectId: string,
    userId: string,
    token: string
  ) {
    try {
      const previewProject = await LivePreviewService.getProjectForPreview(projectId, userId);
      if (previewProject) {
        const html = await LivePreviewService.compileProjectToHTML(previewProject);
        
        socket.emit('preview-updated', {
          projectId,
          html,
          timestamp: Date.now()
        });
      } else {
        socket.emit('preview-error', {
          projectId,
          error: 'Project not found or access denied',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error refreshing preview:', error);
      socket.emit('preview-error', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Broadcast preview update to all clients viewing a project
   * Used by AI agent or other services
   */
  public async broadcastPreviewUpdate(
    projectId: string,
    userId: string,
    filePath?: string,
    message?: string
  ) {
    try {
      const previewProject = await LivePreviewService.getProjectForPreview(projectId, userId);
      if (previewProject) {
        const html = await LivePreviewService.compileProjectToHTML(previewProject);
        
        this.io.to(`preview:${projectId}`).emit('preview-updated', {
          projectId,
          filePath,
          html,
          message: message || 'Preview updated by AI agent',
          timestamp: Date.now()
        });

        console.log(`🤖 AI agent updated preview for project ${projectId}`);
      }
    } catch (error) {
      console.error('Error broadcasting preview update:', error);
    }
  }

  /**
   * Get number of clients viewing a project
   */
  public getProjectViewers(projectId: string): number {
    return this.previewClients.get(projectId)?.size || 0;
  }

  /**
   * Get all active preview projects
   */
  public getActiveProjects(): string[] {
    return Array.from(this.previewClients.keys());
  }
}
