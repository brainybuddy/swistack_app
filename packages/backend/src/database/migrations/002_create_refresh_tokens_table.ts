import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('token').notNullable();
    table.timestamp('expiresAt').notNullable();
    table.boolean('revoked').defaultTo(false);
    table.timestamps(true, true);
    
    table.index(['userId']);
    table.index(['token']);
    table.index(['expiresAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('refresh_tokens');
}