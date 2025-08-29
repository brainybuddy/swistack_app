import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Rename snake_case columns to camelCase for consistency
  
  // Check which tables exist and have the columns we need to rename
  const tables = [
    'users',
    'projects', 
    'project_files',
    'project_members',
    'project_templates',
    'template_files',
    'refresh_tokens'
  ];
  
  for (const tableName of tables) {
    const tableExists = await knex.schema.hasTable(tableName);
    
    if (tableExists) {
      // Check if columns exist before renaming
      const hasCreatedAt = await knex.schema.hasColumn(tableName, 'created_at');
      const hasUpdatedAt = await knex.schema.hasColumn(tableName, 'updated_at');
      
      if (hasCreatedAt || hasUpdatedAt) {
        await knex.schema.alterTable(tableName, (table) => {
          if (hasCreatedAt) {
            table.renameColumn('created_at', 'createdAt');
          }
          if (hasUpdatedAt) {
            table.renameColumn('updated_at', 'updatedAt');
          }
        });
      }
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Revert back to snake_case
  
  const tables = [
    'users',
    'projects', 
    'project_files',
    'project_members',
    'project_templates',
    'template_files',
    'refresh_tokens'
  ];
  
  for (const tableName of tables) {
    const tableExists = await knex.schema.hasTable(tableName);
    
    if (tableExists) {
      // Check if columns exist before renaming
      const hasCreatedAt = await knex.schema.hasColumn(tableName, 'createdAt');
      const hasUpdatedAt = await knex.schema.hasColumn(tableName, 'updatedAt');
      
      if (hasCreatedAt || hasUpdatedAt) {
        await knex.schema.alterTable(tableName, (table) => {
          if (hasCreatedAt) {
            table.renameColumn('createdAt', 'created_at');
          }
          if (hasUpdatedAt) {
            table.renameColumn('updatedAt', 'updated_at');
          }
        });
      }
    }
  }
}