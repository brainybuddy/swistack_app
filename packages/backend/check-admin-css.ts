import { db } from './src/config/database';

async function checkAdminCSS() {
  try {
    console.log('🎨 Checking Admin Dashboard CSS...');
    
    const template = await db('project_templates')
      .where('key', 'admin-dashboard')
      .first();
    
    if (template) {
      const files = typeof template.files === 'string' ? JSON.parse(template.files) : template.files;
      
      // Find CSS files
      const cssFiles = files.filter((f: any) => 
        f.path.endsWith('.css') || f.path.includes('globals.css') || f.path.includes('tailwind')
      );
      
      console.log('📄 CSS Files found:');
      cssFiles.forEach((file: any) => {
        console.log(`\n=== ${file.path} ===`);
        console.log(file.content || 'No content');
      });
      
      // Also check Tailwind config
      const tailwindConfig = files.find((f: any) => f.path === 'tailwind.config.js');
      if (tailwindConfig) {
        console.log('\n=== tailwind.config.js ===');
        console.log(tailwindConfig.content || 'No content');
      }
      
    } else {
      console.log('❌ Admin Dashboard template not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkAdminCSS();