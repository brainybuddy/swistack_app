import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description').nullable();
    table.uuid('ownerId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('template').notNullable(); // react, nodejs, python, etc.
    table.string('status').defaultTo('active'); // active, archived, deleted
    table.json('settings').defaultTo('{}'); // project-specific settings
    table.string('repositoryUrl').nullable(); // Git repository URL
    table.string('branch').defaultTo('main'); // Git branch
    table.json('environment').defaultTo('{}'); // environment variables
    table.boolean('isPublic').defaultTo(false);
    table.string('slug').unique().notNullable(); // URL-friendly identifier
    table.bigInteger('storageUsed').defaultTo(0); // bytes
    table.bigInteger('storageLimit').defaultTo(1073741824); // 1GB default
    table.timestamp('lastAccessedAt').nullable();
    table.timestamps(true, true);
    
    table.index(['ownerId']);
    table.index(['template']);
    table.index(['status']);
    table.index(['isPublic']);
    table.index(['slug']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('projects');
}