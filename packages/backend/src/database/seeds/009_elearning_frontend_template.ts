import type { Knex } from 'knex';

// Frontend-only E-Learning template (TypeScript + Next.js App Router)
export async function seed(knex: Knex): Promise<void> {
  const key = 'elearning-frontend';

  const files = [
    {
      path: 'README.md',
      type: 'file',
      content:
        `# 📚 EduPlatform (Frontend Only)\n\nA modern e-learning frontend built with Next.js (App Router), TypeScript, and Tailwind CSS.\n\n- No APIs, no database — purely UI templates with mock data\n- Hot reload ready for live preview\n- Can be saved as a project in SwiStack\n\n## Quick Start\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nOpen http://localhost:3000\n`,
    },
    {
      path: 'package.json',
      type: 'file',
      content: JSON.stringify(
        {
          name: 'eduplatform-frontend',
          private: true,
          version: '1.0.0',
          description: 'Modern E-Learning Platform Frontend (UI only)',
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
          },
          dependencies: {
            next: '^14.0.4',
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            typescript: '^5.3.2',
            '@types/node': '^20.0.0',
            '@types/react': '^18.0.0',
            '@types/react-dom': '^18.0.0',
            tailwindcss: '^3.4.0',
            autoprefixer: '^10.4.0',
            postcss: '^8.4.0',
            'lucide-react': '^0.400.0',
          },
          devDependencies: {
            eslint: '^8.0.0',
            'eslint-config-next': '^14.0.4',
          },
        },
        null,
        2,
      ),
    },
    {
      path: 'tsconfig.json',
      type: 'file',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: false,
            skipLibCheck: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'ESNext',
            moduleResolution: 'Bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            baseUrl: '.',
            paths: {},
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
          exclude: ['node_modules'],
        },
        null,
        2,
      ),
    },
    {
      path: 'next-env.d.ts',
      type: 'file',
      content: '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n\n// NOTE: This file should not be edited\n// see https://nextjs.org/docs/basic-features/typescript for more information.\n',
    },
    {
      path: 'next.config.js',
      type: 'file',
      content:
        `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  experimental: { appDir: true },\n};\n\nmodule.exports = nextConfig;\n`,
    },
    {
      path: 'tailwind.config.js',
      type: 'file',
      content:
        `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: [\n    './src/**/*.{js,ts,jsx,tsx,mdx}',\n  ],\n  theme: {\n    extend: {\n      colors: {\n        primary: {\n          50: '#eff6ff',\n          100: '#dbeafe',\n          200: '#bfdbfe',\n          300: '#93c5fd',\n          400: '#60a5fa',\n          500: '#3b82f6',\n          600: '#2563eb',\n          700: '#1d4ed8',\n          800: '#1e40af',\n          900: '#1e3a8a'\n        }\n      }\n    }\n  },\n  plugins: [],\n};\n`,
    },
    {
      path: 'postcss.config.js',
      type: 'file',
      content: `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };\n`,
    },
    { path: 'src', type: 'directory' },
    { path: 'src/app', type: 'directory' },
    {
      path: 'src/app/globals.css',
      type: 'file',
      content:
        `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* Basic layout helpers */\n:root { color-scheme: light; }\nhtml, body { height: 100%; }\n`,
    },
    {
      path: 'src/app/layout.tsx',
      type: 'file',
      content:
        `import './globals.css';\nimport type { Metadata } from 'next';\n\nexport const metadata: Metadata = {\n  title: 'EduPlatform — Learn Without Limits',\n  description: 'Frontend-only e-learning UI built with Next.js and Tailwind CSS',\n};\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body className=\"min-h-screen bg-gray-50 text-gray-900\">{children}</body>\n    </html>\n  );\n}\n`,
    },
    // Home
    {
      path: 'src/app/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\nimport { BookOpen, Play, TrendingUp } from 'lucide-react';\n\nexport default function HomePage() {\n  return (\n    <div className=\"min-h-screen\">\n      <nav className=\"bg-white shadow-sm border-b\">\n        <div className=\"max-w-7xl mx-auto px-4 h-16 flex justify-between items-center\">\n          <div className=\"flex items-center\">\n            <BookOpen className=\"h-7 w-7 text-primary-600\" />\n            <span className=\"ml-2 text-2xl font-bold\">EduPlatform</span>\n          </div>\n          <div className=\"space-x-4\">\n            <Link href=\"/courses\" className=\"text-gray-700 hover:text-primary-600\">Courses</Link>\n            <Link href=\"/dashboard\" className=\"text-gray-700 hover:text-primary-600\">Dashboard</Link>\n            <Link href=\"/login\" className=\"bg-primary-600 text-white px-4 py-2 rounded\">Sign In</Link>\n          </div>\n        </div>\n      </nav>\n\n      <section className=\"bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20\">\n        <div className=\"max-w-7xl mx-auto px-4 text-center\">\n          <h1 className=\"text-5xl font-bold mb-6\">Learn Without Limits</h1>\n          <p className=\"text-lg mb-8 opacity-95\">Transform your career with expert-led courses and hands-on projects.</p>\n          <div className=\"space-x-4\">\n            <Link href=\"/courses\" className=\"bg-white text-primary-700 px-6 py-3 rounded font-semibold\">Explore Courses</Link>\n            <button className=\"border-2 border-white px-6 py-3 rounded font-semibold\">\n              <Play className=\"inline mr-2 h-5 w-5\" />Watch Demo\n            </button>\n          </div>\n        </div>\n      </section>\n\n      <section className=\"py-16 bg-white\">\n        <div className=\"max-w-7xl mx-auto px-4\">\n          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-8 text-center\">\n            <div><div className=\"text-3xl font-bold text-primary-600\">10,000+</div><div>Students</div></div>\n            <div><div className=\"text-3xl font-bold text-primary-600\">1,200+</div><div>Courses</div></div>\n            <div><div className=\"text-3xl font-bold text-primary-600\">500+</div><div>Instructors</div></div>\n            <div><div className=\"text-3xl font-bold text-primary-600\">98%</div><div>Success Rate</div></div>\n          </div>\n        </div>\n      </section>\n    </div>\n  );\n}\n`,
    },
    // Courses list
    {
      path: 'src/app/courses/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\nimport { mockCourses } from '../data/mockData';\n\nexport default function Courses() {\n  return (\n    <div className=\"min-h-screen bg-gray-50\">\n      <nav className=\"bg-white shadow-sm border-b\">\n        <div className=\"max-w-7xl mx-auto px-4 h-16 flex items-center\">\n          <Link href=\"/\" className=\"text-2xl font-bold text-primary-600\">EduPlatform</Link>\n        </div>\n      </nav>\n      <div className=\"max-w-7xl mx-auto px-4 py-8\">\n        <h1 className=\"text-3xl font-bold mb-6\">All Courses</h1>\n        <div className=\"grid gap-6 sm:grid-cols-2 lg:grid-cols-3\">\n          {mockCourses.map((c) => (\n            <div key={c.id} className=\"bg-white p-6 rounded shadow border\">\n              <h3 className=\"text-xl font-semibold mb-1\">{c.title}</h3>\n              <p className=\"text-sm text-gray-600 mb-4\">{c.instructor}</p>\n              <div className=\"flex items-center justify-between\">\n                <span className=\"text-2xl font-bold text-primary-600\">${'${c.price}'}<span className=\"text-base font-normal text-gray-600\">/course</span></span>\n                <Link href=\"/course/\${'${c.id}'}\" className=\"bg-primary-600 text-white px-4 py-2 rounded\">View</Link>\n              </div>\n            </div>\n          ))}\n        </div>\n      </div>\n    </div>\n  );\n}\n`,
    },
    // Course detail
    {
      path: 'src/app/course/[id]/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\nimport { mockCourses } from '../../data/mockData';\n\nexport default function CourseDetail({ params }: { params: { id: string } }) {\n  const id = parseInt(params.id, 10);\n  const course = mockCourses.find((c) => c.id === id);\n  if (!course) return <div className=\"p-8\">Course not found</div>;\n\n  return (\n    <div className=\"min-h-screen bg-gray-50\">\n      <nav className=\"bg-white shadow-sm border-b\">\n        <div className=\"max-w-7xl mx-auto px-4 h-16 flex items-center\">\n          <Link href=\"/\" className=\"text-2xl font-bold text-primary-600\">EduPlatform</Link>\n        </div>\n      </nav>\n      <div className=\"max-w-5xl mx-auto px-4 py-8\">\n        <div className=\"bg-white p-6 rounded shadow border mb-6\">\n          <h1 className=\"text-3xl font-bold mb-2\">{course.title}</h1>\n          <p className=\"text-gray-600 mb-4\">By {course.instructor}</p>\n          <p className=\"mb-6\">{course.description}</p>\n          <button className=\"bg-primary-600 text-white px-6 py-2 rounded\">Enroll Now</button>\n        </div>\n        <div className=\"grid sm:grid-cols-2 gap-6\">\n          <div className=\"bg-white p-6 rounded shadow border\">\n            <h2 className=\"font-semibold mb-2\">What you'll learn</h2>\n            <ul className=\"list-disc pl-6 space-y-1 text-sm text-gray-700\">\n              {course.outcomes.map((o, i) => (<li key={i}>{o}</li>))}\n            </ul>\n          </div>\n          <div className=\"bg-white p-6 rounded shadow border\">\n            <h2 className=\"font-semibold mb-2\">Curriculum</h2>\n            <ol className=\"list-decimal pl-6 space-y-1 text-sm text-gray-700\">\n              {course.curriculum.map((o, i) => (<li key={i}>{o}</li>))}\n            </ol>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n`,
    },
    // Dashboard
    {
      path: 'src/app/dashboard/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\n\nexport default function Dashboard() {\n  return (\n    <div className=\"min-h-screen bg-gray-50\">\n      <nav className=\"bg-white shadow-sm border-b\">\n        <div className=\"max-w-7xl mx-auto px-4 h-16 flex items-center justify-between\">\n          <Link href=\"/\" className=\"text-2xl font-bold text-primary-600\">EduPlatform</Link>\n          <div className=\"flex items-center space-x-2\">\n            <div className=\"w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm\">JD</div>\n            <span>John Doe</span>\n          </div>\n        </div>\n      </nav>\n      <div className=\"max-w-6xl mx-auto px-4 py-8\">\n        <h1 className=\"text-3xl font-bold mb-2\">Welcome back, John! 👋</h1>\n        <p className=\"text-gray-600 mb-8\">Continue your learning journey</p>\n        <div className=\"grid grid-cols-2 md:grid-cols-4 gap-6 mb-8\">\n          <div className=\"bg-white p-6 rounded shadow\"><div className=\"text-2xl font-bold text-primary-600\">3</div><div>Enrolled</div></div>\n          <div className=\"bg-white p-6 rounded shadow\"><div className=\"text-2xl font-bold text-green-600\">1</div><div>Completed</div></div>\n          <div className=\"bg-white p-6 rounded shadow\"><div className=\"text-2xl font-bold\">127</div><div>Hours</div></div>\n          <div className=\"bg-white p-6 rounded shadow\"><div className=\"text-2xl font-bold\">12</div><div>Streak</div></div>\n        </div>\n        <div className=\"bg-white p-6 rounded shadow\">\n          <h2 className=\"text-xl font-bold mb-4\">Continue Learning</h2>\n          <div className=\"flex justify-between items-center p-4 bg-gray-50 rounded\">\n            <div>\n              <div className=\"font-bold\">Web Development Bootcamp</div>\n              <div className=\"text-sm text-gray-600\">75% complete</div>\n            </div>\n            <button className=\"bg-primary-600 text-white px-4 py-2 rounded\">Continue</button>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n`,
    },
    // Login
    {
      path: 'src/app/login/page.tsx',
      type: 'file',
      content:
        `import Link from 'next/link';\n\nexport default function Login() {\n  return (\n    <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">\n      <div className=\"max-w-md w-full\">\n        <div className=\"text-center mb-8\">\n          <Link href=\"/\" className=\"text-3xl font-bold text-primary-600\">EduPlatform</Link>\n          <h2 className=\"text-2xl font-bold mt-4\">Welcome back!</h2>\n        </div>\n        <div className=\"bg-white p-8 rounded shadow\">\n          <div className=\"mb-4 p-3 bg-blue-50 rounded text-sm\">\n            <strong>Demo:</strong> student@demo.com / demo123\n          </div>\n          <form className=\"space-y-4\">\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Email</label>\n              <input type=\"email\" className=\"w-full p-2 border rounded\" placeholder=\"Enter email\" />\n            </div>\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Password</label>\n              <input type=\"password\" className=\"w-full p-2 border rounded\" placeholder=\"Enter password\" />\n            </div>\n            <button className=\"w-full bg-primary-600 text-white py-2 rounded\">Sign In</button>\n          </form>\n        </div>\n      </div>\n    </div>\n  );\n}\n`,
    },
    // Mock data
    {
      path: 'src/app/data/mockData.ts',
      type: 'file',
      content:
        `export type Course = {\n  id: number;\n  title: string;\n  instructor: string;\n  price: number;\n  description: string;\n  outcomes: string[];\n  curriculum: string[];\n};\n\nexport const mockCourses: Course[] = [\n  {\n    id: 1,\n    title: 'Web Development Bootcamp',\n    instructor: 'Sarah Johnson',\n    price: 89,\n    description: 'Learn HTML, CSS, JavaScript, and React to build modern web apps.',\n    outcomes: ['Build responsive websites', 'Master React fundamentals', 'Deploy to production'],\n    curriculum: ['Intro to Web', 'HTML & CSS', 'JavaScript', 'React Basics', 'Final Project']\n  },\n  {\n    id: 2,\n    title: 'Data Science with Python',\n    instructor: 'Michael Chen',\n    price: 99,\n    description: 'Analyze data, build models, and communicate insights using Python.',\n    outcomes: ['Python for data', 'Pandas & NumPy', 'Visualization', 'Modeling basics'],\n    curriculum: ['Python Refresher', 'NumPy & Pandas', 'Visualization', 'Intro to ML']\n  },\n  {\n    id: 3,\n    title: 'UI/UX Design Fundamentals',\n    instructor: 'Emily Carter',\n    price: 79,\n    description: 'Design beautiful, user-centered interfaces from concept to prototype.',\n    outcomes: ['Design principles', 'Wireframing', 'Prototyping', 'Accessibility'],\n    curriculum: ['Design Basics', 'Wireframes', 'Prototypes', 'Usability Testing']\n  }\n];\n`,
    },
  ];

  const template = {
    name: 'E-Learning Frontend',
    key,
    description:
      'Frontend e-learning platform with course catalog, course page, dashboard, and auth UI — no backend',
    category: 'frontend',
    language: 'typescript',
    framework: 'nextjs',
    dependencies: {
      next: '^14.0.4',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      typescript: '^5.3.2',
      tailwindcss: '^3.4.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
      'lucide-react': '^0.400.0',
    },
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    config: {
      nodeVersion: '18',
      packageManager: 'npm',
    },
    dockerImage: 'node:18-alpine',
    files,
    icon: '📚',
    version: '1.0.0',
    isActive: true,
    isOfficial: true,
  } as any;

  // Upsert behavior: delete existing and insert fresh to keep it simple and deterministic for seeds
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

