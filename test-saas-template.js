// Simple test script to verify SaaS template functionality
const { TemplateService } = require('./packages/backend/src/services/TemplateService');

async function testSaaSTemplate() {
  try {
    console.log('🔍 Testing SaaS template...');
    
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
      console.log(`   Files count: ${saasTemplate.files ? JSON.parse(saasTemplate.files).length : 0}`);
    } else {
      console.log('❌ SaaS Landing Page template NOT found');
      console.log('Available templates:');
      allTemplates.forEach(t => console.log(`   - ${t.name} (${t.key})`));
    }
    
    // Test 3: Get specific template
    console.log('\n2. Testing getByKey...');
    const specificTemplate = await TemplateService.getByKey('saas-landing');
    if (specificTemplate) {
      console.log('✅ Template retrieved by key successfully');
      const files = Array.isArray(specificTemplate.files) ? specificTemplate.files : JSON.parse(specificTemplate.files || '[]');
      console.log(`   Files in template: ${files.length}`);
      console.log('   File paths:');
      files.forEach(f => console.log(`     - ${f.path} (${f.type})`));
      
      // Test 4: Check main page content
      const mainPage = files.find(f => f.path === 'src/app/page.tsx');
      if (mainPage) {
        console.log('✅ Main page (src/app/page.tsx) found');
        const hasCloudSync = mainPage.content.includes('CloudSync Pro');
        const hasTailwind = mainPage.content.includes('className');
        const hasHero = mainPage.content.includes('Streamline Your');
        console.log(`     - Contains CloudSync Pro branding: ${hasCloudSync ? '✅' : '❌'}`);
        console.log(`     - Contains Tailwind CSS: ${hasTailwind ? '✅' : '❌'}`);
        console.log(`     - Contains hero section: ${hasHero ? '✅' : '❌'}`);
      } else {
        console.log('❌ Main page not found in template files');
      }
      
      // Test 5: Check dashboard page
      const dashboardPage = files.find(f => f.path === 'src/app/dashboard/page.tsx');
      if (dashboardPage) {
        console.log('✅ Dashboard page found');
        const hasStats = dashboardPage.content.includes('Active Projects');
        const hasNav = dashboardPage.content.includes('nav');
        console.log(`     - Contains stats cards: ${hasStats ? '✅' : '❌'}`);
        console.log(`     - Contains navigation: ${hasNav ? '✅' : '❌'}`);
      } else {
        console.log('❌ Dashboard page not found');
      }
      
      // Test 6: Check auth pages
      const loginPage = files.find(f => f.path === 'src/app/login/page.tsx');
      const signupPage = files.find(f => f.path === 'src/app/signup/page.tsx');
      console.log(`     - Login page: ${loginPage ? '✅' : '❌'}`);
      console.log(`     - Signup page: ${signupPage ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ Template NOT found by key');
    }
    
    console.log('\n🎉 Template testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing template:', error.message);
  }
  
  process.exit(0);
}

testSaaSTemplate();