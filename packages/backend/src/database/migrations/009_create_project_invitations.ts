import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create project_invitations table
  await knex.schema.createTable('project_invitations', (table: Knex.TableBuilder) => {
    table.uuid('id').primary();
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('inviter_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('invitee_email', 255).notNullable();
    table.enum('role', ['admin', 'editor', 'viewer']).notNullable();
    table.enum('collaboration_role', ['admin', 'editor', 'viewer', 'commenter']).defaultTo('editor');
    table.string('token', 255).unique().notNullable();
    table.enum('status', ['pending', 'accepted', 'declined', 'expired']).defaultTo('pending');
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('accepted_at').nullable();

    // Indexes
    table.index('project_id');
    table.index('invitee_email');
    table.index('token');
    table.index('status');
    table.index('expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_invitations');
}