import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { ScanStats, VirusScanResponse } from '@swistack/shared';

interface VirusScanStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const VirusScanStatus: React.FC<VirusScanStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScanStatus();
  }, []);

  const fetchScanStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files/scan/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      const data: VirusScanResponse = await response.json();
      
      if (data.success && data.data) {
        setScanStats(data.data.scanStats);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch scan status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <Shield className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Checking security status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <ShieldAlert className="w-4 h-4" />
        <span className="text-sm">Security status unavailable</span>
        {showDetails && (
          <div className="ml-2 text-xs text-gray-400">({error})</div>
        )}
      </div>
    );
  }

  if (!scanStats) return null;

  const isFullyProtected = scanStats.clamAvAvailable;

  return (
    <div className={`security-status ${className}`}>
      {/* Main Status Indicator */}
      <div className="flex items-center space-x-2">
        {isFullyProtected ? (
          <ShieldCheck className="w-4 h-4 text-green-500" />
        ) : (
          <Shield className="w-4 h-4 text-yellow-500" />
        )}
        <span className={`text-sm font-medium ${
          isFullyProtected ? 'text-green-700' : 'text-yellow-700'
        }`}>
          {isFullyProtected ? 'Full Protection Active' : 'Basic Protection Active'}
        </span>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Security Details</h4>
          
          <div className="space-y-2 text-xs">
            {/* ClamAV Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Virus Scanner:</span>
              <span className={`font-medium ${
                scanStats.clamAvAvailable ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {scanStats.clamAvAvailable ? 'ClamAV Active' : 'Basic Validation'}
              </span>
            </div>

            {/* File Size Limit */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Max File Size:</span>
              <span className="font-medium text-gray-800">
                {formatFileSize(scanStats.maxFileSize)}
              </span>
            </div>

            {/* Scan Timeout */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Scan Timeout:</span>
              <span className="font-medium text-gray-800">
                {(scanStats.defaultTimeout / 1000).toFixed(0)}s
              </span>
            </div>

            {/* Allowed Types */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Allowed Types:</span>
              <span className="font-medium text-gray-800">
                {scanStats.allowedMimeTypes} types
              </span>
            </div>

            {/* Blocked Extensions */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Blocked Extensions:</span>
              <span className="font-medium text-gray-800">
                {scanStats.blockedExtensions} extensions
              </span>
            </div>
          </div>

          {/* Warning for Basic Protection */}
          {!scanStats.clamAvAvailable && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <div className="font-medium">ClamAV Not Available</div>
                <div className="mt-1">
                  Only basic file validation is active. Install ClamAV for enhanced security.
                </div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <button
              onClick={fetchScanStatus}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirusScanStatus;