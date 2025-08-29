import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create project_updates table
  await knex.schema.createTable('project_updates', (table: Knex.TableBuilder) => {
    table.string('id', 255).primary();
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('type', [
      'file_created',
      'file_updated', 
      'file_deleted',
      'file_renamed',
      'member_added',
      'member_removed',
      'project_updated',
      'collaboration_joined',
      'collaboration_left'
    ]).notNullable();
    table.jsonb('data').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for performance
    table.index('project_id');
    table.index('user_id');
    table.index('type');
    table.index('created_at');
    table.index(['project_id', 'created_at']); // Compound index for recent updates query
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_updates');
}