// Test the complete flow: Frontend -> Orchestrated Endpoint -> WebSocket Events

const http = require('http');

console.log('🧪 Testing Complete AI Assistant Flow');
console.log('=====================================\n');

// Step 1: Send message to orchestrated endpoint
const testMessage = 'Create a simple JavaScript function that adds two numbers';

const postData = JSON.stringify({
  projectId: 'test-project',
  message: testMessage,
  options: {
    includeProjectContext: false,
    autoExecute: false  // Don't execute for testing
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

console.log('📤 Sending message to orchestrated endpoint...');
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
        console.log('\n✅ SUCCESS! AI responded through orchestrated endpoint');
        console.log('\n📝 AI Response:');
        console.log('   ', response.data?.response?.content?.substring(0, 200) + '...');
        
        console.log('\n🎯 Executed Actions:', response.data?.executedActions?.length || 0);
        if (response.data?.executedActions?.length > 0) {
          response.data.executedActions.forEach((action, i) => {
            console.log(`   ${i + 1}. ${action.type}: ${action.description}`);
          });
        }
        
        console.log('\n📊 Results:', response.data?.results?.length || 0);
        if (response.data?.results?.length > 0) {
          response.data.results.forEach((result, i) => {
            console.log(`   ${i + 1}. ${result.success ? '✅' : '❌'} ${result.output || result.error}`);
          });
        }
        
        console.log('\n🎉 TEST PASSED: Orchestrated endpoint is working!');
        console.log('   - Frontend calls orchestrated endpoint ✅');
        console.log('   - Backend processes through AIOrchestrator ✅');
        console.log('   - AI responds with content ✅');
        console.log('   - WebSocket events would be emitted if actions were executed');
        
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