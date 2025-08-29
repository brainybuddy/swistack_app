import jwt from 'jsonwebtoken';
import { UserModel, DatabaseUser } from '../models/User';
import { RefreshTokenModel } from '../models/RefreshToken';
import { authConfig } from '../config/auth';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthTokens, 
  JWTPayload,
  LoginResponse,
  RegisterResponse 
} from '@swistack/shared';

export class AuthService {
  static generateAccessToken(user: DatabaseUser): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      username: user.username,
      type: 'access',
    };

    return jwt.sign(payload, authConfig.jwt.secret as string, {
      expiresIn: authConfig.jwt.accessTokenExpiry as string,
    } as jwt.SignOptions);
  }

  static async generateTokens(user: DatabaseUser): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    
    // Calculate expiry times
    const accessExpiryMs = this.getTokenExpiryTime(authConfig.jwt.accessTokenExpiry);
    const refreshExpiryMs = this.getTokenExpiryTime(authConfig.jwt.refreshTokenExpiry);
    
    const refreshExpiresAt = new Date(Date.now() + refreshExpiryMs);
    const refreshTokenRecord = await RefreshTokenModel.create(user.id, refreshExpiresAt);

    return {
      accessToken,
      refreshToken: refreshTokenRecord.token,
      expiresIn: accessExpiryMs,
    };
  }

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const user = await UserModel.findByEmail(credentials.email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValidPassword = await UserModel.verifyPassword(user, credentials.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    await UserModel.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);

    return {
      user: UserModel.toPublicUser(user),
      tokens,
    };
  }

  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    // Check if user already exists
    const existingUserByEmail = await UserModel.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    const existingUserByUsername = await UserModel.findByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error('Username is already taken');
    }

    // Create new user
    const newUser = await UserModel.create({
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
    });

    const tokens = await this.generateTokens(newUser);

    return {
      user: UserModel.toPublicUser(newUser),
      tokens,
    };
  }

  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);
    
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    const user = await UserModel.findById(tokenRecord.userId);
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Revoke the old refresh token
    await RefreshTokenModel.revokeToken(refreshToken);

    // Generate new tokens
    return this.generateTokens(user);
  }

  static async verifyAccessToken(token: string): Promise<DatabaseUser> {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret) as JWTPayload;
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const user = await UserModel.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    await RefreshTokenModel.revokeToken(refreshToken);
  }

  static async logoutAll(userId: string): Promise<void> {
    await RefreshTokenModel.revokeAllForUser(userId);
  }

  private static getTokenExpiryTime(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000; // Default to 15 minutes
    }
  }
}