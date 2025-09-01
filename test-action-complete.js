// Comprehensive test for action extraction
const http = require('http');

console.log('🧪 Comprehensive Action Extraction Test');
console.log('=======================================\n');

const tests = [
  {
    name: 'File Creation',
    message: 'Create a file called hello.js with a console.log statement'
  },
  {
    name: 'Package Installation',
    message: 'Install the lodash package'
  },
  {
    name: 'Command Execution',
    message: 'Run the command npm test'
  },
  {
    name: 'Multiple Actions',
    message: 'Create an express server in app.js and install express package'
  }
];

let testIndex = 0;

function runTest() {
  if (testIndex >= tests.length) {
    console.log('\n🎉 ALL TESTS COMPLETED!');
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

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success) {
          const actions = response.data?.response?.metadata?.actions || [];
          
          if (actions.length > 0) {
            console.log(`✅ ${test.name}: ${actions.length} action(s) extracted`);
            actions.forEach(action => {
              console.log(`   - ${action.type}: ${action.description}`);
            });
          } else {
            console.log(`❌ ${test.name}: No actions extracted`);
          }
        } else {
          console.log(`❌ ${test.name}: Request failed`);
        }
      } catch (e) {
        console.log(`❌ ${test.name}: Parse error`);
      }
      
      testIndex++;
      setTimeout(runTest, 1000); // Wait 1 second between tests
    });
  });

  req.on('error', (e) => {
    console.error(`❌ ${test.name}: Connection error`);
    testIndex++;
    setTimeout(runTest, 1000);
  });

  req.write(postData);
  req.end();
}

runTest();