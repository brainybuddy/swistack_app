import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('project_files', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('projectId').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.string('path').notNullable(); // relative path from project root
    table.string('name').notNullable(); // filename
    table.string('type').notNullable(); // file, directory
    table.string('mimeType').nullable();
    table.bigInteger('size').defaultTo(0); // bytes
    table.string('storageKey').nullable(); // MinIO object key
    table.text('content').nullable(); // for small text files stored directly
    table.string('encoding').defaultTo('utf8');
    table.boolean('isBinary').defaultTo(false);
    table.uuid('parentId').nullable().references('id').inTable('project_files');
    table.uuid('createdBy').notNullable().references('id').inTable('users');
    table.uuid('updatedBy').nullable().references('id').inTable('users');
    table.timestamps(true, true);
    
    table.unique(['projectId', 'path']);
    table.index(['projectId']);
    table.index(['type']);
    table.index(['parentId']);
    table.index(['createdBy']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('project_files');
}