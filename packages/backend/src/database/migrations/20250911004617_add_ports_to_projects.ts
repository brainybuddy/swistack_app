import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', (table) => {
    table.integer('frontend_port').nullable();
    table.integer('backend_port').nullable();
    table.index(['frontend_port'], 'idx_projects_frontend_port');
    table.index(['backend_port'], 'idx_projects_backend_port');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('frontend_port');
    table.dropColumn('backend_port');
  });
}

