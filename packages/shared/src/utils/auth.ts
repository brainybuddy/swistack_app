import { JWTPayload, AuthTokens } from '../types/auth';

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
}

export function getTokenExpirationTime(token: string): number | null {
  const decoded = decodeJWT(token);
  return decoded ? decoded.exp * 1000 : null;
}

export function shouldRefreshToken(token: string, thresholdMinutes: number = 5): boolean {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return true;
  
  const currentTime = Date.now();
  const timeUntilExpiry = expirationTime - currentTime;
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  return timeUntilExpiry <= thresholdMs;
}

export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

export function sanitizeUserForClient<T extends Record<string, any>>(user: T): Omit<T, 'password' | 'passwordHash'> {
  const { password, passwordHash, ...sanitizedUser } = user;
  return sanitizedUser;
}

export function validateTokenStructure(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

export function createTokenStorage() {
  const isClient = typeof window !== 'undefined';
  
  return {
    getItem: (key: string): string | null => {
      if (!isClient) return null;
      return localStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
      if (isClient) {
        localStorage.setItem(key, value);
      }
    },
    removeItem: (key: string): void => {
      if (isClient) {
        localStorage.removeItem(key);
      }
    },
    clear: (): void => {
      if (isClient) {
        localStorage.clear();
      }
    }
  };
}

export function formatAuthError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return 'An authentication error occurred';
}