import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create conversations table
  await knex.schema.createTable('conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('project_id').nullable().references('id').inTable('projects').onDelete('CASCADE');
    table.string('agent_id').nullable(); // Mistral agent ID
    table.string('title').nullable(); // Optional conversation title
    table.jsonb('metadata').nullable(); // Additional metadata
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['user_id']);
    table.index(['project_id']);
    table.index(['created_at']);
  });

  // Create messages table  
  await knex.schema.createTable('conversation_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.string('role').notNullable().checkIn(['user', 'assistant', 'system']);
    table.text('content').notNullable();
    table.jsonb('tool_calls').nullable(); // For assistant messages with tool calls
    table.jsonb('metadata').nullable(); // Additional metadata like timestamps, etc
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['conversation_id']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('conversation_messages');
  await knex.schema.dropTableIfExists('conversations');
}