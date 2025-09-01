import { Mistral } from '@mistralai/mistralai';
// Note: MCP imports commented out due to module resolution issues
// import { McpClient } from '@modelcontextprotocol/sdk/client';
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

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
  private mcpClient: any | null = null;
  private conversations: Map<string, AgentConversation> = new Map();

  constructor() {
    super();
    this.client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY!,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Create the SwiStack coding agent
      const agent = await this.client.beta.agents.create({
        model: 'mistral-large-latest',
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
        tools: [{ type: 'code_interpreter' }],
      });

      this.agentId = agent.id;
      
      // Initialize MCP client for custom tools
      await this.initializeMcpClient();
      
      console.log(`SwiStack Coding Agent initialized with ID: ${this.agentId}`);
    } catch (error) {
      console.error('Failed to initialize Mistral agent:', error);
      throw error;
    }
  }

  private async initializeMcpClient(): Promise<void> {
    try {
      // MCP client initialization temporarily disabled due to module resolution
      // Will be implemented in a future update
      console.log('MCP client initialization skipped - will be implemented later');
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      // Continue without MCP tools for now
    }
  }

  async createConversation(userId: string): Promise<string> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: AgentConversation = {
      id: conversationId,
      agentId: this.agentId!,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(conversationId, conversation);
    return conversationId;
  }

  async sendMessage(conversationId: string, userMessage: string): Promise<AsyncGenerator<any, void, unknown>> {
    if (!this.agentId) {
      throw new Error('Agent not initialized');
    }

    const conversation = this.conversations.get(conversationId);
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

    try {
      // Start conversation with Mistral agent
      const conversationResult = await this.client.beta.conversations.startStream({
        agentId: this.agentId,
        messages: [
          {
            role: 'user',
            content: userMessage,
          }
        ],
      });

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
        // Handle conversation entry events
        if (event.type === 'conversation_entry') {
          if (event.role === 'assistant' && event.content) {
            fullContent += event.content;
            
            yield {
              type: 'message',
              data: {
                role: 'assistant',
                content: event.content,
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

  async cleanup(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.close();
    }
  }
}

export const mistralAgentService = new MistralAgentService();