import { User } from './user';

// Re-export User type for convenience
export { User } from './user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  user: User;
  valid: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  username: string;
}

export interface UpdateProfileResponse {
  user: User;
}

export interface AuthUser extends User {
  permissions?: string[];
  roles?: string[];
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuthUser; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_REFRESH_SUCCESS'; payload: { tokens: AuthTokens } }
  | { type: 'AUTH_SET_USER'; payload: { user: AuthUser } };

export interface AuthConfig {
  apiUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
  autoRefresh: boolean;
  refreshThreshold: number; // minutes before expiry to refresh
}