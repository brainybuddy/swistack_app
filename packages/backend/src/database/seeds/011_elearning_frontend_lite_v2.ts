import type { Knex } from 'knex';

// Duplicate the Lite template into a fresh key so preview reloads cleanly
export async function seed(knex: Knex): Promise<void> {
  const sourceKey = 'elearning-frontend-lite';
  const newKey = 'elearning-frontend-lite-v2';

  // Remove any previous v2
  await knex('project_templates').where('key', newKey).del();

  const existing = await knex('project_templates')
    .where('key', sourceKey)
    .first();

  if (!existing) {
    // If the base template is missing, do nothing (keeps seed idempotent)
    console.log(`⚠️ Source template not found: ${sourceKey}`);
    return;
  }

  const now = new Date();

  await knex('project_templates').insert({
    name: 'E-Learning Platform',
    key: newKey,
    description: existing.description,
    category: existing.category,
    language: existing.language,
    framework: existing.framework,
    // Keep JSON columns as-is (stringified in DB already)
    dependencies: typeof existing.dependencies === 'string' ? existing.dependencies : JSON.stringify(existing.dependencies),
    scripts: typeof existing.scripts === 'string' ? existing.scripts : JSON.stringify(existing.scripts),
    config: typeof existing.config === 'string' ? existing.config : JSON.stringify(existing.config),
    dockerImage: existing.dockerImage,
    files: typeof existing.files === 'string' ? existing.files : JSON.stringify(existing.files),
    icon: existing.icon,
    version: '1.0.1',
    isActive: true,
    isOfficial: true,
    createdBy: existing.createdBy || null,
    createdAt: now,
    updatedAt: now,
  });

  console.log('✅ Seeded template:', newKey);
}
