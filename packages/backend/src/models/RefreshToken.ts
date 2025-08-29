import { db } from '../config/database';
import crypto from 'crypto';

export interface DatabaseRefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RefreshTokenModel {
  static async create(userId: string, expiresAt: Date): Promise<DatabaseRefreshToken> {
    const token = crypto.randomBytes(64).toString('hex');
    
    const [refreshToken] = await db('refresh_tokens')
      .insert({
        userId,
        token,
        expiresAt,
      })
      .returning('*');
    
    return refreshToken;
  }

  static async findByToken(token: string): Promise<DatabaseRefreshToken | null> {
    const refreshToken = await db('refresh_tokens')
      .where('token', token)
      .where('revoked', false)
      .where('expiresAt', '>', new Date())
      .first();
    
    return refreshToken || null;
  }

  static async findByUserId(userId: string): Promise<DatabaseRefreshToken[]> {
    return db('refresh_tokens')
      .where('userId', userId)
      .where('revoked', false)
      .where('expiresAt', '>', new Date())
      .orderBy('createdAt', 'desc');
  }

  static async revokeToken(token: string): Promise<boolean> {
    const result = await db('refresh_tokens')
      .where('token', token)
      .update({
        revoked: true,
        updatedAt: new Date(),
      });
    
    return result > 0;
  }

  static async revokeAllForUser(userId: string): Promise<number> {
    const result = await db('refresh_tokens')
      .where('userId', userId)
      .where('revoked', false)
      .update({
        revoked: true,
        updatedAt: new Date(),
      });
    
    return result;
  }

  static async cleanupExpired(): Promise<number> {
    const result = await db('refresh_tokens')
      .where('expiresAt', '<', new Date())
      .del();
    
    return result;
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await db('refresh_tokens').where('id', id).del();
    return result > 0;
  }
}