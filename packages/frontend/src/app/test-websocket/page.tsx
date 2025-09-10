'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function TestWebSocketPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testProjectId] = useState('test-project-123');
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const { isConnected, connectionError, emit, on } = useWebSocket({
    projectId: testProjectId,
    onConnect: () => addLog('✅ WebSocket connected!'),
    onDisconnect: () => addLog('❌ WebSocket disconnected'),
    onError: (error) => addLog(`❌ Error: ${error.message}`)
  });

  useEffect(() => {
    if (!isConnected) return;

    // Setup test listeners
    const cleanupFns: (() => void)[] = [];

    const thinkingCleanup = on('ai:thinking', () => {
      addLog('🤔 AI is thinking...');
    });
    if (thinkingCleanup) cleanupFns.push(thinkingCleanup);

    const actionStartedCleanup = on('ai:actionStarted', (data) => {
      addLog(`🚀 Action started: ${JSON.stringify(data)}`);
    });
    if (actionStartedCleanup) cleanupFns.push(actionStartedCleanup);

    const actionCompletedCleanup = on('ai:actionCompleted', (data) => {
      addLog(`✅ Action completed: ${JSON.stringify(data)}`);
    });
    if (actionCompletedCleanup) cleanupFns.push(actionCompletedCleanup);

    const actionFailedCleanup = on('ai:actionFailed', (data) => {
      addLog(`❌ Action failed: ${JSON.stringify(data)}`);
    });
    if (actionFailedCleanup) cleanupFns.push(actionFailedCleanup);

    const fileChangedCleanup = on('file:changed', (data) => {
      addLog(`📁 File changed: ${data.filePath}`);
    });
    if (fileChangedCleanup) cleanupFns.push(fileChangedCleanup);

    const terminalOutputCleanup = on('terminal:output', (data) => {
      addLog(`💻 Terminal: ${data.data}`);
    });
    if (terminalOutputCleanup) cleanupFns.push(terminalOutputCleanup);

    return () => {
      cleanupFns.forEach(cleanup => cleanup());
    };
  }, [isConnected, on]);

  const testEmitEvent = () => {
    if (!isConnected) {
      addLog('Cannot emit - not connected');
      return;
    }

    addLog('Sending test event to server...');
    emit('ai:chat', {
      projectId: testProjectId,
      message: 'Test message from WebSocket',
      conversationId: 'test-conv-123'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">WebSocket Connection Test</h1>
      
      <div className="mb-6 space-y-2">
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">Status:</span>
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        
        {connectionError && (
          <div className="text-red-400">
            Error: {connectionError}
          </div>
        )}
        
        <div className="text-gray-400">
          Project ID: {testProjectId}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={testEmitEvent}
          disabled={!isConnected}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:text-gray-500 rounded"
        >
          Send Test Event
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Event Logs:</h2>
        <div className="space-y-1 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">No events yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-gray-300">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}