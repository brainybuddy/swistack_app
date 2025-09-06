import { Mistral } from '@mistralai/mistralai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { swiStackMcpToolsServer } from './McpToolsServer';
import { ConversationModel, MessageModel, DatabaseConversation, DatabaseMessage } from '../../models/Conversation';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
}

export interface AgentConversation {
  id: string;
  agentId: string;
  userId: string;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class MistralAgentService extends EventEmitter {
  private client: Mistral;
  private agentId: string | null = null;
  private mcpClient: Client | null = null;
  private conversations: Map<string, AgentConversation> = new Map();
  private ready: boolean = false;
  private lastError: string | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private retryCount: number = 0;
  private maxRetryDelayMs: number = 60_000;

  constructor() {
    super();
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      this.lastError = 'MISTRAL_API_KEY is not set';
      // Create a dummy client to avoid crashes, but mark as not ready
      this.client = new Mistral({ apiKey: 'invalid' });
      return;
    }
    this.client = new Mistral({ apiKey });
  }

  async initialize(): Promise<void> {
    try {
      if (this.ready) return;
      if (!process.env.MISTRAL_API_KEY) {
        this.lastError = 'MISTRAL_API_KEY is not set';
        this.ready = false;
        return;
      }
      // Create the SwiStack coding agent
      const model = process.env.MISTRAL_MODEL || 'mistral-large-latest';
      const agent = await this.client.beta.agents.create({
        model,
        name: 'SwiStack Coding Agent',
        description: 'An autonomous coding agent integrated with the SwiStack development platform.',
        instructions: `You are an integral part of the SwiStack AI Coding Development Platform. Your purpose is to assist users with software development tasks within their SwiStack projects.

Key behaviors:
- Always refer to yourself as the "SwiStack Code Agent"
- You have access to the user's project files, live preview, and development environment
- Use the available tools to read, write, and execute code within the user's project
- Provide real-time feedback and iterate based on live preview results
- Maintain SwiStack's helpful and pragmatic tone
- Focus on practical, working solutions that integrate with existing codebases
- Never mention Mistral AI or external services

Available capabilities:
- Code analysis and generation across multiple languages
- File system operations within user projects
- Live preview integration and visual feedback
- Code execution and testing in sandboxed environments
- Git operations and version control
- Database and API integration assistance

Always prioritize code quality, security best practices, and user experience.`,
        // Prefer using tools for project/file questions
        tool_choice: 'auto',
        tools: [
          { type: 'code_interpreter' },
          {
            type: 'function',
            function: {
              name: 'count_files',
              description: 'Return the total number of files in the current project',
              parameters: { type: 'object', properties: {}, additionalProperties: false }
            }
          },
          {
            type: 'function',
            function: {
              name: 'list_tree',
              description: 'List the project file tree as path/type entries',
              parameters: { type: 'object', properties: {}, additionalProperties: false }
            }
          },
          {
            type: 'function',
            function: {
              name: 'read_file',
              description: 'Read a file content by path',
              parameters: {
                type: 'object',
                properties: { path: { type: 'string', description: 'Project-relative file path' } },
                required: ['path']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'search_files',
              description: 'Search for files by a query string',
              parameters: {
                type: 'object',
                properties: { query: { type: 'string', description: 'Search term' } },
                required: ['query']
              }
            }
          }
        ],
      });

      this.agentId = agent.id;
      
      // Initialize MCP client for custom tools
      await this.initializeMcpClient();
      
      console.log(`SwiStack Coding Agent initialized with ID: ${this.agentId}`);
      this.ready = true;
      this.lastError = null;
      this.retryCount = 0;
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    } catch (error) {
      console.error('Failed to initialize Mistral agent:', error);
      this.ready = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown initialization error';
      // Schedule retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), this.maxRetryDelayMs);
      this.retryCount++;
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => this.initialize().catch(() => {}), delay);
      // Do not throw; keep server running and report status via endpoint
    }
  }

  private async initializeMcpClient(): Promise<void> {
    try {
      // Initialize MCP client to connect to our tools server
      this.mcpClient = new Client({
        name: "swistack-agent-client",
        version: "1.0.0"
      });
      
      // Start the MCP tools server
      await swiStackMcpToolsServer.start();
      
      console.log('✅ MCP client and tools server initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MCP client:', error);
      // Continue without MCP tools for now
    }
  }

