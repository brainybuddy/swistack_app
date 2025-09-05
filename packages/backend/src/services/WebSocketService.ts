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
            console.warn('[WS][agent:message] Conversation not found or user mismatch', {
              conversationId,
              socketUserId: userId,
              hasConversation: !!conversation,
              convUserId: conversation?.userId
            });
            socket.emit('agent:error', { error: 'Conversation not found' });
            return;
          }

          // Send typing indicator
          socket.emit('agent:thinking', { conversationId });

          // Deterministic tool usage for codebase queries (search/read/count/list)
          try {
            const lower = (message || '').toLowerCase().trim();
            let forcedTool: { tool: 'count_files'|'list_tree'|'read_file'|'search_files'; params?: any } | null = null;
            if (/\b(how many files|file count|count files)\b/.test(lower)) {
              forcedTool = { tool: 'count_files' };
            } else if (/\b(list (files|tree)|show files)\b/.test(lower)) {
              forcedTool = { tool: 'list_tree' };
            } else if (/\b(search|find)\b/.test(lower)) {
              const m = message.match(/(?:search|find)(?:\s+for)?\s+(.+)/i);
              const query = m ? m[1].trim().replace(/[.?!]$/, '') : '';
              if (query) forcedTool = { tool: 'search_files', params: { query } };
            } else if (/\b(read|open|show)\b/i.test(message)) {
              const pm = message.match(/[\w./-]+\.(?:js|jsx|ts|tsx|json|md|css|html|cjs|mjs)/i);
              if (pm) forcedTool = { tool: 'read_file', params: { path: pm[0] } };
            }

            if (forcedTool && projectId) {
              const { ProjectFileModel } = await import('../models/ProjectFile');
              const { storageService } = await import('../services/StorageService');
              const { projectFileSystem } = await import('../services/ProjectFileSystem');
              // Ensure project is initialized for filesystem fallback
              try { await projectFileSystem.initializeProject(projectId, {}); } catch {}
              let result: any = null;
              switch (forcedTool.tool) {
                case 'count_files': {
                  const all = await ProjectFileModel.getProjectTree(projectId);
                  if (all.length > 0) {
                    result = { count: all.length };
                  } else {
                    const filesFs = await projectFileSystem.searchFiles(projectId, '', { maxResults: 10000 });
                    result = { count: filesFs.length };
                  }
                  break;
                }
                case 'list_tree': {
                  const all = await ProjectFileModel.getProjectTree(projectId);
                  const topLevelOnly = /top[- ]?level/.test(lower);
                  if (topLevelOnly) {
                    const set = new Set<string>();
                    const list: any[] = [];
                    for (const f of all) {
                      const root = (f.path || '').split('/')[0];
                      if (root && !set.has(root)) {
                        set.add(root);
                        const isDir = all.some(x => x.path.startsWith(root + '/'));
                        list.push({ path: root, type: isDir ? 'directory' : 'file' });
                      }
                    }
                    result = list;
                  } else if (all.length > 0) {
                    result = all.map(f => ({ path: f.path, type: f.type }));
                  } else {
                    // Fallback: list files from filesystem (files only)
                    const filesFs = await projectFileSystem.searchFiles(projectId, '', { maxResults: 2000 });
                    result = filesFs.map(f => ({ path: f.path, type: 'file' }));
                  }
                  break;
                }
                case 'search_files': {
                  const q = (forcedTool.params?.query as string) || '';
                  const qLower = q.toLowerCase().trim();
                  const score = (p: string, n: string) => {
                    const name = (n || '').toLowerCase();
                    const pathStr = (p || '').toLowerCase();
                    if (name === qLower) return 100;
                    if (pathStr === qLower) return 95;
                    if (pathStr.endsWith('/' + qLower)) return 90;
                    if (name.includes(qLower)) return 80;
                    if (pathStr.includes('/' + qLower)) return 70;
                    if (pathStr.includes(qLower)) return 60;
                    return 10; // likely content-only match
                  };
                  const byPath = new Map<string, { path: string; name: string; s: number }>();
                  // DB search first
                  const dbMatches = await ProjectFileModel.searchFiles(projectId, q, 500);
                  for (const m of dbMatches || []) {
                    const s = score(m.path, m.name);
                    const prev = byPath.get(m.path);
                    if (!prev || s > prev.s) byPath.set(m.path, { path: m.path, name: m.name, s });
                  }
                  // If no strong matches, augment with filesystem results
                  const maxDbScore = Math.max(0, ...Array.from(byPath.values()).map(v => v.s));
                  if (maxDbScore < 60) {
                    const filesFs = await projectFileSystem.searchFiles(projectId, q, { maxResults: 1000 });
                    for (const f of filesFs) {
                      const name = f.path.split('/').pop() || f.path;
                      const s = score(f.path, name);
                      const prev = byPath.get(f.path);
                      if (!prev || s > prev.s) byPath.set(f.path, { path: f.path, name, s });
                    }
                  }
                  // Sort by score desc, then path asc
                  const sorted = Array.from(byPath.values()).sort((a,b) => b.s - a.s || a.path.localeCompare(b.path)).slice(0, 200);
                  result = sorted.map(v => ({ path: v.path, name: v.name }));
                  break;
                }
                case 'read_file': {
                  const p = forcedTool.params?.path as string;
                  let file = await ProjectFileModel.findByPath(projectId, p);
                  if (!file) {
                    // Try by basename when exact path isn't found
                    const pathMod = await import('path');
                    const base = pathMod.basename(p);
                    const candidates = await ProjectFileModel.searchFiles(projectId, base, 5);
                    file = candidates.find(c => c.path.endsWith('/' + base) || c.path === base) || candidates[0];
                  }
                  if (file) {
                    let content = file.content || '';
                    if (!content && file.storageKey) {
                      const buf = await storageService.downloadFile(file.storageKey);
                      content = buf.toString(file.encoding as BufferEncoding);
                    }
                    result = { path: file.path, content };
                  } else {
                    // Fallback: read from filesystem
                    try {
                      const content = await projectFileSystem.readFile(projectId, p);
                      result = { path: p, content };
                    } catch (e) {
                      throw new Error('File not found');
                    }
                  }
                  break;
                }
              }

              socket.emit('agent:stream', {
                conversationId,
                type: 'tool_result',
                data: { tool: forcedTool.tool, parameters: forcedTool.params || {}, result, timestamp: new Date() }
              });
              socket.emit('agent:complete', { conversationId });
              return; // Skip LLM stream
            }
          } catch (detErr) {
            console.error('[WS][agent:message] Deterministic tool failed:', detErr);
          }

          // Stream response from agent with project context
          const responseStream = await mistralAgentService.sendMessage(conversationId, message, projectId);
          console.log('[WS][agent:message] Streaming started', { conversationId, userId, projectId });

          let errored = false;
          for await (const chunk of responseStream) {
            // If the stream yields an error event, surface it and stop
            if ((chunk as any)?.type === 'error') {
              const errMsg = (chunk as any)?.data?.message || 'Stream error';
              console.warn('[WS][agent:message] Stream error event', { conversationId, errMsg });
              socket.emit('agent:error', { conversationId, error: errMsg });
              errored = true;
              break;
            }
            // First-class tool handling: execute supported tools server-side
            const c: any = chunk;
            if (c?.type === 'tool_call' && projectId) {
              try {
                const tool = c?.data?.tool || c?.tool || c?.tool_name;
                const params = c?.data?.parameters || c?.parameters || {};
                let result: any = null;

                switch (tool) {
                  case 'count_files': {
                    const all = await (await import('../models/ProjectFile')).ProjectFileModel.getProjectTree(projectId);
                    if (all.length > 0) {
                      result = { count: all.length };
                    } else {
                      const { projectFileSystem } = await import('../services/ProjectFileSystem');
                      try { await projectFileSystem.initializeProject(projectId, {}); } catch {}
                      const filesFs = await projectFileSystem.searchFiles(projectId, '', { maxResults: 10000 });
                      result = { count: filesFs.length };
                    }
                    break;
                  }
                  case 'list_tree': {
                    const all = await (await import('../models/ProjectFile')).ProjectFileModel.getProjectTree(projectId);
                    if (all.length > 0) {
                      result = all.map(f => ({ path: f.path, type: f.type }));
                    } else {
                      const { projectFileSystem } = await import('../services/ProjectFileSystem');
                      try { await projectFileSystem.initializeProject(projectId, {}); } catch {}
                      const filesFs = await projectFileSystem.searchFiles(projectId, '', { maxResults: 2000 });
                      result = filesFs.map(f => ({ path: f.path, type: 'file' }));
                    }
                    break;
                  }
                  case 'read_file': {
                    const p = params?.path as string;
                    if (!p) throw new Error('read_file requires path');
                    const { ProjectFileModel } = await import('../models/ProjectFile');
                    let file = await ProjectFileModel.findByPath(projectId, p);
                    if (!file) {
                      // Try by basename when exact path isn't found
                      const pathMod = await import('path');
                      const base = pathMod.basename(p);
                      const candidates = await ProjectFileModel.searchFiles(projectId, base, 5);
                      file = candidates.find(c => c.path.endsWith('/' + base) || c.path === base) || candidates[0];
                    }
                    if (file) {
                      let content = file.content || '';
                      if (!content && file.storageKey) {
                        const { storageService } = await import('../services/StorageService');
                        const buf = await storageService.downloadFile(file.storageKey);
                        content = buf.toString(file.encoding as BufferEncoding);
                      }
                      result = { path: file.path, content };
                    } else {
                      const { projectFileSystem } = await import('../services/ProjectFileSystem');
                      try { await projectFileSystem.initializeProject(projectId, {}); } catch {}
                      try {
                        const content = await projectFileSystem.readFile(projectId, p);
                        result = { path: p, content };
                      } catch (e) {
                        result = { error: 'File not found' };
                      }
                    }
                    break;
                  }
                  case 'search_files': {
                    const q = (params?.query as string) || '';
                    const qLower = q.toLowerCase().trim();
                    const score = (p: string, n: string) => {
                      const name = (n || '').toLowerCase();
                      const pathStr = (p || '').toLowerCase();
                      if (name === qLower) return 100;
                      if (pathStr === qLower) return 95;
                      if (pathStr.endsWith('/' + qLower)) return 90;
                      if (name.includes(qLower)) return 80;
                      if (pathStr.includes('/' + qLower)) return 70;
                      if (pathStr.includes(qLower)) return 60;
                      return 10;
                    };
                    const byPath = new Map<string, { path: string; name: string; s: number }>();
                    const { ProjectFileModel } = await import('../models/ProjectFile');
                    const dbMatches = await ProjectFileModel.searchFiles(projectId, q, 500);
                    for (const m of dbMatches || []) {
                      const s = score(m.path, m.name);
                      const prev = byPath.get(m.path);
                      if (!prev || s > prev.s) byPath.set(m.path, { path: m.path, name: m.name, s });
                    }
                    const maxDbScore = Math.max(0, ...Array.from(byPath.values()).map(v => v.s));
                    if (maxDbScore < 60) {
                      const { projectFileSystem } = await import('../services/ProjectFileSystem');
                      try { await projectFileSystem.initializeProject(projectId, {}); } catch {}
                      const filesFs = await projectFileSystem.searchFiles(projectId, q, { maxResults: 1000 });
                      for (const f of filesFs) {
                        const name = f.path.split('/').pop() || f.path;
                        const s = score(f.path, name);
                        const prev = byPath.get(f.path);
                        if (!prev || s > prev.s) byPath.set(f.path, { path: f.path, name, s });
                      }
                    }
                    const sorted = Array.from(byPath.values()).sort((a,b) => b.s - a.s || a.path.localeCompare(b.path)).slice(0, 200);
                    result = sorted.map(v => ({ path: v.path, name: v.name }));
                    break;
                  }
                }

                if (result !== null) {
                  socket.emit('agent:stream', {
                    conversationId,
                    type: 'tool_result',
                    data: { tool, result, timestamp: new Date() }
                  });
                  continue; // Skip forwarding the original tool_call chunk
                }
              } catch (toolErr) {
                console.error('[WS][agent:message] Tool execution error', toolErr);
                socket.emit('agent:stream', {
                  conversationId,
                  type: 'tool_result',
                  data: { tool: c?.data?.tool, result: { error: (toolErr as Error).message }, timestamp: new Date() }
                });
                continue;
              }
            }
            socket.emit('agent:stream', {
              conversationId,
              ...chunk
            });
          }

          if (!errored) {
            socket.emit('agent:complete', { conversationId });
            console.log('[WS][agent:message] Streaming complete', { conversationId });
          }
        } catch (error) {
          console.error('[WS][agent:message] Agent error', error);
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
