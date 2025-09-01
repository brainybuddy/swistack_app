// Test action extraction with verbose output
const http = require('http');

console.log('🧪 Testing AI Action Extraction (Verbose)');
console.log('=========================================\n');

// Test message that should trigger action extraction
const testMessage = `Please create a new JavaScript file called utils.js with a function that calculates the factorial of a number. Make sure to include the file creation action.`;

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
        
        console.log('\n===== FULL AI RESPONSE CONTENT =====');
        console.log(aiResponse?.content);
        console.log('===== END OF RESPONSE =====\n');
        
        console.log('📊 Response Metadata:');
        console.log('   Model:', aiResponse?.model);
        console.log('   Tokens:', aiResponse?.tokens);
        console.log('   Actions:', aiResponse?.metadata?.actions?.length || 0);
        console.log('   Suggestions:', aiResponse?.metadata?.suggestions?.length || 0);
        
        if (aiResponse?.metadata?.actions && aiResponse.metadata.actions.length > 0) {
          console.log('\n✅ Actions were extracted:');
          console.log(JSON.stringify(aiResponse.metadata.actions, null, 2));
        } else {
          console.log('\n⚠️  No actions extracted');
          console.log('The system prompt may need adjustment or the AI is not following instructions');
        }
        
      } else {
        console.log('\n❌ FAILED:', response.error);
      }
    } catch (e) {
      console.log('\n❌ Failed to parse response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Connection failed: ${e.message}`);
});

req.write(postData);
req.end();