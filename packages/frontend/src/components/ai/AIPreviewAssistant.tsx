'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  X, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  Wrench,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface AIAnalysis {
  projectId: string;
  timestamp: Date;
  issues: string[];
  suggestions: string[];
  autoFixApplied: boolean;
  confidence: number;
}

interface AIPreviewAssistantProps {
  projectId: string;
  isVisible: boolean;
  onToggle: () => void;
}

export default function AIPreviewAssistant({ projectId, isVisible, onToggle }: AIPreviewAssistantProps) {
  const { socket } = useSocket();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentFixes, setRecentFixes] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // Listen for AI monitoring events
    socket.on('ai:monitoring-started', (data) => {
      if (data.projectId === projectId) {
        setIsMonitoring(true);
      }
    });

    socket.on('ai:monitoring-stopped', (data) => {
      if (data.projectId === projectId) {
        setIsMonitoring(false);
      }
    });

    // Listen for AI suggestions
    socket.on('ai:suggestions', (data) => {
      if (data.projectId === projectId) {
        setCurrentAnalysis(data.analysis);
        setSuggestions(data.analysis.suggestions);
      }
    });

    // Listen for auto-fix notifications
    socket.on('ai:auto-fix-applied', (data) => {
      if (data.projectId === projectId) {
        setRecentFixes(prev => [data, ...prev.slice(0, 4)]);
        
        // Show success notification
        setTimeout(() => {
          setRecentFixes(prev => prev.filter(fix => fix.timestamp !== data.timestamp));
        }, 10000);
      }
    });

    return () => {
      socket.off('ai:monitoring-started');
      socket.off('ai:monitoring-stopped');
      socket.off('ai:suggestions');
      socket.off('ai:auto-fix-applied');
    };
  }, [socket, projectId]);

  const startMonitoring = useCallback(() => {
    if (socket) {
      socket.emit('ai:start-monitoring', { projectId, userId: 'current-user' });
    }
  }, [socket, projectId]);

  const stopMonitoring = useCallback(() => {
    if (socket) {
      socket.emit('ai:stop-monitoring', { projectId });
    }
  }, [socket, projectId]);

  const dismissSuggestion = useCallback((index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const applySuggestion = useCallback(async (suggestion: string) => {
    // This would integrate with the editor to apply the suggestion
    console.log('Applying suggestion:', suggestion);
    // TODO: Implement actual suggestion application
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Show AI Assistant"
      >
        <Bot className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot className={`w-5 h-5 ${isMonitoring ? 'text-teal-400' : 'text-gray-400'}`} />
          <h3 className="text-sm font-medium text-white">AI Preview Assistant</h3>
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400' : 'bg-gray-500'}`} />
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 max-h-96 overflow-y-auto">
          {/* Monitoring Control */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Preview Monitoring</span>
              <button
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs ${
                  isMonitoring 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {isMonitoring ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{isMonitoring ? 'Stop' : 'Start'}</span>
              </button>
            </div>
            
            {isMonitoring && (
              <div className="text-xs text-teal-400 bg-teal-900/30 px-2 py-1 rounded">
                🤖 Actively monitoring for issues and optimizations
              </div>
            )}
          </div>

          {/* Recent Auto-fixes */}
          {recentFixes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Recent Auto-fixes
              </h4>
              <div className="space-y-1">
                {recentFixes.map((fix, index) => (
                  <div key={index} className="text-xs bg-green-900/30 text-green-300 p-2 rounded border-l-2 border-green-400">
                    <div className="font-medium">✅ {fix.fix}</div>
                    <div className="text-green-400/70 mt-1">
                      {new Date(fix.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Issues and Suggestions */}
          {currentAnalysis && currentAnalysis.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Detected Issues
              </h4>
              <div className="space-y-1">
                {currentAnalysis.issues.map((issue, index) => (
                  <div key={index} className="text-xs bg-red-900/30 text-red-300 p-2 rounded border-l-2 border-red-400">
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center">
                <Lightbulb className="w-3 h-3 mr-1" />
                AI Suggestions
              </h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-blue-900/30 text-blue-200 p-2 rounded border-l-2 border-blue-400">
                    <div className="text-xs mb-2">{suggestion}</div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded flex items-center space-x-1"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Apply</span>
                      </button>
                      <button
                        onClick={() => dismissSuggestion(index)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Indicator */}
          {currentAnalysis && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>AI Confidence</span>
                <span>{Math.round(currentAnalysis.confidence * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    currentAnalysis.confidence > 0.7 ? 'bg-green-500' :
                    currentAnalysis.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${currentAnalysis.confidence * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Status */}
          {!currentAnalysis && suggestions.length === 0 && (
            <div className="text-center py-4">
              <Bot className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <div className="text-xs text-gray-500">
                {isMonitoring ? 
                  'Monitoring your preview for issues...' : 
                  'Start monitoring to get AI assistance'
                }
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {/* TODO: Analyze current preview */}}
                className="flex items-center justify-center space-x-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded"
              >
                <Zap className="w-3 h-3" />
                <span>Analyze Now</span>
              </button>
              <button
                onClick={() => {/* TODO: Optimize preview */}}
                className="flex items-center justify-center space-x-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded"
              >
                <Clock className="w-3 h-3" />
                <span>Optimize</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}