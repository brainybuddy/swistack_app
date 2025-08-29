const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function insertTemplates() {
  try {
    console.log('Manually inserting templates...');
    
    // Clear existing
    await db('project_templates').del();
    
    // Insert just one template to test
    const result = await db('project_templates').insert({
      key: 'nextjs-fullstack',
      name: 'Next.js Full Stack',
      description: 'Full-stack Next.js application',
      category: 'fullstack',
      language: 'typescript',
      framework: 'nextjs',
      version: '1.0.0',
      files: JSON.stringify([
        {
          path: 'package.json',
          type: 'file',
          content: '{"name":"nextjs-app","version":"1.0.0"}'
        }
      ]),
      dependencies: '{}',
      scripts: '{}',
      config: '{}',
      isOfficial: true,
      isActive: true,
      downloads: 0
    }).returning('*');
    
    console.log('Insert result:', result[0]?.key || 'no result');
    
    // Immediately check if it's there
    const check = await db('project_templates').where('key', 'nextjs-fullstack').first();
    console.log('Template found after insert:', !!check);
    
    // Check count
    const count = await db('project_templates').count('* as count').first();
    console.log('Total templates:', count.count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

insertTemplates();