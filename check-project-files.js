const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function checkProjectFiles() {
  const projectId = '34be9bb9-62aa-43ce-805e-4bc0b0b07e1f';
  
  try {
    const files = await db('project_files')
      .where('projectId', projectId)
      .select('path', 'type', 'content', 'storageKey');
    
    console.log(`\n📁 Found ${files.length} files for project ${projectId}:\n`);
    
    files.forEach(file => {
      console.log(`- ${file.path} (${file.type})`);
      if (file.type === 'file') {
        console.log(`  Content: ${file.content ? `${file.content.length} characters` : 'NULL'}`);
        console.log(`  Storage Key: ${file.storageKey || 'NULL'}`);
      }
    });
    
    // Check if template has content
    console.log('\n📋 Checking template files:');
    const templates = await db('templates')
      .where('key', 'nextjs-fullstack')
      .select('name', 'files');
    
    if (templates.length > 0) {
      const template = templates[0];
      const templateFiles = JSON.parse(template.files || '[]');
      console.log(`\nTemplate "${template.name}" has ${templateFiles.length} files`);
      
      const sampleFiles = templateFiles.filter(f => f.type === 'file').slice(0, 3);
      sampleFiles.forEach(file => {
        console.log(`- ${file.path}: ${file.content ? `${file.content.length} chars` : 'NO CONTENT'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

checkProjectFiles();