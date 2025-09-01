import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Insert comprehensive but compact SaaS Landing Page template
  await knex('project_templates').insert([
    {
      name: 'SaaS Landing Page',
      key: 'saas-landing',
      description: 'Complete SaaS landing page with auth, dashboard, pricing, and essential pages',
      category: 'fullstack',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.4',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.3.2',
        'tailwindcss': '^3.4.0',
        'lucide-react': '^0.400.0'
      }),
      scripts: JSON.stringify({
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
        'lint': 'next lint'
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
        features: ['authentication', 'dashboard', 'pricing', 'responsive-design']
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'package.json',
          type: 'file',
          content: `{
  "name": "saas-landing",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.2",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.400.0"
  }
}`
        },
        {
          path: 'next.config.js',
          type: 'file',
          content: `module.exports = {
  experimental: { appDir: true }
}`
        },
        {
          path: 'tailwind.config.js',
          type: 'file',
          content: `module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 500: '#3b82f6', 600: '#2563eb' }
      }
    }
  }
}`
        },
        {
          path: 'src/app/layout.tsx',
          type: 'file',
          content: `import './globals.css'

export const metadata = {
  title: 'CloudSync Pro - SaaS Platform',
  description: 'Streamline your workflow with our powerful SaaS platform'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`
        },
        {
          path: 'src/app/globals.css',
          type: 'file',
          content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
        },
        {
          path: 'src/app/page.tsx',
          type: 'file',
          content: `import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, Shield, BarChart3, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <span className="text-2xl font-bold text-primary-600">☁️ CloudSync Pro</span>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-primary-600">Sign In</Link>
            <Link href="/signup" className="bg-primary-600 text-white px-4 py-2 rounded-md">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your <span className="text-primary-600">Workflow</span> Today
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            CloudSync Pro helps teams collaborate seamlessly with powerful project management, 
            real-time sync, and intelligent automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/demo" className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg text-lg font-semibold">
              Watch Demo
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ✅ 14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <Zap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-gray-600">Blazing-fast performance with optimized cloud infrastructure.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-gray-600">Enterprise-grade security with end-to-end encryption.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Smart Analytics</h3>
              <p className="text-gray-600">Actionable insights with advanced analytics tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Trusted by 10,000+ teams worldwide</h2>
          <div className="flex justify-center items-center space-x-2 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
            <span className="text-lg font-semibold ml-2">4.9/5 from 2,500+ reviews</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-gray-700 mb-4">"CloudSync Pro transformed how our team collaborates. We've increased productivity by 40%."</p>
              <div className="font-semibold">Sarah Miller, CEO TechStart Inc.</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-gray-700 mb-4">"The best project management tool we've ever used. Intuitive, powerful, and reliable."</p>
              <div className="font-semibold">James Davis, CTO Innovation Labs</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-gray-700 mb-4">"Customer support is incredible. They helped us migrate seamlessly."</p>
              <div className="font-semibold">Lisa Wang, Director Creative Agency</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-xl text-primary-100 mb-8">Join thousands of teams using CloudSync Pro</p>
          <Link href="/signup" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center">
            Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold text-white">☁️ CloudSync Pro</span>
              <p className="mt-4 text-gray-400">Streamline your workflow with our powerful SaaS platform.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; 2024 CloudSync Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}`
        },
        {
          path: 'src/app/login/page.tsx',
          type: 'file',
          content: `import Link from 'next/link'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary-600">☁️ CloudSync Pro</Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials</h3>
            <p className="text-sm text-blue-800">
              Email: demo@cloudsync.com<br />
              Password: demo123
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                <label className="ml-2 text-sm text-gray-900">Remember me</label>
              </div>
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
                Forgot password?
              </Link>
            </div>

            <Link href="/dashboard" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 font-medium">
              Sign in <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up for free
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}`
        },
        {
          path: 'src/app/signup/page.tsx',
          type: 'file',
          content: `import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary-600">☁️ CloudSync Pro</Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">Start your 14-day free trial today</p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">What's included:</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500 mr-2" />14-day free trial
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500 mr-2" />No credit card required
              </li>
            </ul>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your work email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" required className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
              <label className="ml-2 text-sm text-gray-900">
                I agree to the <Link href="/terms" className="text-primary-600">Terms</Link> and <Link href="/privacy" className="text-primary-600">Privacy Policy</Link>
              </label>
            </div>

            <Link href="/dashboard" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 font-medium">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}`
        },
        {
          path: 'src/app/dashboard/page.tsx',
          type: 'file',
          content: `import Link from 'next/link'
import { Bell, Search, BarChart3, Users, Calendar, Plus } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary-600">☁️ CloudSync Pro</Link>
          <div className="flex items-center space-x-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Bell className="h-5 w-5 text-gray-400" />
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">JD</div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, John! 👋</h1>
          <p className="text-gray-600">Here's what's happening with your team today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">24</p>
                <p className="text-sm text-gray-600">Active Projects</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">↗ +12% from last month</span>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">142</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">↗ +8% from last month</span>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">18</p>
                <p className="text-sm text-gray-600">Due This Week</p>
              </div>
            </div>
            <span className="text-sm text-orange-600 font-medium">3 overdue tasks</span>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">92%</div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">92%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">↗ +3% from last month</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { name: 'Website Redesign', progress: 75, status: 'In Progress' },
                { name: 'Mobile App Launch', progress: 90, status: 'Review' },
                { name: 'Marketing Campaign', progress: 25, status: 'Planning' }
              ].map((project, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-sm text-gray-500">{project.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 bg-primary-600 rounded-full" style={{width: \`\${project.progress}%\`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Team Activity</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { user: 'Sarah Miller', action: 'completed task "Design review"', time: '2h ago' },
                { user: 'Mike Johnson', action: 'uploaded file "wireframes.pdf"', time: '4h ago' },
                { user: 'Emily Davis', action: 'commented on "API Documentation"', time: '6h ago' }
              ].map((activity, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm"><span className="font-medium">{activity.user}</span> {activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50">
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium">New Project</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50">
              <Users className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium">Invite Team</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50">
              <BarChart3 className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium">View Reports</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50">
              <Calendar className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium">Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}`
        }
      ]),
      icon: '🚀',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    }
  ]);
  
  console.log('✅ SaaS Landing Page template added to database');
}