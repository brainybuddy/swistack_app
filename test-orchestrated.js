// Test script for orchestrated AI endpoint
const fetch = require('node-fetch');

async function testOrchestratedEndpoint() {
  console.log('Testing orchestrated AI endpoint...');
  
  try {
    // First, we need to get a token (simulate login)
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('Login failed, using demo mode without auth');
      // For testing, we'll temporarily disable auth requirement
    }
    
    const token = loginData.data?.token || 'demo-token';
    
    // Test the orchestrated endpoint
    const response = await fetch('http://localhost:3001/api/ai/chat/orchestrated', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: 'test-project',
        message: 'Hello, can you help me create a simple function?',
        options: {
          includeProjectContext: true,
          autoExecute: false // Don't execute for testing
        }
      })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Orchestrated endpoint is working!');
      console.log('Response content:', data.data?.response?.content?.substring(0, 200) + '...');
      console.log('Executed actions:', data.data?.executedActions?.length || 0);
    } else {
      console.log('❌ Orchestrated endpoint failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOrchestratedEndpoint();