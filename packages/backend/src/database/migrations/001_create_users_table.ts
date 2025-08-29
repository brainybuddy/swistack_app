import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable uuid-ossp extension if not already enabled
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable();
    table.string('username').unique().notNullable();
    table.string('firstName').notNullable();
    table.string('lastName').notNullable();
    table.string('passwordHash').notNullable();
    table.string('avatar').nullable();
    table.boolean('isActive').defaultTo(true);
    table.timestamp('lastLoginAt').nullable();
    table.timestamp('emailVerifiedAt').nullable();
    table.string('emailVerificationToken').nullable();
    table.string('passwordResetToken').nullable();
    table.timestamp('passwordResetExpiresAt').nullable();
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['username']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}