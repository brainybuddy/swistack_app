// Test various terminal commands
const http = require('http');

console.log('🧪 Testing Terminal Command Execution');
console.log('=====================================\n');

const tests = [
  {
    name: 'List Files',
    message: 'Run the ls command to list files'
  },
  {
    name: 'Print Working Directory',
    message: 'Run the pwd command'
  },
  {
    name: 'Echo Command',
    message: 'Run echo "Hello from Terminal"'
  },
  {
    name: 'Multiple Commands',
    message: 'Create a file test.js with console.log("test") and run node test.js'
  }
];

let testIndex = 0;

function runTest() {
  if (testIndex >= tests.length) {
    console.log('\n🎉 ALL TERMINAL TESTS COMPLETED!');
    return;
  }

  const test = tests[testIndex];
  console.log(`\n📋 Test ${testIndex + 1}: ${test.name}`);
  console.log('─'.repeat(40));
  
  const postData = JSON.stringify({
    projectId: 'test-project',
    message: test.message,
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
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success) {
          const results = response.data?.results || [];
          const executedActions = response.data?.executedActions || [];
          
          console.log(`✅ ${test.name}: ${executedActions.length} action(s) executed`);
          
          // Show results
          results.forEach((result, i) => {
            if (result.success && result.output) {
              console.log(`   Output: ${result.output.substring(0, 100)}`);
            }
            if (!result.success && result.error) {
              console.log(`   Error: ${result.error.substring(0, 100)}`);
            }
          });
        } else {
          console.log(`❌ ${test.name}: Request failed`);
        }
      } catch (e) {
        console.log(`❌ ${test.name}: Parse error`);
      }
      
      testIndex++;
      setTimeout(runTest, 2000); // Wait 2 seconds between tests
    });
  });

  req.on('error', (e) => {
    console.error(`❌ ${test.name}: Connection error`);
    testIndex++;
    setTimeout(runTest, 2000);
  });

  req.write(postData);
  req.end();
}

runTest();