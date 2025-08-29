import { AuthUser, AuthTokens, JWTPayload } from '../types/auth';
import { decodeJWT, isTokenExpired, getTokenExpirationTime } from './auth';

export type AuthRole = 'admin' | 'user' | 'moderator' | 'viewer';
export type AuthPermission = 'read' | 'write' | 'delete' | 'admin' | 'moderate';

export interface SessionInfo {
  isActive: boolean;
  timeRemaining: number | null;
  lastActivity: Date | null;
  sessionId: string | null;
  refreshCount: number;
}

export interface AuthValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// User role and permission utilities
export function hasRole(user: AuthUser, role: AuthRole): boolean {
  if (!user.roles || user.roles.length === 0) return false;
  return user.roles.includes(role);
}

export function hasAnyRole(user: AuthUser, roles: AuthRole[]): boolean {
  if (!user.roles || user.roles.length === 0) return false;
  return roles.some(role => user.roles!.includes(role));
}

export function hasAllRoles(user: AuthUser, roles: AuthRole[]): boolean {
  if (!user.roles || user.roles.length === 0) return false;
  return roles.every(role => user.roles!.includes(role));
}

export function hasPermission(user: AuthUser, permission: AuthPermission): boolean {
  if (!user.permissions || user.permissions.length === 0) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: AuthUser, permissions: AuthPermission[]): boolean {
  if (!user.permissions || user.permissions.length === 0) return false;
  return permissions.some(permission => user.permissions!.includes(permission));
}

export function hasAllPermissions(user: AuthUser, permissions: AuthPermission[]): boolean {
  if (!user.permissions || user.permissions.length === 0) return false;
  return permissions.every(permission => user.permissions!.includes(permission));
}

export function isAdmin(user: AuthUser): boolean {
  return hasRole(user, 'admin') || hasPermission(user, 'admin');
}

export function isModerator(user: AuthUser): boolean {
  return hasRole(user, 'moderator') || hasPermission(user, 'moderate') || isAdmin(user);
}

export function canRead(user: AuthUser): boolean {
  return hasPermission(user, 'read') || hasAnyPermission(user, ['write', 'delete', 'admin', 'moderate']);
}

export function canWrite(user: AuthUser): boolean {
  return hasPermission(user, 'write') || hasAnyPermission(user, ['delete', 'admin']);
}

export function canDelete(user: AuthUser): boolean {
  return hasPermission(user, 'delete') || hasPermission(user, 'admin');
}

// Token analysis and validation
export function analyzeToken(token: string): JWTPayload & { 
  isExpired: boolean;
  timeUntilExpiry: number | null;
  issuedDuration: number | null;
} | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  const now = Date.now() / 1000;
  const timeUntilExpiry = decoded.exp ? (decoded.exp - now) * 1000 : null;
  const issuedDuration = decoded.iat ? (now - decoded.iat) * 1000 : null;

  return {
    ...decoded,
    isExpired: isTokenExpired(token),
    timeUntilExpiry,
    issuedDuration,
  };
}

export function getTokenHealth(tokens: AuthTokens): {
  accessToken: { healthy: boolean; expiresInMinutes: number | null };
  refreshToken: { healthy: boolean; expiresInMinutes: number | null };
  overall: 'healthy' | 'warning' | 'critical' | 'expired';
} {
  const accessAnalysis = analyzeToken(tokens.accessToken);
  const refreshAnalysis = analyzeToken(tokens.refreshToken);

  const accessExpiresInMinutes = accessAnalysis?.timeUntilExpiry 
    ? Math.floor(accessAnalysis.timeUntilExpiry / (1000 * 60)) 
    : null;
  
  const refreshExpiresInMinutes = refreshAnalysis?.timeUntilExpiry 
    ? Math.floor(refreshAnalysis.timeUntilExpiry / (1000 * 60)) 
    : null;

  const accessHealthy = !accessAnalysis?.isExpired && (accessExpiresInMinutes === null || accessExpiresInMinutes > 0);
  const refreshHealthy = !refreshAnalysis?.isExpired && (refreshExpiresInMinutes === null || refreshExpiresInMinutes > 0);

  let overall: 'healthy' | 'warning' | 'critical' | 'expired' = 'healthy';

  if (accessAnalysis?.isExpired || refreshAnalysis?.isExpired) {
    overall = 'expired';
  } else if (!refreshHealthy || (accessExpiresInMinutes !== null && accessExpiresInMinutes < 5)) {
    overall = 'critical';
  } else if (accessExpiresInMinutes !== null && accessExpiresInMinutes < 15) {
    overall = 'warning';
  }

  return {
    accessToken: { healthy: accessHealthy, expiresInMinutes: accessExpiresInMinutes },
    refreshToken: { healthy: refreshHealthy, expiresInMinutes: refreshExpiresInMinutes },
    overall,
  };
}

// Session management
export function createSessionInfo(tokens: AuthTokens, sessionId?: string): SessionInfo {
  const accessAnalysis = analyzeToken(tokens.accessToken);
  
  return {
    isActive: !isTokenExpired(tokens.accessToken),
    timeRemaining: accessAnalysis?.timeUntilExpiry || null,
    lastActivity: new Date(),
    sessionId: sessionId || null,
    refreshCount: 0,
  };
}

export function updateSessionActivity(session: SessionInfo): SessionInfo {
  return {
    ...session,
    lastActivity: new Date(),
  };
}

export function incrementRefreshCount(session: SessionInfo): SessionInfo {
  return {
    ...session,
    refreshCount: session.refreshCount + 1,
  };
}

