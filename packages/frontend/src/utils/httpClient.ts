import { HttpClient } from '@swistack/shared';

// Create and configure the HTTP client for frontend use
const authConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  tokenStorageKey: 'swistack_access_token',
  refreshTokenKey: 'swistack_refresh_token',
};

export const httpClient = new HttpClient(authConfig);

// Export both the configured instance and the class for flexibility
export { HttpClient };