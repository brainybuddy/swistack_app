'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OAuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    setError(errorParam || 'An unknown error occurred during authentication');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="text-center max-w-md">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">
            Authentication Failed
          </h1>
          
          <p className="text-gray-400 mb-6 text-center">
            {error}
          </p>
          
          <div className="space-y-3 w-full">
            <Link
              href="/login"
              className="w-full flex items-center justify-center px-4 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Login
            </Link>
            
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2.5 text-gray-400 hover:text-white transition-colors"
            >
              Go Back
            </button>
          </div>
          
          <p className="text-gray-500 text-sm mt-6">
            If you continue to experience issues, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}