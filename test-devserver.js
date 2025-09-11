// Test script to manually start the dev server
const { nixDevServerManager } = require('./packages/backend/dist/services/NixDevServerManager');

const projectId = '5142211c-9b7e-47d0-bf44-1baedb5e19a1';
const userId = 'test-user';

async function startDevServer() {
  console.log('Starting dev server for project:', projectId);
  
  try {
    const result = await nixDevServerManager.start(projectId, userId);
    
    if (result.success) {
      console.log('✅ Dev server started successfully');
      console.log('URL:', result.url);
      console.log('Port:', result.port);
    } else {
      console.log('❌ Failed to start dev server:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

startDevServer();