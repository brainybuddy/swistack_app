const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function checkTemplates() {
  try {
    // First, let's make absolutely sure we're looking in the right place
    const dbInfo = await db.raw(`SELECT current_database(), current_schema()`);
    console.log('Database info:', dbInfo.rows[0]);
    
    // Check what tables exist
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\nTables:');
    tables.rows.forEach(r => console.log('  -', r.table_name));
    
    // Check project_templates specifically
    const count = await db('project_templates').count('* as count').first();
    console.log('\nproject_templates count:', count.count);
    
    // Try to get all templates
    const templates = await db('project_templates').select('key', 'name', 'isActive');
    console.log('\nTemplates found:', templates.length);
    templates.forEach(t => console.log('  -', t.key, ':', t.name, '(active:', t.isActive, ')'));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

// Wait a second for any pending operations
setTimeout(checkTemplates, 1000);