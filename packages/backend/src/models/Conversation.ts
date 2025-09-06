import { db } from '../config/database';

export interface DatabaseConversation {
  id: string;
  userId: string;
  projectId?: string;
  agentId?: string;
  title?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: any[];
  metadata?: any;
  createdAt: Date;
}

export class ConversationModel {
  static async create(data: {
    userId: string;
    projectId?: string;
    agentId?: string;
    title?: string;
    metadata?: any;
  }): Promise<DatabaseConversation> {
    const [conversation] = await db('conversations')
      .insert({
        user_id: data.userId,
        project_id: data.projectId,
        agent_id: data.agentId,
        title: data.title,
        metadata: data.metadata,
        updated_at: new Date(),
      })
      .returning('*');

    return conversation;
  }

  static async findById(id: string): Promise<DatabaseConversation | null> {
    const conversation = await db('conversations').where('id', id).first();
    return conversation || null;
  }

  static async findByUser(userId: string, projectId?: string): Promise<DatabaseConversation[]> {
    let query = db('conversations').where('user_id', userId);
    
    if (projectId) {
      query = query.where('project_id', projectId);
    }
    
    return await query.orderBy('updated_at', 'desc');
  }

  static async update(id: string, data: Partial<DatabaseConversation>): Promise<DatabaseConversation | null> {
    const [conversation] = await db('conversations')
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    return conversation || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db('conversations').where('id', id).del();
    return result > 0;
  }

  // Get recent conversations for a user across all projects
  static async getRecentByUser(userId: string, limit: number = 10): Promise<DatabaseConversation[]> {
    return await db('conversations')
      .where('user_id', userId)
      .orderBy('updated_at', 'desc')
      .limit(limit);
  }
}

export class MessageModel {
  static async create(data: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: any[];
    metadata?: any;
  }): Promise<DatabaseMessage> {
    const [message] = await db('conversation_messages')
      .insert({
        conversation_id: data.conversationId,
        role: data.role,
        content: data.content,
        tool_calls: data.toolCalls ? JSON.stringify(data.toolCalls) : null,
        metadata: data.metadata,
      })
      .returning('*');

    return message;
  }

  static async findByConversation(conversationId: string): Promise<DatabaseMessage[]> {
    const messages = await db('conversation_messages')
      .where('conversation_id', conversationId)
      .orderBy('created_at', 'asc');

    // Parse JSON fields
    return messages.map(msg => ({
      ...msg,
      toolCalls: msg.tool_calls ? JSON.parse(msg.tool_calls) : null,
    }));
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db('conversation_messages').where('id', id).del();
    return result > 0;
  }

  static async deleteByConversation(conversationId: string): Promise<number> {
    return await db('conversation_messages').where('conversation_id', conversationId).del();
  }

  // Get latest message from conversation
  static async getLatest(conversationId: string): Promise<DatabaseMessage | null> {
    const message = await db('conversation_messages')
      .where('conversation_id', conversationId)
      .orderBy('created_at', 'desc')
      .first();

    if (!message) return null;

    return {
      ...message,
      toolCalls: message.tool_calls ? JSON.parse(message.tool_calls) : null,
    };
  }
}