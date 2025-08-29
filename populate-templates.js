// Manually populate templates until the persistence issue is resolved
const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');
const db = knex(knexConfig.development);

async function populateTemplates() {
  try {
    // Clear existing
    await db('project_templates').del();
    console.log('Cleared existing templates');
    
    // Insert essential templates
    const templates = [
      {
        key: 'nextjs-fullstack',
        name: 'Next.js Full Stack',
        description: 'Full-stack Next.js application with API routes',
        category: 'fullstack',
        language: 'typescript',
        framework: 'nextjs',
        version: '1.0.0',
        files: JSON.stringify([
          {
            path: 'package.json',
            type: 'file',
            content: JSON.stringify({
              name: 'nextjs-app',
              version: '1.0.0',
              scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start'
              },
              dependencies: {
                next: '^14.0.0',
                react: '^18.2.0',
                'react-dom': '^18.2.0'
              }
            }, null, 2)
          },
          {
            path: 'pages/index.tsx',
            type: 'file',
            content: `export default function Home() {
  return (
    <div>
      <h1>Welcome to Next.js!</h1>
    </div>
  );
}`
          }
        ]),
        dependencies: '{}',
        scripts: '{}',
        config: '{}',
        isOfficial: true,
        isActive: true,
        downloads: 0
      },
      {
        key: 'react',
        name: 'React App',
        description: 'Modern React application with TypeScript',
        category: 'frontend',
        language: 'typescript',
        framework: 'react',
        version: '1.0.0',
        files: JSON.stringify([
          {
            path: 'src/App.tsx',
            type: 'file',
            content: `function App() {
  return <div>Hello React!</div>;
}
export default App;`
          }
        ]),
        dependencies: '{}',
        scripts: '{}',
        config: '{}',
        isOfficial: true,
        isActive: true,
        downloads: 0
      }
    ];
    
    for (const template of templates) {
      await db('project_templates').insert(template);
      console.log(`✅ Inserted template: ${template.key}`);
    }
    
    // Verify
    const count = await db('project_templates').count('* as count').first();
    console.log(`\n📊 Total templates in database: ${count.count}`);
    
    const all = await db('project_templates').select('key', 'name');
    console.log('Templates:');
    all.forEach(t => console.log(`  - ${t.key}: ${t.name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

populateTemplates();