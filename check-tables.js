const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function checkTables() {
  try {
    const result = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Database tables:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check if project_files table exists
    const projectFilesExists = result.rows.some(row => 
      row.table_name === 'project_files' || 
      row.table_name === 'projectFiles'
    );
    
    if (!projectFilesExists) {
      console.log('\n❌ project_files table does not exist!');
      console.log('Running migrations might fix this...');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

checkTables();