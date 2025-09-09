import type { Knex } from 'knex';

// Minimal, frontend-only E-Learning template (no `${}` in content to avoid seed eval issues)
export async function seed(knex: Knex): Promise<void> {
  const key = 'elearning-frontend-lite';

  const files = [
    {
      path: 'package.json',
      type: 'file',
      content: JSON.stringify(
        {
          name: 'eduplatform-frontend-lite',
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
        },
        null,
        2,
      ),
    },
    { path: 'postcss.config.js', type: 'file', content: `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };\n` },
    { path: 'tailwind.config.js', type: 'file', content: `module.exports = { content: ['src/**/*.{ts,tsx}'], theme: {extend:{}}, plugins: [] };\n` },
    { path: 'next.config.js', type: 'file', content: `module.exports = { experimental: { appDir: true } };\n` },
    { path: 'src', type: 'directory' },
    { path: 'src/app', type: 'directory' },
    { path: 'src/app/globals.css', type: 'file', content: `@tailwind base;@tailwind components;@tailwind utilities;\nhtml,body{height:100%}` },
    {
      path: 'src/app/components',
      type: 'directory'
    },
    {
      path: 'src/app/components/Footer.tsx',
      type: 'file',
      content:
        `export default function Footer() {\n  return (\n    <footer className=\"bg-black text-white border-t border-gray-800\">\n      <div className=\"max-w-7xl mx-auto px-4 py-8 grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-300\">\n        <div>\n          <div className=\"font-semibold text-white mb-2\">Product</div>\n          <ul className=\"space-y-1\">\n            <li><a href=\"#\" className=\"hover:text-white\">Features</a></li>\n            <li><a href=\"#popular\" className=\"hover:text-white\">Courses</a></li>\n            <li><a href=\"#\" className=\"hover:text-white\">Pricing</a></li>\n          </ul>\n        </div>\n        <div>\n          <div className=\"font-semibold text-white mb-2\">Resources</div>\n          <ul className=\"space-y-1\">\n            <li><a href=\"#\" className=\"hover:text-white\">Blog</a></li>\n            <li><a href=\"#\" className=\"hover:text-white\">Guides</a></li>\n            <li><a href=\"#\" className=\"hover:text-white\">Help Center</a></li>\n          </ul>\n        </div>\n        <div>\n          <div className=\"font-semibold text-white mb-2\">Company</div>\n          <ul className=\"space-y-1\">\n            <li><a href=\"#\" className=\"hover:text-white\">About</a></li>\n            <li><a href=\"#\" className=\"hover:text-white\">Careers</a></li>\n            <li><a href=\"#\" className=\"hover:text-white\">Contact</a></li>\n          </ul>\n        </div>\n        <div>\n          <div className=\"font-semibold text-white mb-2\">Legal</div>\n          <ul className=\"space-y-1\">\n            <li><a href=\"#\" className=\"hover:text-white\">Privacy</a></li>\n            <li><a href=\"#\" className=\"hover:text-white\">Terms</a></li>\n            <li><a href=\"#\" className=\"hover:text-white\">License</a></li>\n          </ul>\n        </div>\n      </div>\n      <div className=\"border-t py-4 text-xs text-gray-400 text-center\">\n        © 2024 EduPlatform. All rights reserved.\n      </div>\n    </footer>\n  );\n}\n`,
    },
    {
      path: 'src/app/layout.tsx',
      type: 'file',
      content:
        `import './globals.css';\nimport Footer from './components/Footer';\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang='en'>\n      <body className='min-h-screen bg-gray-50 flex flex-col'>\n        <div className='flex-1'>{children}</div>\n        <footer className="bg-black text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8 grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-300">
          <div>
            <div className="font-semibold text-white mb-2">Product</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#popular" className="hover:text-white">Courses</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Resources</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Guides</a></li>
              <li><a href="#" className="hover:text-white">Help Center</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Company</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Legal</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">License</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 py-4 text-xs text-gray-400 text-center">
          © 2024 EduPlatform. All rights reserved.
        </div>
      </footer>\n      </body>\n    </html>\n  );\n}\n`,
    },
    {
      path: 'src/app/page.tsx',
      type: 'file',
      content:
        `import Link from "next/link";\nimport Footer from "./components/Footer";\n\nexport default function Home() {\n  return (\n    <div className="min-h-screen">\n      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">\n        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">\n          <div className="flex items-center space-x-2"><span className="text-2xl font-extrabold text-blue-700">EduPlatform</span><span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">Lite</span></div>\n          <nav className="hidden md:flex items-center space-x-6 text-sm">\n            <a href="#popular" className="hover:text-white">Courses</a>\n            <a href="#" className="hover:text-white">Dashboard</a>\n            <a href="#" className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Login</a>\n          </nav>\n        </div>\n      </header>\n\n      {/* 1) Hero */}\n      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">\n        <div className="max-w-7xl mx-auto px-4 py-16 text-center">\n          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">Learn Without Limits</h1>\n          <p className="opacity-95 text-lg mb-6">Expert-led courses, hands-on projects, beautiful UI.</p>\n          <div className="flex flex-col sm:flex-row gap-3 justify-center">\n            <a href="#popular" className="bg-white text-blue-700 font-semibold px-6 py-3 rounded shadow hover:bg-blue-50">Explore Courses</a>\n            <a href="#popular" className="border border-white/40 text-white px-6 py-3 rounded hover:bg-white/10">Popular Tracks</a>\n          </div>\n        </div>\n      </section>\n\n      {/* 2) Stats */}\n      <section className="bg-white">\n        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">\n          <div><div className="text-4xl font-extrabold text-blue-600">50,000</div><div className="text-gray-600 font-medium">Active Students</div></div>\n          <div><div className="text-4xl font-extrabold text-blue-600">1,200</div><div className="text-gray-600 font-medium">Expert Instructors</div></div>\n          <div><div className="text-4xl font-extrabold text-blue-600">2,800</div><div className="text-gray-600 font-medium">Online Courses</div></div>\n          <div><div className="text-4xl font-extrabold text-blue-600">98%</div><div className="text-gray-600 font-medium">Success Rate</div></div>\n        </div>\n      </section>\n\n      {/* 3) Categories */}\n      <section className="bg-gray-50">\n        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-2 overflow-x-auto">\n          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Web Dev</span>\n          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Data</span>\n          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Design</span>\n          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Cloud</span>\n          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Mobile</span>\n          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">AI/ML</span>\n          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">DevOps</span>\n        </div>\n      </section>\n\n      {/* 4) Popular Courses */}\n      <section id="popular" className="bg-white">\n        <div className="max-w-7xl mx-auto px-4 py-12">\n          <div className="flex items-end justify-between mb-6"><h2 className="text-2xl font-bold">Popular Courses</h2><a href="#popular" className="text-blue-600 hover:underline">View all</a></div>\n          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">\n            <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">\n              <div className="h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4"/>\n              <h3 className="font-semibold">Web Development Bootcamp</h3>\n              <p className="text-sm text-gray-300 mb-3">By Sarah Johnson</p>\n              <div className="flex items-center justify-between"><span className="font-bold text-blue-600">$89</span><button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">Enroll</button></div>\n            </div>\n            <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">\n              <div className="h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4"/>\n              <h3 className="font-semibold">Data Science with Python</h3>\n              <p className="text-sm text-gray-300 mb-3">By Michael Chen</p>\n              <div className="flex items-center justify-between"><span className="font-bold text-blue-600">$99</span><button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">Enroll</button></div>\n            </div>\n            <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">\n              <div className="h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4"/>\n              <h3 className="font-semibold">UI/UX Design Fundamentals</h3>\n              <p className="text-sm text-gray-300 mb-3">By Emily Carter</p>\n              <div className="flex items-center justify-between"><span className="font-bold text-blue-600">$79</span><button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">Enroll</button></div>\n            </div>\n          </div>\n        </div>\n      </section>\n\n      {/* 5) Learning Paths */}\n      <section className="bg-gray-50">\n        <div className="max-w-7xl mx-auto px-4 py-12">\n          <h2 className="text-2xl font-bold mb-6">Learning Paths</h2>\n          <div className="grid md:grid-cols-3 gap-6">\n            <div className="bg-white border rounded-lg p-5">\n              <h3 className="font-semibold">Frontend Engineer</h3>\n              <p className="text-sm text-gray-300 mt-1">HTML, CSS, JS, React, TS</p>\n              <div className="mt-4"><a className="text-blue-600 hover:underline" href="#">View path</a></div>\n            </div>\n            <div className="bg-white border rounded-lg p-5">\n              <h3 className="font-semibold">Data Analyst</h3>\n              <p className="text-sm text-gray-300 mt-1">SQL, Python, Pandas, Viz</p>\n              <div className="mt-4"><a className="text-blue-600 hover:underline" href="#">View path</a></div>\n            </div>\n            <div className="bg-white border rounded-lg p-5">\n              <h3 className="font-semibold">Cloud Practitioner</h3>\n              <p className="text-sm text-gray-300 mt-1">AWS basics, networking, security</p>\n              <div className="mt-4"><a className="text-blue-600 hover:underline" href="#">View path</a></div>\n            </div>\n          </div>\n        </div>\n      </section>\n\n      {/* 6) Testimonials */}\n      <section className="bg-white">\n        <div className="max-w-7xl mx-auto px-4 py-12">\n          <h2 className="text-2xl font-bold mb-6">What learners say</h2>\n          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">\n            <div className="bg-gray-50 border rounded-lg p-5">\n              <p className="italic text-gray-700">“The UI is clean and fast to customize.”</p>\n              <div className="mt-3 text-sm text-gray-300">— Jamie</div>\n            </div>\n            <div className="bg-gray-50 border rounded-lg p-5">\n              <p className="italic text-gray-700">“I shipped a polished demo in hours.”</p>\n              <div className="mt-3 text-sm text-gray-300">— Omar</div>\n            </div>\n            <div className="bg-gray-50 border rounded-lg p-5">\n              <p className="italic text-gray-700">“Perfect starting point for client projects.”</p>\n              <div className="mt-3 text-sm text-gray-300">— Leah</div>\n            </div>\n          </div>\n        </div>\n      </section>\n\n      {/* Footer CTA */}\n      <section className="bg-gradient-to-r from-blue-600 to-indigo-700">\n        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-white">\n          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Start learning today</h2>\n          <p className="opacity-90 mb-4">Pick a template, save as project, and build.</p>\n          <a href="#popular" className="inline-block bg-white text-blue-700 font-semibold px-6 py-3 rounded hover:bg-blue-50">Browse Courses</a>\n        </div>\n      </section>\n      <footer className="bg-black text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8 grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-300">
          <div>
            <div className="font-semibold text-white mb-2">Product</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#popular" className="hover:text-white">Courses</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Resources</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Guides</a></li>
              <li><a href="#" className="hover:text-white">Help Center</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Company</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-2">Legal</div>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">License</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 py-4 text-xs text-gray-400 text-center">
          © 2024 EduPlatform. All rights reserved.
        </div>
      </footer>\n    </div>\n  );\n}\n`,
    },
    {
      path: 'src/app/courses/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\nexport default function Courses(){return (<div className='min-h-screen bg-gray-50'>\n<nav className='bg-white border-b'><div className='max-w-6xl mx-auto h-16 flex items-center px-4'><Link href='/' className='font-bold text-blue-600'>EduPlatform</Link></div></nav>\n<div className='max-w-6xl mx-auto p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>\n  <div className='bg-white p-5 rounded border'><h3 className='font-semibold'>Web Development Bootcamp</h3><p className='text-sm text-gray-300'>Sarah Johnson</p><div className='flex justify-between mt-3'><span className='font-bold text-blue-600'>$89</span><a href='#' className='bg-blue-600 text-white px-3 py-1 rounded'>View</a></div></div>\n  <div className='bg-white p-5 rounded border'><h3 className='font-semibold'>Data Science with Python</h3><p className='text-sm text-gray-300'>Michael Chen</p><div className='flex justify-between mt-3'><span className='font-bold text-blue-600'>$99</span><a href='#' className='bg-blue-600 text-white px-3 py-1 rounded'>View</a></div></div>\n  <div className='bg-white p-5 rounded border'><h3 className='font-semibold'>UI/UX Design Fundamentals</h3><p className='text-sm text-gray-300'>Emily Carter</p><div className='flex justify-between mt-3'><span className='font-bold text-blue-600'>$79</span><a href='#' className='bg-blue-600 text-white px-3 py-1 rounded'>View</a></div></div>\n</div>\n</div>)}\n`,
    },
    {
      path: 'src/app/course/[id]/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\nexport default function Course(){return (<div className='min-h-screen bg-gray-50'>\n<nav className='bg-white border-b'><div className='max-w-6xl mx-auto h-16 flex items-center px-4'><Link href='/' className='font-bold text-blue-600'>EduPlatform</Link></div></nav>\n<div className='max-w-3xl mx-auto p-6'>\n  <div className='bg-white p-6 rounded border mb-6'><h1 className='text-2xl font-bold mb-2'>Course Title</h1><p className='text-gray-600 mb-4'>By Instructor Name</p><p className='mb-4'>This is a static course detail page for the template.</p><button className='bg-blue-600 text-white px-4 py-2 rounded'>Enroll Now</button></div>\n  <div className='grid sm:grid-cols-2 gap-6'>\n    <div className='bg-white p-6 rounded border'><h2 className='font-semibold mb-2'>What you'll learn</h2><ul className='list-disc pl-6 text-sm text-gray-700 space-y-1'><li>Topic A</li><li>Topic B</li><li>Topic C</li></ul></div>\n    <div className='bg-white p-6 rounded border'><h2 className='font-semibold mb-2'>Curriculum</h2><ol className='list-decimal pl-6 text-sm text-gray-700 space-y-1'><li>Module 1</li><li>Module 2</li><li>Module 3</li></ol></div>\n  </div>\n</div>\n</div>)}\n`,
    },
    {
      path: 'src/app/dashboard/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\nexport default function Dashboard(){return (<div className='min-h-screen bg-gray-50'>\n<nav className='bg-white border-b'><div className='max-w-6xl mx-auto h-16 flex items-center justify-between px-4'><Link href='/' className='font-bold text-blue-600'>EduPlatform</Link><div className='flex items-center space-x-2'><div className='w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center text-sm'>JD</div><span>John Doe</span></div></div></nav>\n<div className='max-w-6xl mx-auto p-6'>\n  <h1 className='text-2xl font-bold mb-2'>Welcome back, John!</h1><p className='text-gray-600 mb-6'>Continue your learning journey</p>\n  <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-6'>\n    <div className='bg-white p-6 rounded border'><div className='text-xl font-bold text-blue-600'>3</div><div>Enrolled</div></div>\n    <div className='bg-white p-6 rounded border'><div className='text-xl font-bold text-green-600'>1</div><div>Completed</div></div>\n    <div className='bg-white p-6 rounded border'><div className='text-xl font-bold'>127</div><div>Hours</div></div>\n    <div className='bg-white p-6 rounded border'><div className='text-xl font-bold'>12</div><div>Streak</div></div>\n  </div>\n  <div className='bg-white p-6 rounded border'><h2 className='font-semibold mb-2'>Continue Learning</h2><div className='flex items-center justify-between p-4 bg-gray-50 rounded'><div><div className='font-semibold'>Web Development Bootcamp</div><div className='text-sm text-gray-300'>75% complete</div></div><button className='bg-blue-600 text-white px-4 py-2 rounded'>Continue</button></div></div>\n</div>\n</div>)}\n`,
    },
    {
      path: 'src/app/login/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\nexport default function Login(){return (<div className='min-h-screen bg-gray-50 flex items-center justify-center'>\n  <div className='max-w-md w-full'><div className='text-center mb-6'><Link href='/' className='text-2xl font-bold text-blue-600'>EduPlatform</Link><h2 className='text-xl font-bold mt-2'>Welcome back!</h2></div>\n  <div className='bg-white p-6 rounded border'>\n    <div className='mb-3 p-3 bg-blue-50 rounded text-sm'><b>Demo:</b> student@demo.com / demo123</div>\n    <form className='space-y-4'><div><label className='block text-sm font-medium mb-1'>Email</label><input type='email' className='w-full p-2 border rounded' placeholder='Enter email' /></div><div><label className='block text-sm font-medium mb-1'>Password</label><input type='password' className='w-full p-2 border rounded' placeholder='Enter password' /></div><button className='w-full bg-blue-600 text-white py-2 rounded'>Sign In</button></form>\n  </div></div></div>)}\n`,
    },
  ];

  const template = {
    name: 'E-Learning Frontend (Lite)',
    key,
    description: 'Frontend-only e-learning UI (static) — hot-reload ready',
    category: 'frontend',
    language: 'typescript',
    framework: 'nextjs',
    dependencies: { next: '^14.0.4', react: '^18.2.0', 'react-dom': '^18.2.0', typescript: '^5.3.2', tailwindcss: '^3.4.0', autoprefixer: '^10.4.0', postcss: '^8.4.0' },
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    config: { nodeVersion: '18', packageManager: 'npm' },
    dockerImage: 'node:18-alpine',
    files,
    icon: '📚',
    version: '1.0.0',
    isActive: true,
    isOfficial: true,
  } as any;

  await knex('project_templates').where('key', key).del();
  await knex('project_templates').insert({
    ...template,
    files: JSON.stringify(template.files),
    dependencies: JSON.stringify(template.dependencies),
    scripts: JSON.stringify(template.scripts),
    config: JSON.stringify(template.config),
  });

  // eslint-disable-next-line no-console
  console.log('✅ Seeded template:', key);
}
