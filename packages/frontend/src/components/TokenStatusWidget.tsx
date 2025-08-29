'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Shield, RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function TokenStatusWidget() {
  const { isAuthenticated, isTokenExpired, getTimeUntilExpiry, refreshTokens, token } = useAuth();
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const updateTimer = () => {
      const timeLeft = getTimeUntilExpiry();
      setTimeUntilExpiry(timeLeft);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getTimeUntilExpiry, token]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTokens();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Expired';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (): string => {
    if (!isAuthenticated || isTokenExpired()) return 'text-red-400';
    if (timeUntilExpiry && timeUntilExpiry < 5 * 60 * 1000) return 'text-yellow-400'; // Less than 5 minutes
    return 'text-green-400';
  };

  const getStatusIcon = () => {
    if (!isAuthenticated || isTokenExpired()) return <XCircle className="w-5 h-5 text-red-400" />;
    if (timeUntilExpiry && timeUntilExpiry < 5 * 60 * 1000) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <CheckCircle className="w-5 h-5 text-green-400" />;
  };

  const getStatusText = (): string => {
    if (!isAuthenticated) return 'Not authenticated';
    if (isTokenExpired()) return 'Token expired';
    if (timeUntilExpiry && timeUntilExpiry < 5 * 60 * 1000) return 'Token expiring soon';
    return 'Token valid';
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-gray-400" />
          <div>
            <h4 className="font-medium text-white">Authentication Status</h4>
            <p className="text-sm text-gray-400">Not authenticated</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h4 className="font-medium text-white">Token Status</h4>
            <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
          </div>
        </div>
        
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Time until expiry:</span>
          </div>
          <span className={getStatusColor()}>
            {timeUntilExpiry !== null ? formatTimeRemaining(timeUntilExpiry) : 'Unknown'}
          </span>
        </div>
        
        {token && (
          <div className="text-xs text-gray-500 font-mono">
            Token: ...{token.slice(-8)}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {timeUntilExpiry !== null && timeUntilExpiry > 0 && (
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeUntilExpiry < 5 * 60 * 1000 ? 'bg-yellow-500' : 
                timeUntilExpiry < 10 * 60 * 1000 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, (timeUntilExpiry / (60 * 60 * 1000)) * 100))}%`
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Token health (assuming 1 hour lifetime)
          </p>
        </div>
      )}
    </div>
  );
}