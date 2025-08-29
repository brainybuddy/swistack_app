import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add collaboration role to project_members table
  await knex.schema.alterTable('project_members', (table: Knex.TableBuilder) => {
    table.enum('collaboration_role', ['owner', 'admin', 'editor', 'viewer', 'commenter'])
      .defaultTo('editor')
      .after('role');
    table.boolean('can_edit').defaultTo(true).after('collaboration_role');
    table.boolean('can_comment').defaultTo(true).after('can_edit');
    table.boolean('can_view_activity').defaultTo(true).after('can_comment');
    table.boolean('can_manage_permissions').defaultTo(false).after('can_view_activity');
  });

  // Create collaboration_sessions table for tracking active sessions
  await knex.schema.createTable('collaboration_sessions', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('file_id').references('id').inTable('project_files').onDelete('CASCADE').nullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('last_activity').defaultTo(knex.fn.now()).notNullable();
    table.jsonb('cursor_position').nullable();
    table.jsonb('selection_range').nullable();
    table.string('session_id').notNullable();
    table.boolean('is_active').defaultTo(true);
    
    table.index(['project_id', 'user_id']);
    table.index(['file_id', 'is_active']);
    table.index(['session_id']);
  });

  // Create collaboration_activities table for activity feed
  await knex.schema.createTable('collaboration_activities', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('file_id').references('id').inTable('project_files').onDelete('CASCADE').nullable();
    table.enum('activity_type', [
      'file_edit', 'file_create', 'file_delete', 'file_rename',
      'user_join', 'user_leave', 'user_invite', 'permission_change',
      'comment_add', 'comment_edit', 'comment_delete'
    ]).notNullable();
    table.text('message').notNullable();
    table.jsonb('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    
    table.index(['project_id', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['file_id', 'created_at']);
  });

  // Create file_locks table for managing file editing locks
  await knex.schema.createTable('file_locks', (table: Knex.TableBuilder) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('file_id').references('id').inTable('project_files').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.enum('lock_type', ['exclusive', 'shared']).defaultTo('shared').notNullable();
    table.timestamp('locked_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('expires_at').nullable();
    table.string('session_id').notNullable();
    table.boolean('is_active').defaultTo(true);
    
    table.unique(['file_id', 'user_id', 'session_id']);
    table.index(['file_id', 'is_active']);
    table.index(['user_id', 'is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('file_locks');
  await knex.schema.dropTableIfExists('collaboration_activities');
  await knex.schema.dropTableIfExists('collaboration_sessions');
  
  await knex.schema.alterTable('project_members', (table: Knex.TableBuilder) => {
    table.dropColumn('can_manage_permissions');
    table.dropColumn('can_view_activity');
    table.dropColumn('can_comment');
    table.dropColumn('can_edit');
    table.dropColumn('collaboration_role');
  });
}