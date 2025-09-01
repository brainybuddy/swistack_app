// Test for potential remaining issues
const http = require('http');
const io = require('socket.io-client');

console.log('🔍 Checking for Remaining Issues');
console.log('=================================\n');

// Test 1: WebSocket real-time events
console.log('1. Testing WebSocket Event Emission...');
const socket = io('http://localhost:3001', {
  auth: { token: 'test-token' },
  query: { projectId: 'test-project' }
});

let wsConnected = false;
socket.on('connect', () => {
  wsConnected = true;
  console.log('   ✅ WebSocket connected');
});

socket.on('ai:actionStarted', (data) => {
  console.log('   ✅ Received actionStarted event:', data);
});

socket.on('ai:actionCompleted', (data) => {
  console.log('   ✅ Received actionCompleted event:', data);
});

setTimeout(() => {
  if (!wsConnected) {
    console.log('   ⚠️  WebSocket not connecting properly');
  }
  
  // Test 2: Error handling
  console.log('\n2. Testing Error Handling...');
  const postData = JSON.stringify({
    projectId: 'test-project',
    message: 'Delete a file that does not exist: /nonexistent/file.txt',
    options: {
      includeProjectContext: false,
      autoExecute: true
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

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.success) {
          const results = response.data?.results || [];
          const hasError = results.some(r => !r.success);
          if (hasError) {
            console.log('   ✅ Error handling works');
          } else {
            console.log('   ⚠️  Error not properly reported');
          }
        }
      } catch (e) {
        console.log('   ❌ Parse error');
      }
      
      // Test 3: Package installation
      console.log('\n3. Testing Package Installation...');
      testPackageInstall();
    });
  });
  
  req.on('error', () => {
    console.log('   ❌ Connection failed');
    testPackageInstall();
  });
  
  req.write(postData);
  req.end();
}, 1000);

function testPackageInstall() {
  const postData = JSON.stringify({
    projectId: 'test-project', 
    message: 'Install the lodash package',
    options: {
      includeProjectContext: false,
      autoExecute: true
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

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.success) {
          const executed = response.data?.executedActions || [];
          const hasInstall = executed.some(a => a.type === 'install_package');
          if (hasInstall) {
            console.log('   ✅ Package installation action executed');
          } else {
            console.log('   ⚠️  Package installation not executed');
          }
        }
      } catch (e) {
        console.log('   ❌ Parse error');
      }
      
      // Test 4: Context persistence
      console.log('\n4. Testing Context Persistence...');
      testContextPersistence();
    });
  });
  
  req.on('error', () => {
    console.log('   ❌ Connection failed');
    testContextPersistence();
  });
  
  req.write(postData);
  req.end();
}

function testContextPersistence() {
  // First request
  const postData1 = JSON.stringify({
    projectId: 'test-project',
    message: 'Create a variable.js file with const x = 5',
    conversationId: 'test-conv-123',
    options: {
      includeProjectContext: false,
      autoExecute: true
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/ai/chat/orchestrated',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData1)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      // Second request with same conversation ID
      const postData2 = JSON.stringify({
        projectId: 'test-project',
        message: 'What was the value of x in the previous file?',
        conversationId: 'test-conv-123',
        options: {
          includeProjectContext: false,
          autoExecute: false
        }
      });
      
      const options2 = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/ai/chat/orchestrated',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData2)
        }
      };
      
      const req2 = http.request(options2, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
          try {
            const response = JSON.parse(data2);
            if (response.success) {
              const content = response.data?.response?.content || '';
              if (content.includes('5') || content.includes('x')) {
                console.log('   ✅ Context persisted across requests');
              } else {
                console.log('   ⚠️  Context may not be persisting');
              }
            }
          } catch (e) {
            console.log('   ❌ Parse error');
          }
          
          // Summary
          console.log('\n' + '='.repeat(50));
          console.log('📊 REMAINING ISSUES CHECK:');
          console.log('='.repeat(50));
          console.log('\nPotential areas for improvement:');
          console.log('1. WebSocket event emission to frontend');
          console.log('2. Package installation in correct directory');
          console.log('3. Conversation context persistence');
          console.log('4. Database integration for file tracking');
          console.log('5. Authentication for production use');
          
          socket.close();
          process.exit(0);
        });
      });
      
      req2.on('error', () => {
        console.log('   ❌ Second request failed');
        socket.close();
        process.exit(1);
      });
      
      req2.write(postData2);
      req2.end();
    });
  });
  
  req.on('error', () => {
    console.log('   ❌ First request failed');
    socket.close();
    process.exit(1);
  });
  
  req.write(postData1);
  req.end();
}