// Validation utilities
export function validateAuthUser(user: any): AuthValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!user.id) errors.push('User ID is required');
  if (!user.email) errors.push('Email is required');
  if (!user.username) errors.push('Username is required');
  if (!user.firstName) errors.push('First name is required');
  if (!user.lastName) errors.push('Last name is required');

  // Email validation
  if (user.email && !user.email.includes('@')) {
    errors.push('Invalid email format');
  }

  // Username validation
  if (user.username && user.username.length < 3) {
    errors.push('Username too short (minimum 3 characters)');
  }

  // Warnings
  if (!user.emailVerifiedAt) {
    warnings.push('Email not verified');
  }

  if (!user.avatar) {
    warnings.push('No profile picture set');
  }

  if (user.roles && user.roles.length === 0) {
    warnings.push('No roles assigned');
  }

  if (user.permissions && user.permissions.length === 0) {
    warnings.push('No permissions assigned');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateAuthTokens(tokens: any): AuthValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!tokens.accessToken) errors.push('Access token is required');
  if (!tokens.refreshToken) errors.push('Refresh token is required');

  // Token structure validation
  if (tokens.accessToken) {
    const accessAnalysis = analyzeToken(tokens.accessToken);
    if (!accessAnalysis) {
      errors.push('Invalid access token format');
    } else {
      if (accessAnalysis.isExpired) {
        errors.push('Access token is expired');
      } else if (accessAnalysis.timeUntilExpiry && accessAnalysis.timeUntilExpiry < 5 * 60 * 1000) {
        warnings.push('Access token expires soon (less than 5 minutes)');
      }
    }
  }

  if (tokens.refreshToken) {
    const refreshAnalysis = analyzeToken(tokens.refreshToken);
    if (!refreshAnalysis) {
      errors.push('Invalid refresh token format');
    } else if (refreshAnalysis.isExpired) {
      errors.push('Refresh token is expired');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Utility functions for auth state management
export function shouldForceRefresh(tokens: AuthTokens): boolean {
  const health = getTokenHealth(tokens);
  return health.overall === 'critical' || health.overall === 'expired';
}

export function getRefreshStrategy(tokens: AuthTokens): 'immediate' | 'scheduled' | 'none' {
  const health = getTokenHealth(tokens);
  
  switch (health.overall) {
    case 'expired':
    case 'critical':
      return 'immediate';
    case 'warning':
      return 'scheduled';
    default:
      return 'none';
  }
}

export function calculateRefreshDelay(tokens: AuthTokens): number {
  const accessAnalysis = analyzeToken(tokens.accessToken);
  if (!accessAnalysis?.timeUntilExpiry) return 0;
  
  // Refresh when 20% of time remains or 5 minutes before expiry, whichever is smaller
  const twentyPercentTime = accessAnalysis.timeUntilExpiry * 0.2;
  const fiveMinutes = 5 * 60 * 1000;
  const refreshTime = Math.max(accessAnalysis.timeUntilExpiry - Math.min(twentyPercentTime, fiveMinutes), 0);
  
  return refreshTime;
}

// Auth error helpers
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const authErrorCodes = [401, 403];
  const authErrorMessages = [
    'unauthorized',
    'forbidden',
    'invalid token',
    'token expired',
    'authentication failed',
    'access denied',
  ];

  // Check status code
  if (error.status && authErrorCodes.includes(error.status)) return true;
  if (error.response?.status && authErrorCodes.includes(error.response.status)) return true;

  // Check error message
  const message = (error.message || error.error || '').toLowerCase();
  return authErrorMessages.some(authMsg => message.includes(authMsg));
}

export function getAuthErrorMessageFromError(error: any): string {
  if (!isAuthError(error)) return 'An error occurred';

  const status = error.status || error.response?.status;
  const message = error.message || error.error || error.response?.data?.message;

  if (status === 401) {
    return message || 'Authentication required. Please log in again.';
  }
  
  if (status === 403) {
    return message || 'Access denied. You do not have permission to perform this action.';
  }

  return message || 'Authentication error occurred.';
}

// Rate limiting helpers for auth
export interface AuthRateLimit {
  attempts: number;
  resetTime: number;
  isBlocked: boolean;
}

export function createRateLimit(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): AuthRateLimit {
  return {
    attempts: 0,
    resetTime: Date.now() + windowMs,
    isBlocked: false,
  };
}

export function updateRateLimit(rateLimit: AuthRateLimit, maxAttempts: number = 5): AuthRateLimit {
  const now = Date.now();
  
  // Reset if window has passed
  if (now >= rateLimit.resetTime) {
    return {
      attempts: 1,
      resetTime: now + (15 * 60 * 1000), // 15 minutes
      isBlocked: false,
    };
  }

  const newAttempts = rateLimit.attempts + 1;
  return {
    ...rateLimit,
    attempts: newAttempts,
    isBlocked: newAttempts >= maxAttempts,
  };
}

export function getRateLimitStatus(rateLimit: AuthRateLimit): {
  isBlocked: boolean;
  attemptsRemaining: number;
  resetInMs: number;
} {
  const now = Date.now();
  
  if (now >= rateLimit.resetTime) {
    return {
      isBlocked: false,
      attemptsRemaining: 5,
      resetInMs: 0,
    };
  }

  return {
    isBlocked: rateLimit.isBlocked,
    attemptsRemaining: Math.max(0, 5 - rateLimit.attempts),
    resetInMs: rateLimit.resetTime - now,
  };
}