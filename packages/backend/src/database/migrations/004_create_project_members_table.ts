import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('project_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('projectId').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('role').notNullable(); // owner, editor, viewer
    table.timestamp('invitedAt').defaultTo(knex.fn.now());
    table.timestamp('joinedAt').nullable();
    table.uuid('invitedBy').nullable().references('id').inTable('users');
    table.string('status').defaultTo('pending'); // pending, accepted, declined
    table.timestamps(true, true);
    
    table.unique(['projectId', 'userId']);
    table.index(['projectId']);
    table.index(['userId']);
    table.index(['role']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('project_members');
}