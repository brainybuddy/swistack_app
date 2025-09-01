import { db } from './src/config/database';

async function fixSaasSeed() {
  try {
    console.log('🔧 Fixing SaaS seed data...');
    
    // Delete existing template
    await db('project_templates').where('key', 'saas-landing').del();
    console.log('✅ Deleted existing template');
    
    // Import and run the seed manually
    const { seed } = await import('./src/database/seeds/007_saas_landing_template');
    await seed(db);
    console.log('✅ Re-seeded template');
    
    // Check the result
    const template = await db('project_templates')
      .where('key', 'saas-landing')
      .first();
      
    if (template) {
      const files = typeof template.files === 'string' ? JSON.parse(template.files) : template.files;
      console.log('✅ Verification:');
      console.log('   Files count:', files.length);
      console.log('   Files:', files.map((f: any) => f.path));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixSaasSeed();