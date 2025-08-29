import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  VerifyTokenRequest,
  VerifyTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  AuthConfig,
  ApiResponse 
} from '../types';
import { getAuthHeaders, formatAuthError } from '../utils/auth';

export class AuthApiClient {
  private baseUrl: string;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.baseUrl = config.apiUrl;
    this.config = config;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Request failed',
        };
      }

      // Handle nested response structure from backend
      if (data.success && data.data) {
        return {
          success: true,
          data: data.data,
        };
      }

      return {
        success: data.success || true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: formatAuthError(error),
      };
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(request: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    return this.request<RefreshTokenResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async verifyToken(token: string): Promise<ApiResponse<VerifyTokenResponse>> {
    return this.request<VerifyTokenResponse>('/api/auth/verify', {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  }

  async logout(token: string): Promise<ApiResponse<void>> {
    return this.request<void>('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return this.request<void>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return this.request<void>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async changePassword(request: ChangePasswordRequest, token: string): Promise<ApiResponse<void>> {
    return this.request<void>('/api/auth/change-password', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(request),
    });
  }

  async getProfile(token: string): Promise<ApiResponse<any>> {
    return this.request('/api/auth/profile', {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  }

  async updateProfile(request: UpdateProfileRequest, token: string): Promise<ApiResponse<UpdateProfileResponse>> {
    return this.request<UpdateProfileResponse>('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(request),
    });
  }
}