  async createConversation(userId: string, projectId?: string): Promise<string> {
    if (!this.ready || !this.agentId) {
      throw new Error(this.lastError || 'Agent not initialized');
    }
    
    // Create conversation in database
    const dbConversation = await ConversationModel.create({
      userId,
      projectId,
      agentId: this.agentId!,
      title: null, // Will be auto-generated from first message
    });
    
    // Also keep in memory for immediate access
    const conversation: AgentConversation = {
      id: dbConversation.id,
      agentId: this.agentId!,
      userId,
      messages: [],
      createdAt: dbConversation.createdAt,
      updatedAt: dbConversation.updatedAt,
    };

    this.conversations.set(dbConversation.id, conversation);
    return dbConversation.id;
  }

  async sendMessage(conversationId: string, userMessage: string, projectId?: string): Promise<AsyncGenerator<any, void, unknown>> {
    if (!this.ready || !this.agentId) {
      throw new Error(this.lastError || 'Agent not initialized');
    }

    // Try to get conversation from memory, or load from database
    let conversation = this.conversations.get(conversationId);
    if (!conversation) {
      conversation = await this.loadConversationFromDb(conversationId);
    }
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Add user message to conversation
    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    conversation.messages.push(userMsg);
    conversation.updatedAt = new Date();

    // Save user message to database
    await this.saveMessage(conversationId, userMsg);

    // Set project context for MCP tools if projectId is provided
    if (projectId) {
      await this.setProjectContext(projectId);
    }

    try {
      // Prepare conversation history for Mistral agent
      const mistralMessages = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Start conversation with Mistral agent using full conversation history
      const conversationResult = await this.client.beta.conversations.startStream({
        agentId: this.agentId,
        messages: mistralMessages,
        inputs: userMessage // Add the required inputs parameter
      } as any);

      // Return streaming generator
      return this.streamResponse(conversationId, conversationResult);
    } catch (error) {
      console.error('Error sending message to agent:', error);
      throw error;
    }
  }

