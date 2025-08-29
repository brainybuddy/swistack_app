import { AuthConfig, AuthTokens, RefreshTokenResponse } from '../types/auth';
import { ApiResponse } from '../types/api';
import { getAuthHeaders, isTokenExpired, validateTokenStructure, createTokenStorage } from './auth';

interface RequestConfig extends RequestInit {
  skipAuthRefresh?: boolean;
  maxRetries?: number;
}

interface QueuedRequest {
  resolve: (value: Response) => void;
  reject: (reason: any) => void;
  url: string;
  config: RequestConfig;
}

export class HttpClient {
  private authConfig: AuthConfig;
  private storage: ReturnType<typeof createTokenStorage>;
  private isRefreshing = false;
  private requestQueue: QueuedRequest[] = [];
  private refreshAttempts = 0;
  private maxRefreshAttempts = 3;

  constructor(authConfig: AuthConfig) {
    this.authConfig = authConfig;
    this.storage = createTokenStorage();
  }

  private async getValidAccessToken(): Promise<string | null> {
    const accessToken = this.storage.getItem(this.authConfig.tokenStorageKey);
    const refreshToken = this.storage.getItem(this.authConfig.refreshTokenKey);

    if (!accessToken || !refreshToken) {
      return null;
    }

    // Validate token structure
    if (!validateTokenStructure(accessToken)) {
      console.warn('Invalid access token structure, clearing tokens');
      this.clearTokens();
      return null;
    }

    // Check if token is expired or about to expire
    if (isTokenExpired(accessToken)) {
      console.log('Access token expired, attempting refresh...');
      const newAccessToken = await this.refreshAccessToken();
      return newAccessToken;
    }

    return accessToken;
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // Wait for ongoing refresh to complete
      return new Promise((resolve) => {
        const checkRefresh = () => {
          if (!this.isRefreshing) {
            const token = this.storage.getItem(this.authConfig.tokenStorageKey);
            resolve(token);
          } else {
            setTimeout(checkRefresh, 100);
          }
        };
        checkRefresh();
      });
    }

    this.isRefreshing = true;
    this.refreshAttempts++;

    try {
      const refreshToken = this.storage.getItem(this.authConfig.refreshTokenKey);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.authConfig.apiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Refresh failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.tokens) {
        const tokens: AuthTokens = data.data.tokens;
        
        // Store new tokens
        this.storage.setItem(this.authConfig.tokenStorageKey, tokens.accessToken);
        this.storage.setItem(this.authConfig.refreshTokenKey, tokens.refreshToken);
        
        // Reset refresh attempts on success
        this.refreshAttempts = 0;
        
        // Process queued requests
        this.processRequestQueue();
        
        return tokens.accessToken;
      } else {
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // If we've exceeded max attempts, clear tokens and logout
      if (this.refreshAttempts >= this.maxRefreshAttempts) {
        this.clearTokens();
        this.rejectQueuedRequests(new Error('Authentication failed after multiple refresh attempts'));
        
        // Dispatch logout event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout', { 
            detail: { reason: 'refresh_failed' }
          }));
        }
      }
      
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private processRequestQueue() {
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    
    queue.forEach(async ({ resolve, reject, url, config }) => {
      try {
        const response = await this.request(url, config);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  }

  private rejectQueuedRequests(error: Error) {
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    
    queue.forEach(({ reject }) => reject(error));
  }

  private clearTokens() {
    this.storage.removeItem(this.authConfig.tokenStorageKey);
    this.storage.removeItem(this.authConfig.refreshTokenKey);
    this.storage.removeItem('swistack_user');
  }

  async request(url: string, config: RequestConfig = {}): Promise<Response> {
    const { skipAuthRefresh = false, maxRetries = 1, ...fetchConfig } = config;

    // If this is a refresh request or we don't need auth, make request directly
    if (skipAuthRefresh || url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return fetch(url, fetchConfig);
    }

    // If we're currently refreshing tokens, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, url, config });
      });
    }

    // Get valid access token
    const accessToken = await this.getValidAccessToken();
    
    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    // Add auth headers
    const headers: Record<string, string> = {
      ...getAuthHeaders(accessToken),
      ...(fetchConfig.headers as Record<string, string> || {}),
    };

    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchConfig,
          headers,
        });

        // If we get a 401, try to refresh token and retry once
        if (response.status === 401 && attempt === 1) {
          console.log('Received 401, attempting token refresh...');
          
          const newAccessToken = await this.refreshAccessToken();
          
          if (newAccessToken) {
            // Update headers with new token and retry
            headers.Authorization = `Bearer ${newAccessToken}`;
            continue;
          } else {
            throw new Error('Token refresh failed');
          }
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Request failed');
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // Parse response into ApiResponse format
  private async parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle different response formats from the backend
      if (typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>;
      }

      // For responses that don't have the success wrapper, wrap them
      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse response',
      };
    }
  }

  // Convenience methods with parsed responses
  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.request(url, { ...config, method: 'GET' });
    return this.parseApiResponse<T>(response);
  }

  async post<T = any>(url: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.request(url, {
      ...config,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
    return this.parseApiResponse<T>(response);
  }

  async put<T = any>(url: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.request(url, {
      ...config,
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
    return this.parseApiResponse<T>(response);
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.request(url, { ...config, method: 'DELETE' });
    return this.parseApiResponse<T>(response);
  }

  // Raw methods that return Response objects (for file uploads, etc.)
  async getRaw(url: string, config?: RequestConfig): Promise<Response> {
    return this.request(url, { ...config, method: 'GET' });
  }

  async postRaw(url: string, body?: any, config?: RequestConfig): Promise<Response> {
    return this.request(url, {
      ...config,
      method: 'POST',
      body: body instanceof FormData ? body : (typeof body === 'string' ? body : JSON.stringify(body)),
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const accessToken = this.storage.getItem(this.authConfig.tokenStorageKey);
    const refreshToken = this.storage.getItem(this.authConfig.refreshTokenKey);
    
    if (!accessToken || !refreshToken) {
      return false;
    }

    // If access token is expired but we have a refresh token, we're still "authenticated"
    // The next request will handle the refresh automatically
    return validateTokenStructure(accessToken) && validateTokenStructure(refreshToken);
  }

  // Force logout
  logout(): void {
    this.clearTokens();
    this.rejectQueuedRequests(new Error('User logged out'));
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: 'manual_logout' }
      }));
    }
  }
}