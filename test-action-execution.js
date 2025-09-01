// Test complete action execution flow
const http = require('http');

console.log('🧪 Testing Complete Action Execution');
console.log('====================================\n');

// Test with autoExecute enabled
const testMessage = `Please create a simple test file called hello.txt with the content "Hello from AI!" and then list the files in the current directory`;

const postData = JSON.stringify({
  projectId: 'test-project',
  message: testMessage,
  options: {
    includeProjectContext: false,
    autoExecute: true  // Enable auto-execution
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

console.log('📤 Sending message with auto-execution enabled...');
console.log('   Message:', testMessage);

const req = http.request(options, (res) => {
  console.log(`\n📥 Response Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('\n✅ Response received successfully');
        
        const aiResponse = response.data?.response;
        const executedActions = response.data?.executedActions || [];
        const results = response.data?.results || [];
        
        // Check extracted actions
        const extractedActions = aiResponse?.metadata?.actions || [];
        console.log('\n📋 Extracted Actions:', extractedActions.length);
        extractedActions.forEach((action, i) => {
          console.log(`   ${i + 1}. ${action.type}: ${action.description}`);
        });
        
        // Check executed actions
        console.log('\n🎯 Executed Actions:', executedActions.length);
        executedActions.forEach((action, i) => {
          console.log(`   ${i + 1}. ${action.type}: ${action.description || 'No description'}`);
        });
        
        // Check execution results
        console.log('\n📊 Execution Results:', results.length);
        results.forEach((result, i) => {
          console.log(`   ${i + 1}. Success: ${result.success}`);
          if (result.output) {
            console.log(`      Output: ${result.output.substring(0, 100)}`);
          }
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        });
        
        if (executedActions.length > 0 && results.length > 0) {
          console.log('\n🎉 TEST PASSED: Actions are being executed!');
        } else {
          console.log('\n⚠️  Actions were extracted but not executed');
          console.log('   Check if auto-execution is working properly');
        }
        
      } else {
        console.log('\n❌ FAILED:', response.error);
      }
    } catch (e) {
      console.log('\n❌ Failed to parse response:', e.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Connection failed: ${e.message}`);
  console.log('Make sure the backend is running');
});

req.write(postData);
req.end();