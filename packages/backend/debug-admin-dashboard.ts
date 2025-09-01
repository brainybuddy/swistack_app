import { db } from './src/config/database';

async function debugAdminDashboard() {
  try {
    console.log('🔍 Debugging Admin Dashboard template...');
    
    const template = await db('project_templates')
      .where('key', 'admin-dashboard')
      .first();
    
    if (template) {
      console.log('✅ Template found in database');
      console.log('   Name:', template.name);
      console.log('   Files type:', typeof template.files);
      
      const files = typeof template.files === 'string' ? JSON.parse(template.files) : template.files;
      console.log('   Files count:', files.length);
      console.log('   Files paths:');
      files.forEach((f: any, i: number) => {
        console.log(`     ${i + 1}. ${f.path} (${f.type})${f.content ? ' - has content (' + f.content.length + ' chars)' : ' - no content'}`);
      });
      
      // Check app/page.tsx specifically
      const appPage = files.find((f: any) => f.path === 'app/page.tsx');
      if (appPage) {
        console.log('\n📄 app/page.tsx content:');
        console.log(appPage.content);
      }
      
      // Check app/dashboard/page.tsx
      const dashboardPage = files.find((f: any) => f.path === 'app/dashboard/page.tsx');
      if (dashboardPage) {
        console.log('\n📊 app/dashboard/page.tsx content preview:');
        console.log(dashboardPage.content.substring(0, 300) + '...');
      } else {
        console.log('\n❌ No app/dashboard/page.tsx found');
      }
      
    } else {
      console.log('❌ Admin Dashboard template not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

debugAdminDashboard();