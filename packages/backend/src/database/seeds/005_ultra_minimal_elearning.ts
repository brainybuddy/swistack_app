import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Update with ultra-minimal template to avoid HTTP 431
  await knex('project_templates')
    .where('key', 'elearning-fullstack')
    .update({
      description: 'Modern e-learning platform with Next.js and Tailwind CSS',
      files: JSON.stringify([
        {
          path: 'package.json',
          type: 'file',
          content: '{\\n  \"name\": \"eduplatform\",\\n  \"scripts\": { \"dev\": \"next dev\", \"build\": \"next build\" },\\n  \"dependencies\": { \"next\": \"^14.0.4\", \"react\": \"^18.2.0\", \"tailwindcss\": \"^3.4.0\", \"lucide-react\": \"^0.400.0\" }\\n}'
        },
        {
          path: 'next.config.js',
          type: 'file',
          content: 'module.exports = { experimental: { appDir: true } };'
        },
        {
          path: 'tailwind.config.js',
          type: 'file',
          content: 'module.exports = { content: [\"./src/**/*.{js,jsx,ts,tsx}\"], theme: {}, plugins: [] };'
        },
        {
          path: 'src/app/layout.tsx',
          type: 'file',
          content: 'import \"./globals.css\";\\nexport default function RootLayout({ children }) {\\n  return <html><body className=\"bg-gray-50\">{children}</body></html>;\\n}'
        },
        {
          path: 'src/app/page.tsx',
          type: 'file',
          content: 'import Link from \"next/link\";\\nexport default function Home() {\\n  return (\\n    <div className=\"min-h-screen\">\\n      <nav className=\"bg-white shadow p-4\">\\n        <div className=\"flex justify-between items-center\">\\n          <h1 className=\"text-2xl font-bold text-blue-600\">📚 EduPlatform</h1>\\n          <div className=\"space-x-4\">\\n            <Link href=\"/courses\" className=\"text-gray-600\">Courses</Link>\\n            <Link href=\"/dashboard\" className=\"text-gray-600\">Dashboard</Link>\\n            <Link href=\"/login\" className=\"bg-blue-600 text-white px-4 py-2 rounded\">Login</Link>\\n          </div>\\n        </div>\\n      </nav>\\n      <div className=\"bg-blue-600 text-white py-20 text-center\">\\n        <h2 className=\"text-5xl font-bold mb-4\">Learn Without Limits</h2>\\n        <p className=\"text-xl mb-8\">Transform your career with expert courses</p>\\n        <Link href=\"/courses\" className=\"bg-white text-blue-600 px-6 py-3 rounded font-semibold\">Get Started</Link>\\n      </div>\\n      <div className=\"py-16 bg-white\">\\n        <div className=\"max-w-6xl mx-auto grid grid-cols-4 gap-8 text-center\">\\n          <div><div className=\"text-3xl font-bold text-blue-600\">10K+</div><div>Students</div></div>\\n          <div><div className=\"text-3xl font-bold text-blue-600\">500+</div><div>Courses</div></div>\\n          <div><div className=\"text-3xl font-bold text-blue-600\">100+</div><div>Instructors</div></div>\\n          <div><div className=\"text-3xl font-bold text-blue-600\">98%</div><div>Success</div></div>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}'
        },
        {
          path: 'src/app/globals.css',
          type: 'file',
          content: '@tailwind base; @tailwind components; @tailwind utilities;'
        },
        {
          path: 'src/app/courses/page.tsx',
          type: 'file',
          content: 'import Link from \"next/link\";\\nconst courses = [{id:1,title:\"Web Dev Bootcamp\",price:89},{id:2,title:\"Data Science\",price:99}];\\nexport default function Courses() {\\n  return (\\n    <div className=\"min-h-screen bg-gray-50\">\\n      <nav className=\"bg-white shadow p-4\">\\n        <Link href=\"/\" className=\"text-2xl font-bold text-blue-600\">📚 EduPlatform</Link>\\n      </nav>\\n      <div className=\"max-w-6xl mx-auto p-8\">\\n        <h1 className=\"text-3xl font-bold mb-8\">All Courses</h1>\\n        <div className=\"grid gap-6\">\\n          {courses.map(c => (\\n            <div key={c.id} className=\"bg-white p-6 rounded shadow border\">\\n              <h3 className=\"text-xl font-bold mb-2\">{c.title}</h3>\\n              <div className=\"flex justify-between items-center\">\\n                <span className=\"text-2xl font-bold text-blue-600\">${c.price}</span>\\n                <button className=\"bg-blue-600 text-white px-4 py-2 rounded\">Enroll</button>\\n              </div>\\n            </div>\\n          ))}\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}'
        },
        {
          path: 'src/app/dashboard/page.tsx',
          type: 'file',
          content: 'import Link from \"next/link\";\\nexport default function Dashboard() {\\n  return (\\n    <div className=\"min-h-screen bg-gray-50\">\\n      <nav className=\"bg-white shadow p-4\">\\n        <div className=\"flex justify-between items-center\">\\n          <Link href=\"/\" className=\"text-2xl font-bold text-blue-600\">📚 EduPlatform</Link>\\n          <div className=\"flex items-center space-x-2\">\\n            <div className=\"w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm\">JD</div>\\n            <span>John Doe</span>\\n          </div>\\n        </div>\\n      </nav>\\n      <div className=\"max-w-6xl mx-auto p-8\">\\n        <h1 className=\"text-3xl font-bold mb-2\">Welcome back, John! 👋</h1>\\n        <p className=\"text-gray-600 mb-8\">Continue your learning journey</p>\\n        <div className=\"grid grid-cols-4 gap-6 mb-8\">\\n          <div className=\"bg-white p-6 rounded shadow\"><div className=\"text-2xl font-bold text-blue-600\">3</div><div>Enrolled</div></div>\\n          <div className=\"bg-white p-6 rounded shadow\"><div className=\"text-2xl font-bold text-green-600\">1</div><div>Completed</div></div>\\n          <div className=\"bg-white p-6 rounded shadow\"><div className=\"text-2xl font-bold\">127</div><div>Hours</div></div>\\n          <div className=\"bg-white p-6 rounded shadow\"><div className=\"text-2xl font-bold\">12</div><div>Streak</div></div>\\n        </div>\\n        <div className=\"bg-white p-6 rounded shadow\">\\n          <h2 className=\"text-xl font-bold mb-4\">Continue Learning</h2>\\n          <div className=\"flex justify-between items-center p-4 bg-gray-50 rounded\">\\n            <div>\\n              <div className=\"font-bold\">Web Development Bootcamp</div>\\n              <div className=\"text-sm text-gray-600\">75% complete</div>\\n            </div>\\n            <button className=\"bg-blue-600 text-white px-4 py-2 rounded\">Continue</button>\\n          </div>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}'
        },
        {
          path: 'src/app/login/page.tsx',
          type: 'file',
          content: 'import Link from \"next/link\";\\nexport default function Login() {\\n  return (\\n    <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">\\n      <div className=\"max-w-md w-full\">\\n        <div className=\"text-center mb-8\">\\n          <Link href=\"/\" className=\"text-3xl font-bold text-blue-600\">📚 EduPlatform</Link>\\n          <h2 className=\"text-2xl font-bold mt-4\">Welcome back!</h2>\\n        </div>\\n        <div className=\"bg-white p-8 rounded shadow\">\\n          <div className=\"mb-4 p-3 bg-blue-50 rounded text-sm\">\\n            <strong>Demo:</strong> student@demo.com / demo123\\n          </div>\\n          <form className=\"space-y-4\">\\n            <div>\\n              <label className=\"block text-sm font-medium mb-2\">Email</label>\\n              <input type=\"email\" className=\"w-full p-2 border rounded\" placeholder=\"Enter email\" />\\n            </div>\\n            <div>\\n              <label className=\"block text-sm font-medium mb-2\">Password</label>\\n              <input type=\"password\" className=\"w-full p-2 border rounded\" placeholder=\"Enter password\" />\\n            </div>\\n            <button className=\"w-full bg-blue-600 text-white py-2 rounded\">Sign In</button>\\n          </form>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}'
        }
      ])
    });
}