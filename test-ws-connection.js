const io = require('socket.io-client');

console.log('Testing WebSocket connection to backend...');

// Connect without auth first (for testing)
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: false
});

socket.on('connect', () => {
  console.log('✅ Connected! Socket ID:', socket.id);
  
  // Try to join a project room
  socket.emit('join:project', { projectId: 'test-123' });
  
  // Send a test message
  setTimeout(() => {
    console.log('Sending test message...');
    socket.emit('test', { message: 'Hello from test client' });
  }, 1000);
  
  // Disconnect after 3 seconds
  setTimeout(() => {
    console.log('Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('Make sure backend is running: npm run dev:backend');
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Listen for any events
socket.onAny((event, ...args) => {
  console.log(`📨 Received event: ${event}`, args);
});

console.log('Attempting to connect...');