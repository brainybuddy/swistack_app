import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    // OAuth provider fields
    table.string('googleId').nullable();
    table.string('githubId').nullable();
    table.string('githubUsername').nullable();
    
    // Make password optional for OAuth users
    table.string('passwordHash').nullable().alter();
    
    // Add indexes for OAuth fields
    table.index('googleId');
    table.index('githubId');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('googleId');
    table.dropColumn('githubId'); 
    table.dropColumn('githubUsername');
    
    // Restore password requirement (this might fail for OAuth users)
    table.string('passwordHash').notNullable().alter();
  });
}

