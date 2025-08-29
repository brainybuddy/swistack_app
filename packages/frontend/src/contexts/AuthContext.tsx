'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  AuthState, 
  AuthAction, 
  AuthUser, 
  AuthTokens, 
  AuthApiClient,
  createTokenStorage,
  isTokenExpired,
  shouldRefreshToken,
  HttpClient
} from '@swistack/shared';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateProfile: (profileData: {
    firstName: string;
    lastName: string;
    username: string;
  }) => Promise<void>;
  updateAvatar: (avatarUrl: string) => void;
  changePassword: (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  clearError: () => void;
  token: string | null;
  httpClient: HttpClient;
  isTokenExpired: () => boolean;
  getTimeUntilExpiry: () => number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_REFRESH_SUCCESS':
      return {
        ...state,
        tokens: action.payload.tokens,
        error: null,
      };
    case 'AUTH_SET_USER':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
      };
    default:
      return state;
  }
}

const authConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  tokenStorageKey: 'swistack_token',
  refreshTokenKey: 'swistack_refresh_token',
  autoRefresh: true,
  refreshThreshold: 5,
};

const authClient = new AuthApiClient(authConfig);
const httpClient = new HttpClient(authConfig);
const storage = createTokenStorage();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user and tokens from storage on mount
  useEffect(() => {
    console.log('AuthContext: Loading user from storage...');
    loadUserFromStorage();
  }, []);

  // Enhanced automatic token refresh
  useEffect(() => {
    if (state.tokens?.accessToken && state.tokens?.refreshToken) {
      scheduleTokenRefresh();
    } else {
      // Clear any existing refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [state.tokens]);

  // Listen for auth events from HttpClient
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      console.log('Auth logout event received:', event.detail);
      dispatch({ type: 'AUTH_LOGOUT' });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleAuthLogout as EventListener);
      return () => {
        window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
      };
    }
  }, []);

  const scheduleTokenRefresh = useCallback(() => {
    if (!state.tokens?.accessToken) return;

    const timeUntilExpiry = getTimeUntilExpiry();
    if (timeUntilExpiry === null) return;

    // Schedule refresh 5 minutes before expiry (or half the remaining time, whichever is smaller)
    const refreshTime = Math.min(timeUntilExpiry - 5 * 60 * 1000, timeUntilExpiry / 2);
    
    if (refreshTime > 0) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        console.log('Scheduled token refresh triggered');
        refreshTokens();
      }, refreshTime);
    } else {
      // Token is about to expire or expired, refresh immediately
      refreshTokens();
    }
  }, [state.tokens]);

  const getTimeUntilExpiry = useCallback((): number | null => {
    if (!state.tokens?.accessToken) return null;
    
    try {
      const base64Url = state.tokens.accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      
      const expirationTime = decoded.exp * 1000;
      return expirationTime - Date.now();
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, [state.tokens]);

  const isTokenExpiredCheck = useCallback((): boolean => {
    if (!state.tokens?.accessToken) return true;
    return isTokenExpired(state.tokens.accessToken);
  }, [state.tokens]);

  const loadUserFromStorage = async () => {
    try {
      console.log('Loading user from storage...');
      cleanupCorruptedStorage(); // Clean up any corrupted data first
      dispatch({ type: 'AUTH_START' });

      const accessToken = storage.getItem('swistack_token');
      const refreshToken = storage.getItem('swistack_refresh_token');
      const userStr = storage.getItem('swistack_user');

      console.log('Storage items:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
        hasUser: !!userStr,
        userStr: userStr // Debug the actual value
      });
      
      console.log('Raw localStorage data:', {
        token: accessToken?.substring(0, 50) + '...',
        refreshToken: refreshToken?.substring(0, 50) + '...',
        userStr: userStr
      });

      if (!accessToken || !refreshToken || !userStr || userStr === 'undefined') {
        console.log('Missing required auth data, logging out');
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      let user: AuthUser;
      try {
        user = JSON.parse(userStr) as AuthUser;
        console.log('Successfully parsed user:', {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          hasAvatar: !!user.avatar,
          avatarLength: user.avatar?.length || 0
        });
      } catch (parseError) {
        console.error('Failed to parse user JSON:', parseError, 'userStr:', userStr);
        // Clear invalid data
        clearStorage();
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }
      
      // Check if token is expired
      if (isTokenExpired(accessToken)) {
        // Try to refresh tokens
        try {
          const response = await authClient.refreshToken({ refreshToken });
          if (response.success && response.data) {
            const newTokens = response.data.tokens;
            storage.setItem('swistack_token', newTokens.accessToken);
            storage.setItem('swistack_refresh_token', newTokens.refreshToken);
            
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user, tokens: newTokens },
            });
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          // Refresh failed, clear storage and logout
          clearStorage();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        // Token is still valid
        const tokens = {
          accessToken,
          refreshToken,
          expiresIn: 0, // We don't store this
        };
        
        console.log('AuthContext: Token is valid, setting user:', user);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, tokens },
        });
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: `Failed to load authentication state: ${error instanceof Error ? error.message : 'Unknown error'}` },
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authClient.login({ email, password });

      if (response.success && response.data) {
        const { user, tokens } = response.data;

        // Store in localStorage
        storage.setItem('swistack_token', tokens.accessToken);
        storage.setItem('swistack_refresh_token', tokens.refreshToken);
        storage.setItem('swistack_user', JSON.stringify(user));

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, tokens },
        });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Login failed' },
      });
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authClient.register(userData);

      if (response.success && response.data) {
        const { user, tokens } = response.data;

        // Store in localStorage
        storage.setItem('swistack_token', tokens.accessToken);
        storage.setItem('swistack_refresh_token', tokens.refreshToken);
        storage.setItem('swistack_user', JSON.stringify(user));

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, tokens },
        });
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Registration failed' },
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = storage.getItem('swistack_refresh_token');
      
      if (refreshToken) {
        // Attempt to logout from server
        await authClient.logout(refreshToken);
      }
    } catch (error) {
      // Ignore errors during logout - we'll clear local storage anyway
      console.warn('Logout request failed:', error);
    } finally {
      clearStorage();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const refreshTokens = async () => {
    try {
      const refreshToken = storage.getItem('swistack_refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authClient.refreshToken({ refreshToken });

      if (response.success && response.data) {
        const newTokens = response.data.tokens;
        
        storage.setItem('swistack_token', newTokens.accessToken);
        storage.setItem('swistack_refresh_token', newTokens.refreshToken);

        dispatch({
          type: 'AUTH_REFRESH_SUCCESS',
          payload: { tokens: newTokens },
        });
      } else {
        throw new Error(response.error || 'Token refresh failed');
      }
    } catch (error) {
      // Refresh failed, logout user
      clearStorage();
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  const updateProfile = async (profileData: {
    firstName: string;
    lastName: string;
    username: string;
  }) => {
    try {
      if (!state.tokens?.accessToken) {
        throw new Error('No access token available');
      }

      const response = await authClient.updateProfile(profileData, state.tokens.accessToken);

      if (response.success && response.data) {
        const updatedUser = response.data.user;
        
        // Update user in storage
        storage.setItem('swistack_user', JSON.stringify(updatedUser));

        dispatch({
          type: 'AUTH_SET_USER',
          payload: { user: updatedUser },
        });
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Profile update failed' },
      });
      throw error;
    }
  };

  const updateAvatar = (avatarUrl: string) => {
    console.log('updateAvatar called with:', avatarUrl?.substring(0, 50) + '...');
    console.log('Current user:', state.user);
    
    if (state.user) {
      const updatedUser = { ...state.user, avatar: avatarUrl };
      console.log('Updated user object:', { ...updatedUser, avatar: updatedUser.avatar?.substring(0, 50) + '...' });
      
      // Update user in storage
      storage.setItem('swistack_user', JSON.stringify(updatedUser));
      console.log('User saved to localStorage');

      dispatch({
        type: 'AUTH_SET_USER',
        payload: { user: updatedUser },
      });
      console.log('Auth context updated');
    } else {
      console.error('No user in state, cannot update avatar');
    }
  };

  const changePassword = async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      if (!state.tokens?.accessToken) {
        throw new Error('No access token available');
      }

      const response = await authClient.changePassword(passwordData, state.tokens.accessToken);

      if (!response.success) {
        throw new Error(response.error || 'Password change failed');
      }

      // Password change succeeded - user will need to log in again
      clearStorage();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Password change failed' },
      });
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authClient.forgotPassword({ email });

      if (!response.success) {
        throw new Error(response.error || 'Password reset request failed');
      }

      // Reset request succeeded  
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Password reset request failed' },
      });
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string, confirmPassword: string) => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Frontend validates passwords match, but backend only expects token and password
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await authClient.resetPassword({ token, password });

      if (!response.success) {
        throw new Error(response.error || 'Password reset failed');
      }

      // Password reset succeeded
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Password reset failed' },
      });
      throw error;
    }
  };

  const clearError = () => {
    if (state.error) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: state.user!, tokens: state.tokens! },
      });
    }
  };

  const setTokens = async (tokens: AuthTokens) => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Store tokens in localStorage
      storage.setItem('swistack_token', tokens.accessToken);
      storage.setItem('swistack_refresh_token', tokens.refreshToken);

      // Fetch user data using the new access token
      console.log('Fetching user profile with token:', tokens.accessToken.substring(0, 50) + '...');
      const userResponse = await authClient.getProfile(tokens.accessToken);
      
      console.log('Profile response:', userResponse);
      
      if (userResponse.success && userResponse.data) {
        const user = userResponse.data;
        console.log('Setting user data:', user);
        
        // Store user in localStorage
        storage.setItem('swistack_user', JSON.stringify(user));

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, tokens },
        });
      } else {
        throw new Error(`Failed to fetch user profile: ${userResponse.error || 'Unknown error'}`);
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Failed to set tokens' },
      });
      throw error;
    }
  };

  const clearStorage = () => {
    storage.removeItem('swistack_token');
    storage.removeItem('swistack_refresh_token');
    storage.removeItem('swistack_user');
  };

  const cleanupCorruptedStorage = () => {
    try {
      const userStr = storage.getItem('swistack_user');
      if (userStr === 'undefined' || userStr === 'null') {
        console.log('Cleaning up corrupted localStorage data');
        clearStorage();
      }
      
      // Also check if it's valid JSON
      if (userStr && userStr !== 'null' && userStr !== 'undefined') {
        JSON.parse(userStr);
      }
    } catch (error) {
      console.log('Found corrupted localStorage data, clearing...');
      clearStorage();
    }
  };

  // Debug auth state changes
  useEffect(() => {
    console.log('AuthContext state changed:', {
      hasUser: !!state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      hasTokens: !!state.tokens,
      error: state.error
    });
  }, [state]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshTokens,
    updateProfile,
    updateAvatar,
    changePassword,
    forgotPassword,
    resetPassword,
    setTokens,
    clearError,
    token: state.tokens?.accessToken || null,
    httpClient,
    isTokenExpired: isTokenExpiredCheck,
    getTimeUntilExpiry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}