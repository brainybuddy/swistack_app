// Local types file - replaces @swistack/shared imports
// This file contains all types needed by the frontend to avoid import issues

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visibility: 'public' | 'private';
  ownerId: string;
  repositoryUrl?: string;
  language?: string;
  framework?: string;
  tags?: string[];
  settings?: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  autoSave?: boolean;
  tabSize?: number;
  theme?: string;
  fontSize?: number;
  wordWrap?: boolean;
  minimap?: boolean;
  lineNumbers?: boolean;
  formatOnSave?: boolean;
  bracketPairColorization?: boolean;
  stickyScroll?: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
  parentId?: string;
}

// Collaboration Types
export interface CollaborationUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  color?: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface CursorPosition {
  line: number;
  column: number;
  fileName?: string;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
}

export interface CollaborationEvent {
  id: string;
  type: 'cursor' | 'selection' | 'edit' | 'join' | 'leave' | 'chat';
  userId: string;
  projectId: string;
  data: any;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

// Git Types
export interface GitOperationRequest {
  operation: 'status' | 'add' | 'commit' | 'push' | 'pull' | 'branch' | 'checkout';
  projectId: string;
  files?: string[];
  message?: string;
  branch?: string;
  remote?: string;
}

export interface GitOperationResponse {
  success: boolean;
  data?: any;
  error?: string;
  output?: string;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  deleted: string[];
}

// Repository Types
export interface Repository {
  id: string;
  name: string;
  description?: string;
  url: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  owner: string;
  private: boolean;
  defaultBranch: string;
  language?: string;
  stars?: number;
  forks?: number;
  lastUpdated?: Date;
  createdAt: Date;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  language: string;
  framework?: string;
  tags: string[];
  thumbnail?: string;
  sourceUrl?: string;
  demoUrl?: string;
  author: string;
  downloads: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Activity Types
export interface Activity {
  id: string;
  type: 'file_created' | 'file_edited' | 'file_deleted' | 'user_joined' | 'user_left' | 'comment' | 'commit';
  userId: string;
  username: string;
  projectId: string;
  description: string;
  metadata?: any;
  timestamp: Date;
}

// Virus Scan Types
export interface VirusScanResult {
  id: string;
  fileId: string;
  fileName: string;
  status: 'pending' | 'scanning' | 'clean' | 'infected' | 'error';
  threats?: string[];
  scannedAt?: Date;
  scanEngine?: string;
  error?: string;
}

// Command Palette Types
export interface Command {
  id: string;
  label: string;
  description?: string;
  category?: string;
  keybinding?: string;
  icon?: string;
  action: () => void | Promise<void>;
  enabled?: boolean;
  visible?: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// Utility functions
export function isTokenExpired(expiresIn: number): boolean {
  return Date.now() >= expiresIn;
}

export function shouldRefreshToken(expiresIn: number): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= expiresIn - fiveMinutes;
}

export function createTokenStorage() {
  return {
    getTokens: (): AuthTokens | null => {
      if (typeof window === 'undefined') return null;
      const tokens = localStorage.getItem('auth_tokens');
      return tokens ? JSON.parse(tokens) : null;
    },
    setTokens: (tokens: AuthTokens) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    },
    clearTokens: () => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('auth_tokens');
    }
  };
}

// HTTP Client
export class HttpClient {
  private baseURL: string;
  private tokens: AuthTokens | null = null;

  constructor(baseURL: string, tokens?: AuthTokens | null) {
    this.baseURL = baseURL;
    this.tokens = tokens || null;
  }

  setTokens(tokens: AuthTokens | null) {
    this.tokens = tokens;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
    }
    
    return headers;
  }

  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }
}