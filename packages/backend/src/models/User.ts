import { Model } from 'objection';
import { db } from '../config/database';
import bcrypt from 'bcryptjs';
import { getAuthConfig } from '../config/auth';

export interface DatabaseUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  googleId?: string;
  githubId?: string;
  githubUsername?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Model {
  static tableName = 'users';

  id!: string;
  email!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  passwordHash?: string;
  avatar?: string;
  isActive!: boolean;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  googleId?: string;
  githubId?: string;
  githubUsername?: string;
  avatarUrl?: string;
  createdAt!: Date;
  updatedAt!: Date;

  // Virtual properties
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  $beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }

  static relationMappings = {
    projects: {
      relation: Model.HasManyRelation,
      modelClass: 'Project',
      join: {
        from: 'users.id',
        to: 'projects.ownerId'
      }
    },
    projectMemberships: {
      relation: Model.HasManyRelation,
      modelClass: 'ProjectMember',
      join: {
        from: 'users.id',
        to: 'project_members.userId'
      }
    }
  };

  // Hash password before saving
  static async hashPassword(password: string): Promise<string> {
    const authConfig = getAuthConfig();
    return await bcrypt.hash(password, authConfig.bcrypt.saltRounds);
  }

  // Verify password
  async verifyPassword(password: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return await bcrypt.compare(password, this.passwordHash);
  }

  // Convert to public format (without sensitive data)
  toPublic() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      avatar: this.avatar,
      avatarUrl: this.avatarUrl,
      isActive: this.isActive,
      lastLoginAt: this.lastLoginAt,
      emailVerifiedAt: this.emailVerifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Maintain compatibility with existing UserModel
export class UserModel {
  static async create(userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<DatabaseUser> {
    const passwordHash = await User.hashPassword(userData.password);
    
    const [user] = await db('users')
      .insert({
        email: userData.email.toLowerCase(),
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash,
      })
      .returning('*');
    
    return user;
  }

  static async findById(id: string): Promise<DatabaseUser | null> {
    const user = await db('users').where('id', id).first();
    return user || null;
  }

  static async findByEmail(email: string): Promise<DatabaseUser | null> {
    const user = await db('users').where('email', email.toLowerCase()).first();
    return user || null;
  }

  static async findByUsername(username: string): Promise<DatabaseUser | null> {
    const user = await db('users').where('username', username).first();
    return user || null;
  }

  static async findByEmailVerificationToken(token: string): Promise<DatabaseUser | null> {
    const user = await db('users').where('emailVerificationToken', token).first();
    return user || null;
  }

  static async findByPasswordResetToken(token: string): Promise<DatabaseUser | null> {
    const user = await db('users')
      .where('passwordResetToken', token)
      .where('passwordResetExpiresAt', '>', new Date())
      .first();
    return user || null;
  }

  static async updateById(id: string, updates: Partial<DatabaseUser>): Promise<void> {
    await db('users').where('id', id).update(updates);
  }

  static async deleteById(id: string): Promise<void> {
    await db('users').where('id', id).delete();
  }

  static async verifyPassword(user: DatabaseUser, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return await bcrypt.compare(password, user.passwordHash);
  }

  // OAuth methods
  static async findByGoogleId(googleId: string): Promise<DatabaseUser | null> {
    const user = await db('users').where('googleId', googleId).first();
    return user || null;
  }

  static async findByGithubId(githubId: string): Promise<DatabaseUser | null> {
    const user = await db('users').where('githubId', githubId).first();
    return user || null;
  }

  static async createFromOAuth(userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    googleId?: string;
    githubId?: string;
    githubUsername?: string;
    avatar?: string;
  }): Promise<DatabaseUser> {
    const [user] = await db('users')
      .insert({
        email: userData.email.toLowerCase(),
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        googleId: userData.googleId,
        githubId: userData.githubId,
        githubUsername: userData.githubUsername,
        avatar: userData.avatar,
        emailVerifiedAt: new Date(), // OAuth users are considered verified
        isActive: true,
      })
      .returning('*');
    
    return user;
  }

  static async linkOAuthAccount(userId: string, provider: {
    googleId?: string;
    githubId?: string;
    githubUsername?: string;
    avatar?: string;
  }): Promise<void> {
    await db('users').where('id', userId).update(provider);
  }

  static async updateLastLogin(id: string): Promise<void> {
    await db('users').where('id', id).update({
      lastLoginAt: new Date()
    });
  }

  static async updateProfile(id: string, updates: {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
  }): Promise<void> {
    await db('users').where('id', id).update(updates);
  }

  static async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await User.hashPassword(newPassword);
    await db('users').where('id', id).update({ passwordHash });
  }

  static toPublicUser(user: DatabaseUser) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  static async findByOAuthProvider(provider: 'google' | 'github', providerId: string): Promise<DatabaseUser | null> {
    const column = provider === 'google' ? 'googleId' : 'githubId';
    const user = await db('users').where(column, providerId).first();
    return user || null;
  }

  static async updateOAuthProfile(id: string, profile: {
    googleId?: string;
    githubId?: string;
    githubUsername?: string;
    avatar?: string;
  }): Promise<void> {
    await db('users').where('id', id).update(profile);
  }

  static sanitizeUser(user: DatabaseUser) {
    const { passwordHash, emailVerificationToken, passwordResetToken, ...sanitized } = user;
    return sanitized;
  }
}