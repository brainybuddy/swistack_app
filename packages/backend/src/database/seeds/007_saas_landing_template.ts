import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Insert comprehensive SaaS Landing Page template
  await knex('project_templates').insert([
    {
      name: 'SaaS Landing Page',
      key: 'saas-landing',
      description: 'Complete SaaS landing page with auth, dashboard, pricing, and all essential pages',
      category: 'fullstack',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.4',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.3.2',
        'tailwindcss': '^3.4.0',
        'lucide-react': '^0.400.0',
        '@headlessui/react': '^1.7.17',
        'framer-motion': '^10.16.4'
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
        features: ['authentication', 'dashboard', 'pricing', 'responsive-design', 'modern-ui']
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        // Configuration files
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
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.2",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.400.0",
    "@headlessui/react": "^1.7.17",
    "framer-motion": "^10.16.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}`
        },
        {
          path: 'next.config.js',
          type: 'file',
          content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
}

module.exports = nextConfig`
        },
        {
          path: 'tailwind.config.js',
          type: 'file',
          content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        accent: {
          500: '#10b981',
          600: '#059669',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      }
    },
  },
  plugins: [],
}`
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

        // App structure
        {
          path: 'src',
          type: 'directory'
        },
        {
          path: 'src/app',
          type: 'directory'
        },

        // Layout and globals
        {
          path: 'src/app/layout.tsx',
          type: 'file',
          content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CloudSync Pro - SaaS Platform',
  description: 'Streamline your workflow with our powerful SaaS platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out;
}`
        },

        // Landing page
        {
          path: 'src/app/page.tsx',
          type: 'file',
          content: `import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, Shield, BarChart3, Users, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-primary-600">☁️ CloudSync Pro</span>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <Link href="/features" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Features</Link>
                  <Link href="/pricing" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Pricing</Link>
                  <Link href="/about" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">About</Link>
                  <Link href="/contact" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Contact</Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Sign In</Link>
              <Link href="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your
              <span className="text-primary-600"> Workflow </span>
              Today
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              CloudSync Pro helps teams collaborate seamlessly with powerful project management, 
              real-time sync, and intelligent automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center">
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help your team work smarter, not harder
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600">Experience blazing-fast performance with our optimized cloud infrastructure.</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600">Enterprise-grade security with end-to-end encryption and SOC 2 compliance.</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Analytics</h3>
              <p className="text-gray-600">Get actionable insights with our advanced analytics and reporting tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by 10,000+ teams worldwide</h2>
            <div className="flex items-center justify-center space-x-2 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
              <span className="text-lg font-semibold text-gray-900 ml-2">4.9/5</span>
              <span className="text-gray-600">from 2,500+ reviews</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">"CloudSync Pro transformed how our team collaborates. We've increased productivity by 40% since switching."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  SM
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Sarah Miller</p>
                  <p className="text-sm text-gray-600">CEO, TechStart Inc.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">"The best project management tool we've ever used. Intuitive, powerful, and reliable."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">James Davis</p>
                  <p className="text-sm text-gray-600">CTO, Innovation Labs</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">"Customer support is incredible. They helped us migrate our entire workflow seamlessly."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  LW
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Lisa Wang</p>
                  <p className="text-sm text-gray-600">Director, Creative Agency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using CloudSync Pro to streamline their workflow
          </p>
          <Link href="/signup" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center">
            Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold text-white">☁️ CloudSync Pro</span>
              <p className="mt-4 text-gray-400">
                Streamline your workflow with our powerful SaaS platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
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

        // Authentication pages directory
        {
          path: 'src/app/login',
          type: 'directory'
        },

        // Login page
        {
          path: 'src/app/login/page.tsx',
          type: 'file',
          content: `import Link from 'next/link'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary-600">☁️ CloudSync Pro</Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account to continue</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Demo credentials */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials</h3>
            <p className="text-sm text-blue-800">
              <strong>Email:</strong> demo@cloudsync.com<br />
              <strong>Password:</strong> demo123
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your password"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <Link href="/dashboard" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Sign in
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span>Continue with Google</span>
              </button>
            </div>
          </div>

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

        // Signup page
        {
          path: 'src/app/signup',
          type: 'directory'
        },
        {
          path: 'src/app/signup/page.tsx',
          type: 'file',
          content: `import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary-600">☁️ CloudSync Pro</Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">Start your 14-day free trial today</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Benefits */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">What's included:</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                14-day free trial
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                No credit card required
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                Cancel anytime
              </li>
            </ul>
          </div>

          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1 relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your full name"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Work email
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your work email"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Create a strong password"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Must be at least 8 characters with letters and numbers
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <Link href="/dashboard" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}`
        },

        // Dashboard
        {
          path: 'src/app/dashboard',
          type: 'directory'
        },
        {
          path: 'src/app/dashboard/page.tsx',
          type: 'file',
          content: `import Link from 'next/link'
import { Bell, Search, Settings, Users, BarChart3, Calendar, Plus, ChevronDown } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">☁️ CloudSync Pro</Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <Link href="/dashboard" className="text-primary-600 bg-primary-50 px-3 py-2 text-sm font-medium rounded-md">Dashboard</Link>
                  <Link href="/projects" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Projects</Link>
                  <Link href="/team" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Team</Link>
                  <Link href="/reports" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Reports</Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  JD
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, John! 👋</h1>
          <p className="text-gray-600">Here's what's happening with your team today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">24</p>
                <p className="text-sm text-gray-600">Active Projects</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">↗ +12% from last month</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">142</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">↗ +8% from last month</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">18</p>
                <p className="text-sm text-gray-600">Due This Week</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-orange-600 font-medium">3 overdue tasks</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  92%
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">92%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">↗ +3% from last month</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                <Link href="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                { name: 'Website Redesign', status: 'In Progress', progress: 75, color: 'bg-blue-500' },
                { name: 'Mobile App Launch', status: 'Review', progress: 90, color: 'bg-green-500' },
                { name: 'Marketing Campaign', status: 'Planning', progress: 25, color: 'bg-yellow-500' },
                { name: 'API Integration', status: 'In Progress', progress: 60, color: 'bg-purple-500' }
              ].map((project, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                    <span className="text-xs text-gray-500">{project.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={\`h-2 rounded-full \${project.color}\`}
                      style={{ width: \`\${project.progress}%\` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{project.progress}% complete</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Activity */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Activity</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { user: 'Sarah Miller', action: 'completed task "Design review"', time: '2 hours ago', avatar: 'SM' },
                { user: 'Mike Johnson', action: 'uploaded file "wireframes.pdf"', time: '4 hours ago', avatar: 'MJ' },
                { user: 'Emily Davis', action: 'commented on "API Documentation"', time: '6 hours ago', avatar: 'ED' },
                { user: 'Alex Chen', action: 'created project "Q1 Planning"', time: '1 day ago', avatar: 'AC' }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {activity.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">New Project</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <Users className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Invite Team</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <BarChart3 className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">View Reports</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <Settings className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Settings</span>
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