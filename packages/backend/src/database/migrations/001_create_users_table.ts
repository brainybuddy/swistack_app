import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Try to enable uuid-ossp extension, fallback to gen_random_uuid() if not available
  try {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ uuid-ossp extension enabled');
  } catch (error) {
    console.warn('⚠️ uuid-ossp extension not available, using gen_random_uuid() instead:', error);
  }
  
  return knex.schema.createTable('users', (table) => {
    // Use gen_random_uuid() as fallback if uuid-ossp is not available
    table.uuid('id').primary().defaultTo(knex.raw('COALESCE(uuid_generate_v4(), gen_random_uuid())'));
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