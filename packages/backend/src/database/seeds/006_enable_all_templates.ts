import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Enable all templates so they appear in /workspace templates view
  await knex('project_templates')
    .update({ isActive: true });
    
  console.log('✅ All templates have been activated and will appear in workspace');
}