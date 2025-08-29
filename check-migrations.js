const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function checkMigrations() {
  try {
    const migrations = await db('knex_migrations').select('*').orderBy('id');
    
    console.log('\n📋 Applied migrations:');
    migrations.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name}`);
    });
    
    // Now check which tables exist
    const result = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE 'knex_%'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Existing tables:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check for missing tables
    const expectedTables = ['users', 'refresh_tokens', 'projects', 'project_members', 'project_files', 'templates', 'project_invitations', 'project_updates'];
    const existingTables = result.rows.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:', missingTables.join(', '));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

checkMigrations();