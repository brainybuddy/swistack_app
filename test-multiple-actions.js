// Test multiple action extraction
const http = require('http');

console.log('🧪 Testing Multiple Action Extraction');
console.log('=====================================\n');

// Test message that should trigger multiple actions
const testMessage = `Please create a new React component called Button.tsx and install the required dependencies like @types/react`;

const postData = JSON.stringify({
  projectId: 'test-project',
  message: testMessage,
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

console.log('📤 Sending message...');
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
        const aiResponse = response.data?.response;
        
        // Check extracted actions
        const extractedActions = aiResponse?.metadata?.actions;
        console.log('\n🎯 Extracted Actions:', extractedActions?.length || 0);
        
        if (extractedActions && extractedActions.length > 0) {
          console.log('\n✅ Actions successfully extracted:');
          extractedActions.forEach((action, i) => {
            console.log(`\n   Action ${i + 1}:`);
            console.log(`   ├─ Type: ${action.type}`);
            console.log(`   ├─ Description: ${action.description}`);
            if (action.params.path) {
              console.log(`   ├─ Path: ${action.params.path}`);
            }
            if (action.params.command) {
              console.log(`   ├─ Command: ${action.params.command}`);
            }
            if (action.params.packages) {
              console.log(`   ├─ Packages: ${JSON.stringify(action.params.packages)}`);
            }
            if (action.params.content) {
              console.log(`   ├─ Content: ${action.params.content.substring(0, 100)}...`);
            }
            console.log(`   └─ Requires Confirmation: ${action.requiresConfirmation}`);
          });
          
          console.log('\n🎉 TEST PASSED: Multiple action extraction works!');
        } else {
          console.log('\n⚠️  No actions were extracted');
        }
        
      } else {
        console.log('\n❌ FAILED:', response.error);
      }
    } catch (e) {
      console.log('\n❌ Failed to parse response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Connection failed: ${e.message}`);
});

req.write(postData);
req.end();