import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('project_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('key').unique().notNullable(); // react, nodejs, python, etc.
    table.text('description').nullable();
    table.string('category').notNullable(); // frontend, backend, fullstack, mobile, etc.
    table.string('language').notNullable(); // javascript, typescript, python, etc.
    table.string('framework').nullable(); // react, express, fastapi, etc.
    table.json('dependencies').defaultTo('{}'); // package.json/requirements.txt equivalent
    table.json('scripts').defaultTo('{}'); // build, start, test scripts
    table.json('config').defaultTo('{}'); // template-specific configuration
    table.string('dockerImage').nullable(); // base Docker image for containers
    table.json('files').notNullable(); // template file structure
    table.string('icon').nullable(); // template icon/logo
    table.string('version').defaultTo('1.0.0');
    table.boolean('isActive').defaultTo(true);
    table.boolean('isOfficial').defaultTo(false);
    table.uuid('createdBy').nullable().references('id').inTable('users');
    table.timestamps(true, true);
    
    table.index(['category']);
    table.index(['language']);
    table.index(['framework']);
    table.index(['isActive']);
    table.index(['isOfficial']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('project_templates');
}