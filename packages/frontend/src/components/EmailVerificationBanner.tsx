'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, X, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface EmailVerificationBannerProps {
  email: string;
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({ email, onDismiss }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  const handleResendVerification = async () => {
    setIsResending(true);
    setError('');
    setIsSuccess(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 5000); // Hide success message after 5 seconds
      } else {
        setError(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Mail className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-400">
                Please verify your email address
              </h3>
              <p className="mt-1 text-sm text-yellow-300">
                We sent a verification link to <span className="font-medium">{email}</span>. 
                Please check your email and click the link to activate your account.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 ml-3 p-1 hover:bg-yellow-800/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-yellow-400" />
            </button>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-900/50 border border-red-500/50 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {isSuccess && (
            <div className="mt-3 p-3 bg-green-900/50 border border-green-500/50 rounded-lg flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400">Verification email sent successfully!</p>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResendVerification}
              disabled={isResending || isSuccess}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg font-medium text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isResending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Email</span>
                </>
              )}
            </button>
            
            <p className="text-xs text-yellow-300/70 self-center">
              Didn't receive the email? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}