const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function fixColumnNames() {
  try {
    console.log('🔧 Fixing column names to camelCase...\n');
    
    const tables = ['users', 'refresh_tokens', 'projects', 'project_members', 'project_files', 'templates'];
    
    for (const table of tables) {
      const tableExists = await db.schema.hasTable(table);
      if (!tableExists) {
        console.log(`⚠️ Table ${table} does not exist, skipping...`);
        continue;
      }
      
      console.log(`📋 Checking ${table} table...`);
      
      // Check if columns exist before renaming
      const hasCreatedAt = await db.schema.hasColumn(table, 'created_at');
      const hasUpdatedAt = await db.schema.hasColumn(table, 'updated_at');
      const hasCreatedAtCamel = await db.schema.hasColumn(table, 'createdAt');
      const hasUpdatedAtCamel = await db.schema.hasColumn(table, 'updatedAt');
      
      if (hasCreatedAt && !hasCreatedAtCamel) {
        await db.schema.alterTable(table, (t) => {
          t.renameColumn('created_at', 'createdAt');
        });
        console.log(`  ✅ Renamed created_at to createdAt`);
      }
      
      if (hasUpdatedAt && !hasUpdatedAtCamel) {
        await db.schema.alterTable(table, (t) => {
          t.renameColumn('updated_at', 'updatedAt');
        });
        console.log(`  ✅ Renamed updated_at to updatedAt`);
      }
      
      // Check for other snake_case columns
      const result = await db.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ?
        AND column_name LIKE '%\\_%'
        ORDER BY ordinal_position
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`  ⚠️ Found other snake_case columns:`, result.rows.map(r => r.column_name).join(', '));
      }
    }
    
    console.log('\n✅ Column name fixes complete!');
    
    // Verify the changes
    console.log('\n📋 Verifying project_files columns:');
    const cols = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_files'
      ORDER BY ordinal_position
    `);
    cols.rows.forEach(r => console.log(`  - ${r.column_name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.destroy();
  }
}

fixColumnNames();