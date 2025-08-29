import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { UserModel } from '../models/User';
import { AuthService } from './AuthService';

export interface OAuthProfile {
  provider: 'google' | 'github';
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  username?: string;
}

export class OAuthService {
  static initialize() {
    // Only initialize OAuth strategies if credentials are provided
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

    // Google OAuth Strategy
    if (googleClientId && googleClientSecret) {
      passport.use(new GoogleStrategy({
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
      }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          console.log('Google OAuth profile received:', JSON.stringify(profile, null, 2));
          
          const oauthProfile: OAuthProfile = {
            provider: 'google',
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value,
          };
          
          console.log('Parsed Google OAuth profile:', JSON.stringify(oauthProfile, null, 2));
          
          const result = await OAuthService.handleOAuthLogin(oauthProfile);
          return done(null, result);
        } catch (error) {
          return done(error, null);
        }
      }));
    }

    // GitHub OAuth Strategy
    if (githubClientId && githubClientSecret) {
      passport.use(new GitHubStrategy({
        clientID: githubClientId,
        clientSecret: githubClientSecret,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback'
      }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          console.log('GitHub OAuth profile received:', JSON.stringify(profile, null, 2));
          
          // GitHub can provide name in different fields
          const fullName = profile.displayName || (profile as any).name || '';
          const nameParts = fullName.split(' ');
          
          const oauthProfile: OAuthProfile = {
            provider: 'github',
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            firstName: nameParts[0] || profile.username || '',
            lastName: nameParts.slice(1).join(' ') || '',
            avatar: profile.photos?.[0]?.value,
            username: profile.username,
          };
          
          console.log('Parsed GitHub OAuth profile:', JSON.stringify(oauthProfile, null, 2));
          
          const result = await OAuthService.handleOAuthLogin(oauthProfile);
          return done(null, result);
        } catch (error) {
          return done(error, null);
        }
      }));
    }

    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });
  }

  static async handleOAuthLogin(profile: OAuthProfile) {
    try {
      // First, try to find user by OAuth provider ID
      let user = await UserModel.findByOAuthProvider(profile.provider, profile.id);
      
      if (user) {
        // User exists with this OAuth provider, update their info
        await UserModel.updateOAuthProfile(user.id, {
          [`${profile.provider}Id`]: profile.id,
          avatar: profile.avatar,
          ...(profile.provider === 'github' && { githubUsername: profile.username })
        });
      } else {
        // Check if user exists by email
        const existingUser = await UserModel.findByEmail(profile.email);
        
        if (existingUser) {
          // Link this OAuth account to existing user
          await UserModel.linkOAuthAccount(existingUser.id, {
            [`${profile.provider}Id`]: profile.id,
            avatar: profile.avatar,
            ...(profile.provider === 'github' && { githubUsername: profile.username })
          });
          user = existingUser;
        } else {
          // Create new user from OAuth profile
          user = await UserModel.createFromOAuth({
            ...profile,
            username: profile.username || `${profile.firstName.toLowerCase()}${profile.lastName.toLowerCase()}`.replace(/\s+/g, ''),
            [`${profile.provider}Id`]: profile.id,
            avatar: profile.avatar
          });
        }
      }

      // Generate JWT tokens
      const tokens = await AuthService.generateTokens(user!);
      
      return {
        user: UserModel.sanitizeUser(user!),
        tokens
      };
    } catch (error) {
      console.error('OAuth login error:', error);
      throw new Error('OAuth login failed');
    }
  }

  static getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  static getGitHubAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
      scope: 'user:email user',
      state: Math.random().toString(36).substring(7) // Simple state for CSRF protection
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }
}