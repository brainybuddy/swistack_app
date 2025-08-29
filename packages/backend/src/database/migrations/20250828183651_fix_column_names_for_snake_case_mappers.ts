import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Convert all snake_case columns to camelCase for consistency with JavaScript code
  // This makes the database match exactly what we use in code - simpler approach
  
  // Only fix refresh_tokens table - convert snake_case to camelCase
  const tableExists = await knex.schema.hasTable('refresh_tokens');
  
  if (tableExists) {
    // Check and rename created_at to createdAt
    const hasCreatedAt = await knex.schema.hasColumn('refresh_tokens', 'created_at');
    const hasCreatedAtCamel = await knex.schema.hasColumn('refresh_tokens', 'createdAt');
    
    if (hasCreatedAt && !hasCreatedAtCamel) {
      await knex.schema.alterTable('refresh_tokens', (table) => {
        table.renameColumn('created_at', 'createdAt');
      });
    }
    
    // Check and rename updated_at to updatedAt
    const hasUpdatedAt = await knex.schema.hasColumn('refresh_tokens', 'updated_at');
    const hasUpdatedAtCamel = await knex.schema.hasColumn('refresh_tokens', 'updatedAt');
    
    if (hasUpdatedAt && !hasUpdatedAtCamel) {
      await knex.schema.alterTable('refresh_tokens', (table) => {
        table.renameColumn('updated_at', 'updatedAt');
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Revert camelCase back to snake_case for refresh_tokens table
  const tableExists = await knex.schema.hasTable('refresh_tokens');
  
  if (tableExists) {
    // Check and revert createdAt to created_at
    const hasCreatedAtCamel = await knex.schema.hasColumn('refresh_tokens', 'createdAt');
    const hasCreatedAt = await knex.schema.hasColumn('refresh_tokens', 'created_at');
    
    if (hasCreatedAtCamel && !hasCreatedAt) {
      await knex.schema.alterTable('refresh_tokens', (table) => {
        table.renameColumn('createdAt', 'created_at');
      });
    }
    
    // Check and revert updatedAt to updated_at  
    const hasUpdatedAtCamel = await knex.schema.hasColumn('refresh_tokens', 'updatedAt');
    const hasUpdatedAt = await knex.schema.hasColumn('refresh_tokens', 'updated_at');
    
    if (hasUpdatedAtCamel && !hasUpdatedAt) {
      await knex.schema.alterTable('refresh_tokens', (table) => {
        table.renameColumn('updatedAt', 'updated_at');
      });
    }
  }
}

