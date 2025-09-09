import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('project_templates')
    .where('key', 'elearning-frontend-lite-v2')
    .update({ name: 'E-Learning Platform' });
  console.log('✅ Renamed template elearning-frontend-lite-v2 to E-Learning Platform');
}

