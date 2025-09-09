import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const targetKey = 'elearning-platform';

  // Try to reuse files from the lite template if available
  const base = await knex('project_templates')
    .whereIn('key', ['elearning-frontend-lite', 'elearning-frontend-lite-v2'])
    .first();

  // Always remove any existing record for idempotency
  await knex('project_templates').where('key', targetKey).del();

  const now = new Date();

  // If we have an existing template, clone its JSON fields
  if (base) {
    await knex('project_templates').insert({
      name: 'E-Learning Platform',
      key: targetKey,
      description: base.description || 'Frontend e-learning platform UI (Next.js + Tailwind)',
      category: base.category || 'frontend',
      language: base.language || 'typescript',
      framework: base.framework || 'nextjs',
      dependencies: typeof base.dependencies === 'string' ? base.dependencies : JSON.stringify(base.dependencies || {}),
      scripts: typeof base.scripts === 'string' ? base.scripts : JSON.stringify(base.scripts || {}),
      config: typeof base.config === 'string' ? base.config : JSON.stringify(base.config || {}),
      dockerImage: base.dockerImage || 'node:18-alpine',
      files: typeof base.files === 'string' ? base.files : JSON.stringify(base.files || []),
      icon: base.icon || '📚',
      version: '1.0.2',
      isActive: true,
      isOfficial: true,
      createdBy: base.createdBy || null,
      createdAt: now,
      updatedAt: now,
    });
    console.log('✅ Upserted E-Learning Platform from existing lite template');
    return;
  }

  // Fallback: minimal inline template with footer to guarantee visibility
  const files = [
    {
      path: 'package.json',
      type: 'file',
      content: JSON.stringify({
        name: 'elearning-platform',
        private: true,
        version: '1.0.0',
        scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
        dependencies: {
          next: '^14.0.4',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          typescript: '^5.3.2',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.0',
          postcss: '^8.4.0',
        },
      }, null, 2),
    },
    { path: 'postcss.config.js', type: 'file', content: `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };\n` },
    { path: 'tailwind.config.js', type: 'file', content: `module.exports = { content: ['src/**/*.{ts,tsx}'], theme: {extend:{}}, plugins: [] };\n` },
    { path: 'next.config.js', type: 'file', content: `module.exports = { experimental: { appDir: true } };\n` },
    { path: 'src', type: 'directory' },
    { path: 'src/app', type: 'directory' },
    { path: 'src/app/globals.css', type: 'file', content: `@tailwind base;@tailwind components;@tailwind utilities;\nhtml,body{height:100%}` },
    {
      path: 'src/app/layout.tsx',
      type: 'file',
      content: `import './globals.css';\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (<html lang='en'><body className='min-h-screen bg-gray-50'>{children}</body></html>);\n}\n`,
    },
    {
      path: 'src/app/page.tsx',
      type: 'file',
      content: `export default function Home(){return (<div className='min-h-screen'>\n  <header className='bg-white border-b'><div className='max-w-7xl mx-auto h-16 px-4 flex items-center justify-between'><b className='text-blue-700'>EduPlatform</b><nav className='hidden md:flex items-center gap-6 text-sm'><a href='#popular' className='hover:text-white'>Courses</a><a href='#' className='hover:text-white'>Dashboard</a><a href='#' className='bg-blue-600 text-white px-3 py-1.5 rounded'>Login</a></nav></div></header>\n  <section className='bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center py-16'><h1 className='text-4xl font-extrabold mb-3'>Learn Without Limits</h1><p className='opacity-95 mb-6'>Expert-led courses, hands-on projects, beautiful UI.</p><a href='#popular' className='inline-block bg-white text-blue-700 font-semibold px-6 py-3 rounded shadow hover:bg-blue-50'>Explore Courses</a></section>\n  <section className='bg-white'><div className='max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center'><div><div className='text-4xl font-extrabold text-blue-600'>50,000</div><div className='text-gray-600'>Active Students</div></div><div><div className='text-4xl font-extrabold text-blue-600'>1,200</div><div className='text-gray-600'>Instructors</div></div><div><div className='text-4xl font-extrabold text-blue-600'>2,800</div><div className='text-gray-600'>Courses</div></div><div><div className='text-4xl font-extrabold text-blue-600'>98%</div><div className='text-gray-600'>Success</div></div></div></section>\n  <section className='bg-gray-50' id='popular'><div className='max-w-7xl mx-auto px-4 py-12'><h2 className='text-2xl font-bold mb-6'>Popular Courses</h2><div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'><div className='bg-white border rounded-lg p-5'><div className='h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4'/><h3 className='font-semibold'>Web Development Bootcamp</h3><p className='text-sm text-gray-300 mb-3'>By Sarah Johnson</p><div className='flex items-center justify-between'><span className='font-bold text-blue-600'>$89</span><button className='text-sm bg-blue-600 text-white px-3 py-1.5 rounded'>Enroll</button></div></div><div className='bg-white border rounded-lg p-5'><div className='h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4'/><h3 className='font-semibold'>Data Science with Python</h3><p className='text-sm text-gray-300 mb-3'>By Michael Chen</p><div className='flex items-center justify-between'><span className='font-bold text-blue-600'>$99</span><button className='text-sm bg-blue-600 text-white px-3 py-1.5 rounded'>Enroll</button></div></div><div className='bg-white border rounded-lg p-5'><div className='h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4'/><h3 className='font-semibold'>UI/UX Design Fundamentals</h3><p className='text-sm text-gray-300 mb-3'>By Emily Carter</p><div className='flex items-center justify-between'><span className='font-bold text-blue-600'>$79</span><button className='text-sm bg-blue-600 text-white px-3 py-1.5 rounded'>Enroll</button></div></div></div></div></section>\n  <section className='bg-white'><div className='max-w-7xl mx-auto px-4 py-12'><h2 className='text-2xl font-bold mb-6'>What learners say</h2><div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'><div className='bg-gray-50 border rounded-lg p-5'><p className='italic text-gray-700'>“The UI is clean and fast to customize.”</p><div className='mt-3 text-sm text-gray-300'>— Jamie</div></div><div className='bg-gray-50 border rounded-lg p-5'><p className='italic text-gray-700'>“I shipped a polished demo in hours.”</p><div className='mt-3 text-sm text-gray-300'>— Omar</div></div><div className='bg-gray-50 border rounded-lg p-5'><p className='italic text-gray-700'>“Perfect starting point for client projects.”</p><div className='mt-3 text-sm text-gray-300'>— Leah</div></div></div></div></section>\n  <section className='bg-gradient-to-r from-blue-600 to-indigo-700'><div className='max-w-7xl mx-auto px-4 py-12 text-center text-white'><h2 className='text-2xl sm:text-3xl font-bold mb-2'>Start learning today</h2><p className='opacity-90 mb-4'>Pick a template, save as project, and build.</p><a href='#popular' className='inline-block bg-white text-blue-700 font-semibold px-6 py-3 rounded hover:bg-blue-50'>Browse Courses</a></div></section>\n  <footer className='bg-white border-t'><div className='max-w-7xl mx-auto px-4 py-8 grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-300'><div><div className='font-semibold text-white mb-2'>Product</div><ul className='space-y-1'><li><a href='#' className='hover:text-white'>Features</a></li><li><a href='#popular' className='hover:text-white'>Courses</a></li><li><a href='#' className='hover:text-white'>Pricing</a></li></ul></div><div><div className='font-semibold text-white mb-2'>Resources</div><ul className='space-y-1'><li><a href='#' className='hover:text-white'>Blog</a></li><li><a href='#' className='hover:text-white'>Guides</a></li><li><a href='#' className='hover:text-white'>Help Center</a></li></ul></div><div><div className='font-semibold text-white mb-2'>Company</div><ul className='space-y-1'><li><a href='#' className='hover:text-white'>About</a></li><li><a href='#' className='hover:text-white'>Careers</a></li><li><a href='#' className='hover:text-white'>Contact</a></li></ul></div><div><div className='font-semibold text-white mb-2'>Legal</div><ul className='space-y-1'><li><a href='#' className='hover:text-white'>Privacy</a></li><li><a href='#' className='hover:text-white'>Terms</a></li><li><a href='#' className='hover:text-white'>License</a></li></ul></div></div><div className='border-t py-4 text-xs text-gray-400 text-center'>© 2024 EduPlatform. All rights reserved.</div></footer>\n</div>)}\n`,
    },
  ];

  await knex('project_templates').insert({
    name: 'E-Learning Platform',
    key: targetKey,
    description: 'Frontend e-learning platform UI (Next.js + Tailwind)',
    category: 'frontend',
    language: 'typescript',
    framework: 'nextjs',
    dependencies: JSON.stringify({ next: '^14.0.4', react: '^18.2.0', 'react-dom': '^18.2.0', typescript: '^5.3.2', tailwindcss: '^3.4.0', autoprefixer: '^10.4.0', postcss: '^8.4.0' }),
    scripts: JSON.stringify({ dev: 'next dev', build: 'next build', start: 'next start' }),
    config: JSON.stringify({ nodeVersion: '18', packageManager: 'npm' }),
    dockerImage: 'node:18-alpine',
    files: JSON.stringify(files),
    icon: '📚',
    version: '1.0.2',
    isActive: true,
    isOfficial: true,
    createdAt: now,
    updatedAt: now,
  });
  console.log('✅ Inserted fallback E-Learning Platform template');
}

