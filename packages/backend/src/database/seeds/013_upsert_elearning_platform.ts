import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const targetKey = 'elearning-platform';

  // Always remove any existing record for idempotency
  await knex('project_templates').where('key', targetKey).del();

  const now = new Date();

  // Next.js E-Learning Platform Template
  const files = [
    {
      path: 'package.json',
      type: 'file',
      content: JSON.stringify({
        name: 'elearning-platform',
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint'
        },
        dependencies: {
          next: '14.0.4',
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/node': '^20',
          '@types/react': '^18',
          '@types/react-dom': '^18',
          autoprefixer: '^10.0.1',
          eslint: '^8',
          'eslint-config-next': '14.0.4',
          postcss: '^8',
          tailwindcss: '^3.3.0',
          typescript: '^5'
        }
      }, null, 2)
    },
    {
      path: 'tsconfig.json',
      type: 'file',
      content: JSON.stringify({
        compilerOptions: {
          target: 'es5',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: { '@/*': ['./src/*'] }
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules']
      }, null, 2)
    },
    {
      path: 'next.config.js',
      type: 'file',
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`
    },
    {
      path: 'tailwind.config.ts',
      type: 'file',
      content: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config`
    },
    {
      path: 'postcss.config.js',
      type: 'file',
      content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
    },
    {
      path: 'src/app/layout.tsx',
      type: 'file',
      content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LearnHub - E-Learning Platform',
  description: 'Learn without limits with our comprehensive e-learning platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`
    },
    {
      path: 'src/app/globals.css',
      type: 'file',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`
    },
    {
      path: 'src/app/page.tsx',
      type: 'file',
      content: `import CourseCard from '@/components/CourseCard'
import Header from '@/components/Header'

export default function Home() {
  const courses = [
    {
      id: 1,
      title: 'Web Development Bootcamp',
      instructor: 'John Doe',
      description: 'Learn modern web technologies from scratch',
      image: '/api/placeholder/400/200',
      price: 89.99,
      rating: 4.8,
      students: 12453
    },
    {
      id: 2,
      title: 'Data Science with Python',
      instructor: 'Jane Smith',
      description: 'Master data analysis and machine learning',
      image: '/api/placeholder/400/200',
      price: 79.99,
      rating: 4.9,
      students: 8234
    },
    {
      id: 3,
      title: 'UI/UX Design Masterclass',
      instructor: 'Mike Johnson',
      description: 'Create beautiful and intuitive interfaces',
      image: '/api/placeholder/400/200',
      price: 69.99,
      rating: 4.7,
      students: 6789
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Learn Without Limits
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start, switch, or advance your career with thousands of courses
          </p>
          <div className="flex justify-center space-x-4">
            <input
              type="text"
              placeholder="What do you want to learn?"
              className="px-6 py-3 rounded-lg border border-gray-300 w-96 focus:outline-none focus:border-indigo-500"
            />
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600">10K+</div>
              <div className="text-gray-600 mt-2">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">500+</div>
              <div className="text-gray-600 mt-2">Courses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">100+</div>
              <div className="text-gray-600 mt-2">Expert Instructors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">95%</div>
              <div className="text-gray-600 mt-2">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What Our Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-yellow-500">★★★★★</div>
              </div>
              <p className="text-gray-700 mb-4">
                "LearnHub transformed my career. The courses are comprehensive and the instructors are top-notch!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-semibold">AS</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Alex Smith</p>
                  <p className="text-sm text-gray-600">Web Developer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-yellow-500">★★★★★</div>
              </div>
              <p className="text-gray-700 mb-4">
                "The flexibility to learn at my own pace while working full-time has been incredible."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">MJ</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Maria Johnson</p>
                  <p className="text-sm text-gray-600">Data Scientist</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-yellow-500">★★★★★</div>
              </div>
              <p className="text-gray-700 mb-4">
                "Best investment in my education. The practical projects helped me land my dream job!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold">RC</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Robert Chen</p>
                  <p className="text-sm text-gray-600">UX Designer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of learners advancing their careers with LearnHub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Started Free
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors">
              Browse Courses
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <svg
                  className="w-8 h-8 text-indigo-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="text-xl font-bold text-white">LearnHub</h3>
              </div>
              <p className="text-sm">
                Empowering learners worldwide with quality education and practical skills.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Learn</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">All Courses</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Web Development</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Data Science</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Design</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Forums</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Events</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 LearnHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}`
    },
    {
      path: 'src/components/Header.tsx',
      type: 'file',
      content: `'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <svg
              className="w-8 h-8 text-indigo-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">LearnHub</h1>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link href="/courses" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Courses
            </Link>
            <Link href="/my-learning" className="text-gray-700 hover:text-indigo-600 transition-colors">
              My Learning
            </Link>
            <Link href="/community" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Community
            </Link>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Sign In
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}`
    },
    {
      path: 'src/components/CourseCard.tsx',
      type: 'file',
      content: `'use client'

interface Course {
  id: number
  title: string
  instructor: string
  description: string
  image: string
  price: number
  rating: number
  students: number
}

export default function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
      <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500"></div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
        <p className="text-gray-600 mb-2">by {course.instructor}</p>
        <p className="text-gray-500 text-sm mb-4">{course.description}</p>
        
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            <span className="text-yellow-500">★★★★★</span>
            <span className="text-sm text-gray-600 ml-2">
              {course.rating} ({course.students.toLocaleString()} students)
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-indigo-600">
            \${course.price}
          </span>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => alert('Enrollment feature coming soon!')}
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  )
}`
    },
    {
      path: '.gitignore',
      type: 'file',
      content: `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`
    }
  ];

  await knex('project_templates').insert({
    name: 'E-Learning Platform',
    key: targetKey,
    description: 'Full-stack Next.js e-learning platform with TypeScript and Tailwind CSS',
    category: 'Educational',
    language: 'typescript',
    framework: 'nextjs',
    dependencies: JSON.stringify({
      next: '14.0.4',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      '@types/node': '^20',
      '@types/react': '^18',
      '@types/react-dom': '^18',
      autoprefixer: '^10.0.1',
      eslint: '^8',
      'eslint-config-next': '14.0.4',
      postcss: '^8',
      tailwindcss: '^3.3.0',
      typescript: '^5'
    }),
    scripts: JSON.stringify({
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    }),
    config: JSON.stringify({
      port: 3000,
      framework: 'nextjs',
      language: 'typescript'
    }),
    dockerImage: 'node:18-alpine',
    files: JSON.stringify(files),
    icon: '📚',
    version: '2.0.0',
    isActive: true,
    isOfficial: true,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
  });
  
  console.log('✅ Inserted Next.js E-Learning Platform template');
}