// Test script to check if NixDevServer auto-starts when creating a project
const crypto = require('crypto');

// Mock the necessary modules
async function testAutoStart() {
  console.log('Testing NixDevServer auto-start functionality...\n');
  
  // Import the services
  const { ProjectService } = require('./packages/backend/dist/services/ProjectService');
  const { nixDevServerManager } = require('./packages/backend/dist/services/NixDevServerManager');
  const { TemplateService } = require('./packages/backend/dist/services/TemplateService');
  
  try {
    // First, get the e-learning template
    console.log('1. Fetching e-learning template...');
    const template = await TemplateService.getByKey('elearning-platform');
    if (!template) {
      console.error('❌ E-learning template not found!');
      return;
    }
    console.log('✅ Template found:', template.name);
    
    // Create a test project with the template
    const testUserId = 'test-user-' + crypto.randomUUID();
    const projectData = {
      name: 'Test E-Learning Auto-Start ' + Date.now(),
      description: 'Testing auto-start of NixDevServer',
      template: 'elearning-platform',
      templateData: template,
      isPublic: false
    };
    
    console.log('\n2. Creating project with auto-start enabled...');
    console.log('   Project name:', projectData.name);
    
    const project = await ProjectService.createProject(testUserId, projectData);
    
    console.log('✅ Project created with ID:', project.id);
    console.log('   Frontend Port:', project.frontendPort || 'Not allocated');
    console.log('   Backend Port:', project.backendPort || 'Not allocated');
    
    // Wait a bit for the server to start
    console.log('\n3. Waiting for NixDevServer to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the dev server is running
    const isRunning = nixDevServerManager.isRunning(project.id);
    const devUrl = nixDevServerManager.getUrl(project.id);
    const status = nixDevServerManager.getStatus(project.id);
    
    console.log('\n4. NixDevServer Status:');
    console.log('   Status:', status || 'Not started');
    console.log('   Running:', isRunning);
    console.log('   URL:', devUrl || 'Not available');
    
    if (isRunning && devUrl) {
      console.log('\n✅ SUCCESS: NixDevServer auto-started successfully!');
      console.log('   You can access the dev server at:', devUrl);
    } else {
      console.log('\n⚠️ WARNING: NixDevServer did not auto-start');
      console.log('   Check the logs for errors');
      
      // Get logs
      const logs = nixDevServerManager.getLogs(project.id);
      if (logs && logs.length > 0) {
        console.log('\nRecent logs:');
        logs.slice(-10).forEach(log => console.log('   ', log));
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
  }
  
  // Exit after test
  process.exit(0);
}

// Run the test
testAutoStart();