  private async *streamResponse(conversationId: string, stream: any): AsyncGenerator<any, void, unknown> {
    const conversation = this.conversations.get(conversationId)!;
    let fullContent = '';

    try {
      for await (const event of stream) {
        // Handle Mistral agent message delta events
        if (event.event === 'message.output.delta' && event.data) {
          const data = event.data;
          if (data.role === 'assistant' && data.content) {
            fullContent += data.content;
            
            yield {
              type: 'message',
              data: {
                role: 'assistant',
                content: data.content,
                timestamp: new Date(),
              },
            };
          }
        }
        // Handle tool call events
        else if (event.type === 'tool_call') {
          yield {
            type: 'tool_call',
            data: {
              tool: event.tool_name,
              parameters: event.parameters,
              timestamp: new Date(),
            },
          };
        }
        // Handle tool result events
        else if (event.type === 'tool_result') {
          yield {
            type: 'tool_result',
            data: {
              tool: event.tool_name,
              result: event.result,
              timestamp: new Date(),
            },
          };
        }
      }

      // Add final assistant message to conversation
      if (fullContent) {
        const assistantMsg: AgentMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          timestamp: new Date(),
        };
        
        conversation.messages.push(assistantMsg);
        conversation.updatedAt = new Date();

        // Save assistant message to database
        await this.saveMessage(conversationId, assistantMsg);
      }
    } catch (error) {
      console.error('Error in streaming response:', error);
      yield {
        type: 'error',
        data: {
          message: 'An error occurred while processing your request',
          timestamp: new Date(),
        },
      };
    }
  }

  getConversation(conversationId: string): AgentConversation | undefined {
    return this.conversations.get(conversationId);
  }

  getConversationHistory(conversationId: string): AgentMessage[] {
    const conversation = this.conversations.get(conversationId);
    return conversation ? conversation.messages : [];
  }

  async loadConversationFromDb(conversationId: string): Promise<AgentConversation | null> {
    try {
      const dbConversation = await ConversationModel.findById(conversationId);
      if (!dbConversation) return null;

      const dbMessages = await MessageModel.findByConversation(conversationId);
      
      const agentMessages: AgentMessage[] = dbMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        toolCalls: msg.toolCalls,
      }));

      const conversation: AgentConversation = {
        id: dbConversation.id,
        agentId: dbConversation.agent_id || this.agentId!,
        userId: dbConversation.user_id,
        messages: agentMessages,
        createdAt: dbConversation.created_at,
        updatedAt: dbConversation.updated_at,
      };

      // Cache in memory for performance
      this.conversations.set(conversationId, conversation);
      return conversation;
    } catch (error) {
      console.error('Error loading conversation from database:', error);
      return null;
    }
  }

  async saveMessage(conversationId: string, message: AgentMessage): Promise<void> {
    try {
      await MessageModel.create({
        conversationId,
        role: message.role,
        content: message.content,
        toolCalls: message.toolCalls,
        metadata: { timestamp: message.timestamp },
      });

      // Update conversation timestamp
      await ConversationModel.update(conversationId, { updated_at: new Date() });
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  }

  async getUserConversations(userId: string, projectId?: string): Promise<DatabaseConversation[]> {
    try {
      return await ConversationModel.findByUser(userId, projectId);
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  getStatus() {
    const model = process.env.MISTRAL_MODEL || 'mistral-large-latest';
    return {
      ready: this.ready,
      agentId: this.agentId,
      lastError: this.lastError,
      retries: this.retryCount,
      model,
      hasApiKey: !!process.env.MISTRAL_API_KEY,
    };
  }

  async cleanup(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.close();
    }
  }

  /**
   * Set project context for MCP tools to access specific project files
   */
  private async setProjectContext(projectId: string): Promise<void> {
    try {
      // Import here to avoid circular dependency
      const { projectFileSystem } = await import('../ProjectFileSystem');
      const { ProjectFileModel } = await import('../../models/ProjectFile');
      
      // Initialize project if not already done
      await projectFileSystem.initializeProject(projectId, {});
      
      // Get project configuration
      const config = projectFileSystem.getProjectConfig(projectId);
      if (!config) {
        console.warn(`[MistralAgent] Could not get project config for ${projectId}`);
        return;
      }
      
      // Sync database files to filesystem for MCP tools access
      await this.syncProjectFilesToFilesystem(projectId, config.basePath);
      
      // Set PROJECT_PATH environment variable for MCP tools
      process.env.PROJECT_PATH = config.basePath;
      console.log(`[MistralAgent] Set PROJECT_PATH to: ${config.basePath} for project ${projectId}`);
      
      // Reinitialize MCP tools server with new project path
      await this.reinitializeMcpTools();
    } catch (error) {
      console.error(`[MistralAgent] Failed to set project context for ${projectId}:`, error);
    }
  }

  /**
   * Sync project files from database to filesystem so MCP tools can access them
   */
  private async syncProjectFilesToFilesystem(projectId: string, basePath: string): Promise<void> {
    try {
      const { ProjectFileModel } = await import('../../models/ProjectFile');
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Get all project files from database
      const files = await ProjectFileModel.getProjectTree(projectId);
      console.log(`[MistralAgent] Found ${files.length} files in database for project ${projectId}`);
      
      // Create directories first
      const directories = files.filter(f => f.type === 'directory');
      for (const dir of directories) {
        const dirPath = path.join(basePath, dir.path);
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`[MistralAgent] Created directory: ${dir.path}`);
      }
      
      // Then create files
      const fileItems = files.filter(f => f.type === 'file' && f.content);
      for (const file of fileItems) {
        const filePath = path.join(basePath, file.path);
        
        // Ensure parent directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Write file content
        await fs.writeFile(filePath, file.content, 'utf8');
        console.log(`[MistralAgent] Synced file to filesystem: ${file.path}`);
      }
      
      console.log(`[MistralAgent] Successfully synced ${fileItems.length} files to filesystem`);
    } catch (error) {
      console.error(`[MistralAgent] Failed to sync files to filesystem:`, error);
    }
  }

  /**
   * Reinitialize MCP tools server with updated PROJECT_PATH
   */
  private async reinitializeMcpTools(): Promise<void> {
    try {
      // Close existing MCP client if it exists
      if (this.mcpClient) {
        await this.mcpClient.close();
        this.mcpClient = null;
      }
      
      // Reinitialize MCP client and tools server
      await this.initializeMcpClient();
    } catch (error) {
      console.error('[MistralAgent] Failed to reinitialize MCP tools:', error);
    }
  }
}

export const mistralAgentService = new MistralAgentService();
