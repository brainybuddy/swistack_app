const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');
const fs = require('fs');
const path = require('path');

const db = knex(knexConfig.development);

async function fixMigrations() {
  try {
    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'packages/backend/src/database/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.ts'))
      .sort();
    
    console.log('\n📋 Migration files found:', files.length);
    
    // Check which are in the database
    const recorded = await db('knex_migrations').select('name').orderBy('id');
    const recordedNames = recorded.map(r => r.name);
    
    console.log('📋 Recorded migrations:', recordedNames.length);
    
    // Find unrecorded migrations
    const unrecorded = files.filter(f => !recordedNames.includes(f));
    console.log('\n❌ Unrecorded migrations:', unrecorded.length);
    unrecorded.forEach(f => console.log(`  - ${f}`));
    
    // Run the missing migrations manually
    for (const file of unrecorded) {
      if (file.startsWith('003_') || file.startsWith('004_') || file.startsWith('005_') || file.startsWith('006_')) {
        console.log(`\n🚀 Running migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const migration = require(migrationPath);
        
        try {
          await migration.up(db);
          
          // Record it as complete
          await db('knex_migrations').insert({
            name: file,
            batch: 3,
            migration_time: new Date()
          });
          
          console.log(`✅ Migration ${file} completed`);
        } catch (err) {
          console.error(`❌ Migration ${file} failed:`, err.message);
          break;
        }
      }
    }
    
    // Check tables again
    const result = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE 'knex_%'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables after fix:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

fixMigrations();