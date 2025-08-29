const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function testInsert() {
  try {
    console.log('Testing database insert...');
    
    // First clear
    await db('project_templates').del();
    console.log('Cleared templates');
    
    // Insert a test template
    await db('project_templates').insert({
      key: 'test-template',
      name: 'Test Template',
      description: 'Testing',
      category: 'test',
      language: 'javascript',
      framework: 'test',
      version: '1.0.0',
      files: '[]',
      dependencies: '{}',
      scripts: '{}',
      config: '{}',
      isOfficial: true,
      isActive: true,
      downloads: 0
    });
    
    console.log('Inserted test template');
    
    // Check if it exists
    const count = await db('project_templates').count('* as count').first();
    console.log('Count after insert:', count.count);
    
    const template = await db('project_templates').where('key', 'test-template').first();
    console.log('Found template:', !!template);
    if (template) {
      console.log('Template name:', template.name);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

testInsert();