import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Update the E-Learning template with minimal but functional content
  await knex('project_templates')
    .where('key', 'elearning-fullstack')
    .update({
      description: 'Modern e-learning platform with course catalog, dashboard, and authentication',
      files: JSON.stringify([
        {
          path: 'README.md',
          type: 'file',
          content: '# 📚 EduPlatform\\n\\nModern e-learning platform built with Next.js\\n\\n## Quick Start\\n\\n```bash\\nnpm install\\nnpm run dev\\n```\\n\\nOpen http://localhost:3000'
        },
        {
          path: 'package.json',
          type: 'file',
          content: '{\\n  \"name\": \"eduplatform\",\\n  \"version\": \"1.0.0\",\\n  \"scripts\": {\\n    \"dev\": \"next dev\",\\n    \"build\": \"next build\",\\n    \"start\": \"next start\"\\n  },\\n  \"dependencies\": {\\n    \"next\": \"^14.0.4\",\\n    \"react\": \"^18.2.0\",\\n    \"react-dom\": \"^18.2.0\",\\n    \"typescript\": \"^5.3.2\",\\n    \"tailwindcss\": \"^3.4.0\",\\n    \"lucide-react\": \"^0.400.0\"\\n  }\\n}'
        },
        {
          path: 'next.config.js',
          type: 'file',
          content: 'module.exports = { experimental: { appDir: true } };'
        },
        {
          path: 'tailwind.config.js',
          type: 'file',
          content: 'module.exports = {\\n  content: [\"./src/**/*.{js,ts,jsx,tsx}\"],\\n  theme: { extend: {} },\\n  plugins: []\\n};'
        },
        {
          path: 'src',
          type: 'directory'
        },
        {
          path: 'src/app',
          type: 'directory'
        },
        {
          path: 'src/app/layout.tsx',
          type: 'file',
          content: 'import \"./globals.css\";\\n\\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\\n  return (\\n    <html lang=\"en\">\\n      <body className=\"min-h-screen bg-gray-50\">{children}</body>\\n    </html>\\n  );\\n}'
        },
        {
          path: 'src/app/page.tsx',
          type: 'file',
          content: 'import Link from \"next/link\";\\nimport { BookOpen, Play } from \"lucide-react\";\\n\\nexport default function HomePage() {\\n  return (\\n    <div className=\"min-h-screen\">\\n      <nav className=\"bg-white shadow-sm border-b\">\\n        <div className=\"max-w-7xl mx-auto px-4 h-16 flex justify-between items-center\">\\n          <div className=\"flex items-center\">\\n            <BookOpen className=\"h-8 w-8 text-blue-600\" />\\n            <span className=\"ml-2 text-2xl font-bold\">📚 EduPlatform</span>\\n          </div>\\n          <div className=\"space-x-4\">\\n            <Link href=\"/courses\" className=\"text-gray-700 hover:text-blue-600\">Courses</Link>\\n            <Link href=\"/dashboard\" className=\"text-gray-700 hover:text-blue-600\">Dashboard</Link>\\n            <Link href=\"/login\" className=\"bg-blue-600 text-white px-4 py-2 rounded\">Login</Link>\\n          </div>\\n        </div>\\n      </nav>\\n      \\n      <section className=\"bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20\">\\n        <div className=\"max-w-7xl mx-auto px-4 text-center\">\\n          <h1 className=\"text-5xl font-bold mb-6\">Learn Without Limits</h1>\\n          <p className=\"text-xl mb-8\">Transform your career with expert-led courses</p>\\n          <div className=\"space-x-4\">\\n            <Link href=\"/courses\" className=\"bg-white text-blue-600 px-6 py-3 rounded font-semibold\">\\n              Explore Courses\\n            </Link>\\n            <button className=\"border-2 border-white px-6 py-3 rounded font-semibold\">\\n              <Play className=\"inline mr-2 h-5 w-5\" />Watch Demo\\n            </button>\\n          </div>\\n        </div>\\n      </section>\\n      \\n      <section className=\"py-16 bg-white\">\\n        <div className=\"max-w-7xl mx-auto px-4\">\\n          <div className=\"grid grid-cols-4 gap-8 text-center\">\\n            <div><div className=\"text-3xl font-bold text-blue-600\">10,000+</div><div>Students</div></div>\\n            <div><div className=\"text-3xl font-bold text-blue-600\">500+</div><div>Instructors</div></div>\\n            <div><div className=\"text-3xl font-bold text-blue-600\">1,200+</div><div>Courses</div></div>\\n            <div><div className=\"text-3xl font-bold text-blue-600\">98%</div><div>Success Rate</div></div>\\n          </div>\\n        </div>\\n      </section>\\n    </div>\\n  );\\n}'
        },
        {
          path: 'src/app/globals.css',
          type: 'file',
          content: '@tailwind base;\\n@tailwind components;\\n@tailwind utilities;'
        },
        {
          path: 'src/app/courses',
          type: 'directory'
        },
        {
          path: 'src/app/courses/page.tsx',
          type: 'file',
          content: 'import Link from \"next/link\";\\nimport { BookOpen, Star, Users } from \"lucide-react\";\\n\\nconst courses = [\\n  { id: 1, title: \"Web Development Bootcamp\", instructor: \"Sarah Johnson\", rating: 4.8, students: 15420, price: 89.99 },\\n  { id: 2, title: \"Data Science Master Class\", instructor: \"Michael Chen\", rating: 4.9, students: 8930, price: 119.99 }\\n];\\n\\nexport default function CoursesPage() {\\n  return (\\n    <div className=\"min-h-screen bg-gray-50\">\\n      <nav className=\"bg-white shadow-sm border-b\">\\n        <div className=\"max-w-7xl mx-auto px-4 h-16 flex justify-between items-center\">\\n          <Link href=\"/\" className=\"flex items-center\">\\n            <BookOpen className=\"h-8 w-8 text-blue-600\" />\\n            <span className=\"ml-2 text-2xl font-bold\">📚 EduPlatform</span>\\n          </Link>\\n          <div className=\"space-x-4\">\\n            <Link href=\"/dashboard\" className=\"text-gray-700 hover:text-blue-600\">Dashboard</Link>\\n            <Link href=\"/login\" className=\"bg-blue-600 text-white px-4 py-2 rounded\">Login</Link>\\n          </div>\\n        </div>\\n      </nav>\\n      \\n      <div className=\"max-w-7xl mx-auto px-4 py-8\">\\n        <h1 className=\"text-3xl font-bold mb-8\">All Courses</h1>\\n        \\n        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\\n          {courses.map(course => (\\n            <div key={course.id} className=\"bg-white rounded-lg shadow border p-6\">\\n              <div className=\"h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded mb-4 flex items-center justify-center\">\\n                <span className=\"text-white text-4xl\">🎓</span>\\n              </div>\\n              <h3 className=\"text-lg font-bold mb-2\">{course.title}</h3>\\n              <p className=\"text-gray-600 mb-4\">by {course.instructor}</p>\\n              <div className=\"flex justify-between items-center mb-4\">\\n                <div className=\"flex items-center text-sm text-gray-500\">\\n                  <Star className=\"h-4 w-4 text-yellow-400 mr-1\" />{course.rating}\\n                  <Users className=\"h-4 w-4 ml-3 mr-1\" />{course.students.toLocaleString()}\\n                </div>\\n                <div className=\"text-xl font-bold text-blue-600\">${course.price}</div>\\n              </div>\\n              <button className=\"w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700\">\\n                Enroll Now\\n              </button>\\n            </div>\\n          ))}\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}'
        },
        {
          path: 'src/app/dashboard',
          type: 'directory'
        },
        {
          path: 'src/app/dashboard/page.tsx',
          type: 'file',
          content: 'import Link from \"next/link\";\\nimport { BookOpen, Play, Clock, Award } from \"lucide-react\";\\n\\nexport default function DashboardPage() {\\n  return (\\n    <div className=\"min-h-screen bg-gray-50\">\\n      <nav className=\"bg-white shadow-sm border-b\">\\n        <div className=\"max-w-7xl mx-auto px-4 h-16 flex justify-between items-center\">\\n          <Link href=\"/\" className=\"flex items-center\">\\n            <BookOpen className=\"h-8 w-8 text-blue-600\" />\\n            <span className=\"ml-2 text-2xl font-bold\">📚 EduPlatform</span>\\n          </Link>\\n          <div className=\"flex items-center space-x-4\">\\n            <Link href=\"/courses\" className=\"text-gray-700 hover:text-blue-600\">Courses</Link>\\n            <div className=\"flex items-center space-x-2\">\\n              <div className=\"w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center\">\\n                <span className=\"text-white text-sm\">JD</span>\\n              </div>\\n              <span>John Doe</span>\\n            </div>\\n          </div>\\n        </div>\\n      </nav>\\n      \\n      <div className=\"max-w-7xl mx-auto px-4 py-8\">\\n        <h1 className=\"text-3xl font-bold mb-2\">Welcome back, John! 👋</h1>\\n        <p className=\"text-gray-600 mb-8\">Ready to continue learning?</p>\\n        \\n        <div className=\"grid grid-cols-4 gap-6 mb-8\">\\n          <div className=\"bg-white p-6 rounded-lg shadow border\">\\n            <BookOpen className=\"h-8 w-8 text-blue-600 mb-2\" />\\n            <div className=\"text-2xl font-bold\">3</div>\\n            <div className=\"text-gray-600\">Enrolled</div>\\n          </div>\\n          <div className=\"bg-white p-6 rounded-lg shadow border\">\\n            <Award className=\"h-8 w-8 text-green-600 mb-2\" />\\n            <div className=\"text-2xl font-bold\">1</div>\\n            <div className=\"text-gray-600\">Completed</div>\\n          </div>\\n          <div className=\"bg-white p-6 rounded-lg shadow border\">\\n            <Clock className=\"h-8 w-8 text-blue-600 mb-2\" />\\n            <div className=\"text-2xl font-bold\">127</div>\\n            <div className=\"text-gray-600\">Hours</div>\\n          </div>\\n          <div className=\"bg-white p-6 rounded-lg shadow border\">\\n            <div className=\"text-2xl font-bold\">12</div>\\n            <div className=\"text-gray-600\">Day Streak</div>\\n          </div>\\n        </div>\\n        \\n        <div className=\"bg-white rounded-lg shadow border p-6\">\\n          <h2 className=\"text-xl font-bold mb-4\">Continue Learning</h2>\\n          <div className=\"flex items-center justify-between p-4 bg-gray-50 rounded\">\\n            <div className=\"flex items-center space-x-4\">\\n              <div className=\"w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center\">\\n                <Play className=\"h-6 w-6 text-white\" />\\n              </div>\\n              <div>\\n                <div className=\"font-bold\">Web Development Bootcamp</div>\\n                <div className=\"text-sm text-gray-600\">by Sarah Johnson • 75% complete</div>\\n              </div>\\n            </div>\\n            <button className=\"bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700\">Continue</button>\\n          </div>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}'
        },
        {
          path: 'src/app/login',
          type: 'directory'
        },
        {
          path: 'src/app/login/page.tsx',
          type: 'file',
          content: 'import Link from \"next/link\";\\nimport { BookOpen, Mail, Lock } from \"lucide-react\";\\n\\nexport default function LoginPage() {\\n  return (\\n    <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">\\n      <div className=\"max-w-md w-full\">\\n        <div className=\"text-center mb-8\">\\n          <Link href=\"/\" className=\"flex items-center justify-center mb-4\">\\n            <BookOpen className=\"h-10 w-10 text-blue-600\" />\\n            <span className=\"ml-2 text-3xl font-bold\">📚 EduPlatform</span>\\n          </Link>\\n          <h2 className=\"text-2xl font-bold\">Welcome back!</h2>\\n        </div>\\n        \\n        <div className=\"bg-white p-8 rounded-lg shadow border\">\\n          <div className=\"mb-4 p-3 bg-blue-50 rounded text-sm\">\\n            <strong>Demo:</strong> student@demo.com / demo123\\n          </div>\\n          \\n          <form className=\"space-y-4\">\\n            <div>\\n              <label className=\"block text-sm font-medium mb-2\">Email</label>\\n              <div className=\"relative\">\\n                <Mail className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400\" />\\n                <input\\n                  type=\"email\"\\n                  className=\"w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500\"\\n                  placeholder=\"Enter email\"\\n                />\\n              </div>\\n            </div>\\n            <div>\\n              <label className=\"block text-sm font-medium mb-2\">Password</label>\\n              <div className=\"relative\">\\n                <Lock className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400\" />\\n                <input\\n                  type=\"password\"\\n                  className=\"w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500\"\\n                  placeholder=\"Enter password\"\\n                />\\n              </div>\\n            </div>\\n            <button\\n              type=\"submit\"\\n              className=\"w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700\"\\n            >\\n              Sign In\\n            </button>\\n          </form>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}'
        }
      ])
    });
}