// Test action extraction from AI responses
const http = require('http');

console.log('🧪 Testing AI Action Extraction');
console.log('================================\n');

// Test message that should trigger action extraction
const testMessage = `Please create a new JavaScript file called utils.js with a function that calculates the factorial of a number`;

const postData = JSON.stringify({
  projectId: 'test-project',
  message: testMessage,
  options: {
    includeProjectContext: false,
    autoExecute: false  // Don't execute, just extract
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

console.log('📤 Sending message to test action extraction...');
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
        
        // Check AI response content
        const content = response.data?.response?.content;
        if (content) {
          console.log('\n📝 AI Response includes:');
          // Check if response has [ACTIONS] block
          if (content.includes('[ACTIONS]')) {
            console.log('   ✅ [ACTIONS] block found in response');
            
            // Extract and display the actions block
            const actionsMatch = content.match(/\[ACTIONS\]([\s\S]*?)\[\/ACTIONS\]/);
            if (actionsMatch) {
              console.log('\n📋 Actions block content:');
              console.log('-------------------');
              console.log(actionsMatch[1]);
              console.log('-------------------');
            }
          } else {
            console.log('   ⚠️  No [ACTIONS] block in response');
          }
        }
        
        // Check extracted actions
        const extractedActions = response.data?.response?.metadata?.actions;
        console.log('\n🎯 Extracted Actions:', extractedActions?.length || 0);
        
        if (extractedActions && extractedActions.length > 0) {
          console.log('\n✅ ACTION EXTRACTION SUCCESSFUL!');
          extractedActions.forEach((action, i) => {
            console.log(`\n   Action ${i + 1}:`);
            console.log(`   - Type: ${action.type}`);
            console.log(`   - Description: ${action.description}`);
            console.log(`   - Parameters:`, JSON.stringify(action.params, null, 2));
            console.log(`   - Requires Confirmation: ${action.requiresConfirmation}`);
          });
          
          console.log('\n🎉 TEST PASSED: Action extraction is working!');
        } else {
          console.log('\n⚠️  No actions were extracted');
          console.log('   The AI may not have included actions in its response');
          console.log('   Check if the response contains an [ACTIONS] block');
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
  console.log('Make sure the backend is running with API keys configured');
});

req.write(postData);
req.end();