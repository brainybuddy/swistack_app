import { TemplateService } from './src/services/TemplateService';

async function testSaaSTemplate() {
  try {
    console.log('🔍 Testing SaaS template directly...');
    
    // Test 1: Get all templates
    console.log('\n1. Fetching all templates...');
    const allTemplates = await TemplateService.getAll();
    console.log(`Found ${allTemplates.length} templates total`);
    
    // Test 2: Find SaaS template
    const saasTemplate = allTemplates.find(t => t.key === 'saas-landing');
    if (saasTemplate) {
      console.log('✅ SaaS Landing Page template found!');
      console.log(`   Name: ${saasTemplate.name}`);
      console.log(`   Category: ${saasTemplate.category}`);
      console.log(`   Framework: ${saasTemplate.framework}`);
      
      const files = Array.isArray(saasTemplate.files) 
        ? saasTemplate.files 
        : JSON.parse(saasTemplate.files || '[]');
      console.log(`   Files count: ${files.length}`);
      
      // Check key files
      const mainPage = files.find((f: any) => f.path === 'src/app/page.tsx');
      const loginPage = files.find((f: any) => f.path === 'src/app/login/page.tsx');
      const signupPage = files.find((f: any) => f.path === 'src/app/signup/page.tsx');
      const dashboardPage = files.find((f: any) => f.path === 'src/app/dashboard/page.tsx');
      
      console.log(`   - Main page (page.tsx): ${mainPage ? '✅' : '❌'}`);
      console.log(`   - Login page: ${loginPage ? '✅' : '❌'}`);
      console.log(`   - Signup page: ${signupPage ? '✅' : '❌'}`);
      console.log(`   - Dashboard page: ${dashboardPage ? '✅' : '❌'}`);
      
      if (mainPage) {
        const hasCloudSync = mainPage.content.includes('CloudSync Pro');
        const hasTailwind = mainPage.content.includes('className');
        console.log(`   - CloudSync Pro branding: ${hasCloudSync ? '✅' : '❌'}`);
        console.log(`   - Tailwind CSS: ${hasTailwind ? '✅' : '❌'}`);
      }
    } else {
      console.log('❌ SaaS Landing Page template NOT found');
      console.log('Available templates:');
      allTemplates.forEach(t => console.log(`   - ${t.name} (${t.key})`));
    }
    
    console.log('\n🎉 Direct template testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing template:', error);
  }
}

testSaaSTemplate().then(() => process.exit(0));