const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function checkTemplateContent() {
  try {
    const template = await db('templates')
      .where('key', 'nextjs-fullstack')
      .first();
    
    if (template) {
      console.log('✅ Template found:', template.name);
      const files = JSON.parse(template.files || '[]');
      console.log('📁 Total files:', files.length);
      
      // Check a few files for content
      const sampleFiles = files.filter(f => f.type === 'file').slice(0, 5);
      console.log('\n📝 Sample files:');
      sampleFiles.forEach(file => {
        console.log(`\n- ${file.path}`);
        console.log(`  Has content: ${!!file.content}`);
        console.log(`  Content length: ${file.content?.length || 0}`);
        if (file.content) {
          console.log(`  First 80 chars: ${file.content.substring(0, 80).replace(/\n/g, '\\n')}`);
        }
      });
    } else {
      console.log('❌ Template not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

checkTemplateContent();