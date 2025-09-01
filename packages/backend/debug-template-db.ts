import { db } from './src/config/database';

async function debugTemplate() {
  try {
    console.log('🔍 Debugging template database...');
    
    const template = await db('project_templates')
      .where('key', 'saas-landing')
      .first();
    
    if (template) {
      console.log('✅ Template found in database');
      console.log('   Name:', template.name);
      console.log('   Files type:', typeof template.files);
      
      if (typeof template.files === 'string') {
        console.log('   Files length (string):', template.files.length);
        console.log('   Files preview:', template.files.substring(0, 200) + '...');
        
        try {
          const parsed = JSON.parse(template.files);
          console.log('✅ Files JSON parses successfully');
          console.log('   Parsed files count:', parsed.length);
          console.log('   Files paths:', parsed.map((f: any) => f.path).slice(0, 10));
        } catch (e) {
          console.log('❌ Files JSON parse error:', (e as Error).message);
        }
      } else {
        console.log('   Files length (object):', template.files ? template.files.length : 'null');
        console.log('   Files preview:', template.files ? JSON.stringify(template.files).substring(0, 200) + '...' : 'null');
        
        if (template.files && template.files.length) {
          console.log('   Files paths:', template.files.map((f: any) => f.path).slice(0, 10));
          
          // Fix the template by converting to JSON string
          console.log('🔧 Fixing template - converting object to JSON string...');
          await db('project_templates')
            .where('key', 'saas-landing')
            .update({ files: JSON.stringify(template.files) });
          console.log('✅ Template fixed!');
        }
      }
    } else {
      console.log('❌ Template not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

debugTemplate();