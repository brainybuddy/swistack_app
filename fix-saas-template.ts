async function fixSaasTemplate() {
  try {
    console.log('🔧 Fixing SaaS Landing Page template...');
    
    // Dynamic imports to avoid path issues
    const { db } = await import('./packages/backend/src/config/database.js');
    
    // Delete existing template
    await db('project_templates').where('key', 'saas-landing').del();
    console.log('✅ Deleted existing template');
    
    // Re-run the seed  
    const seedModule = await import('./packages/backend/src/database/seeds/007_saas_landing_template.js');
    await seedModule.seed(db);
    console.log('✅ Re-seeded template');
    
    // Verify the fix
    const template = await db('project_templates')
      .where('key', 'saas-landing')
      .first();
    
    if (template) {
      const parsed = JSON.parse(template.files);
      console.log('✅ Template verification:');
      console.log('   Name:', template.name);
      console.log('   Files count:', parsed.length);
      console.log('   Files:', parsed.map((f: any) => f.path).slice(0, 10));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixSaasTemplate();