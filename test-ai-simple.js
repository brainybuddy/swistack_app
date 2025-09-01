// Simple test to verify orchestrated endpoint exists and responds
const http = require('http');

const postData = JSON.stringify({
  projectId: 'test-project',
  message: 'Create a simple hello world function in JavaScript',
  options: {
    includeProjectContext: false,
    autoExecute: false
  }
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/ai/chat/orchestrated',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing orchestrated AI endpoint...');
console.log('Sending request to:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Response received:', response.success ? '✅ SUCCESS' : '❌ FAILED');
      
      if (response.success) {
        console.log('AI Response preview:', response.data?.response?.content?.substring(0, 100) + '...');
        console.log('Actions executed:', response.data?.executedActions?.length || 0);
        console.log('Results:', response.data?.results?.length || 0);
      } else {
        console.log('Error:', response.error);
      }
    } catch (e) {
      console.log('Raw response:', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connection failed: ${e.message}`);
  console.log('Make sure the backend is running: npm run dev:backend');
});

req.write(postData);
req.end();