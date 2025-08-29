'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return; // Prevent infinite loop
    const handleOAuthCallback = async () => {
      try {
        setProcessed(true); // Mark as processed to prevent loops
        console.log('OAuth callback - all search params:', searchParams.toString());
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const provider = searchParams.get('provider');
        
        console.log('OAuth callback - extracted values:', { token, refreshToken, provider });

        if (!token || !refreshToken) {
          console.error('Missing tokens - token:', !!token, 'refreshToken:', !!refreshToken);
          throw new Error('Missing authentication tokens');
        }

        console.log('About to call setTokens...');
        
        // Extract expiration from JWT token
        let expiresIn = 900; // Default 15 minutes
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);
          expiresIn = Math.floor((decoded.exp * 1000 - Date.now()) / 1000);
        } catch (e) {
          console.warn('Could not decode JWT expiration, using default:', e);
        }
        
        // Use the proper setTokens function to fetch complete user profile from backend
        console.log('Setting tokens and fetching user profile from backend...');
        await setTokens({
          accessToken: token,
          refreshToken: refreshToken,
          expiresIn: expiresIn
        });

        setStatus('success');
        
        // Redirect to workspace immediately
        router.push('/workspace');

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'OAuth authentication failed');
        setStatus('error');
        
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, setTokens, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="text-center">
        <div className="mb-4">
          {status === 'processing' && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-teal-500 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-white">Completing authentication...</h2>
              <p className="text-gray-400 mt-2">Please wait while we sign you in.</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Successfully signed in!</h2>
              <p className="text-gray-400 mt-2">Redirecting to your workspace...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Authentication failed</h2>
              <p className="text-gray-400 mt-2">{error}</p>
              <p className="text-gray-500 text-sm mt-2">Redirecting to login page...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}