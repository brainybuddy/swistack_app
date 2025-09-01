import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Delete ALL existing templates to force clean state
  await knex('project_templates').truncate();

  // Insert default templates
  await knex('project_templates').insert([
    {
      name: 'React App',
      key: 'react',
      description: 'A modern React application with TypeScript, Tailwind CSS, and Vite',
      category: 'frontend',
      language: 'typescript',
      framework: 'react',
      dependencies: JSON.stringify({
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'typescript': '^5.0.0',
        'vite': '^4.4.0',
        '@vitejs/plugin-react': '^4.0.0',
        'tailwindcss': '^3.3.0',
      }),
      scripts: JSON.stringify({
        'dev': 'vite',
        'build': 'tsc && vite build',
        'preview': 'vite preview',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'package.json',
          type: 'file',
          content: '{\n  "name": "react-app",\n  "private": true,\n  "version": "0.0.0"\n}'
        },
        {
          path: 'src',
          type: 'directory'
        },
        {
          path: 'src/App.tsx',
          type: 'file',
          content: 'import React from "react";\n\nfunction App() {\n  return <div>Hello React!</div>;\n}\n\nexport default App;'
        }
      ]),
      icon: '⚛️',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'Node.js Express API',
      key: 'nodejs-express',
      description: 'RESTful API with Express.js, TypeScript, and PostgreSQL',
      category: 'backend',
      language: 'typescript',
      framework: 'express',
      dependencies: JSON.stringify({
        'express': '^4.18.2',
        'cors': '^2.8.5',
        'helmet': '^7.0.0',
        'dotenv': '^16.3.1',
        'typescript': '^5.1.0',
      }),
      scripts: JSON.stringify({
        'start': 'node dist/server.js',
        'dev': 'PORT=3002 nodemon --exec ts-node src/server.ts',
        'build': 'tsc',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'src',
          type: 'directory'
        },
        {
          path: 'src/server.ts',
          type: 'file',
          content: 'import express from "express";\nimport cors from "cors";\nimport helmet from "helmet";\nimport dotenv from "dotenv";\n\ndotenv.config();\n\nconst app = express();\nconst PORT = process.env.PORT || 3002;\n\n// Middleware\napp.use(helmet());\napp.use(cors());\napp.use(express.json());\napp.use(express.urlencoded({ extended: true }));\n\n// Routes\napp.get("/", (req, res) => {\n  res.json({\n    message: "Welcome to SwiStack Express API",\n    version: "1.0.0",\n    endpoints: {\n      health: "/health",\n      users: "/api/users",\n      posts: "/api/posts"\n    },\n    timestamp: new Date().toISOString()\n  });\n});\n\napp.get("/health", (req, res) => {\n  res.json({\n    status: "healthy",\n    uptime: process.uptime(),\n    timestamp: new Date().toISOString(),\n    environment: process.env.NODE_ENV || "development"\n  });\n});\n\n// API Routes\napp.get("/api/users", (req, res) => {\n  res.json({\n    users: [\n      { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },\n      { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user" },\n      { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "user" }\n    ],\n    total: 3,\n    page: 1\n  });\n});\n\napp.get("/api/users/:id", (req, res) => {\n  const userId = parseInt(req.params.id);\n  const users = [\n    { id: 1, name: "John Doe", email: "john@example.com", role: "admin", createdAt: "2024-01-15" },\n    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user", createdAt: "2024-02-20" },\n    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "user", createdAt: "2024-03-10" }\n  ];\n  \n  const user = users.find(u => u.id === userId);\n  if (!user) {\n    return res.status(404).json({ error: "User not found" });\n  }\n  \n  res.json({ user });\n});\n\napp.post("/api/users", (req, res) => {\n  const { name, email, role } = req.body;\n  \n  if (!name || !email) {\n    return res.status(400).json({ error: "Name and email are required" });\n  }\n  \n  const newUser = {\n    id: Math.floor(Math.random() * 1000) + 4,\n    name,\n    email,\n    role: role || "user",\n    createdAt: new Date().toISOString().split("T")[0]\n  };\n  \n  res.status(201).json({ message: "User created successfully", user: newUser });\n});\n\napp.get("/api/posts", (req, res) => {\n  res.json({\n    posts: [\n      {\n        id: 1,\n        title: "Getting Started with Express.js",\n        content: "Express.js is a minimal and flexible Node.js web application framework...",\n        author: "John Doe",\n        publishedAt: "2024-01-15",\n        tags: ["nodejs", "express", "tutorial"]\n      },\n      {\n        id: 2,\n        title: "Building RESTful APIs",\n        content: "REST (Representational State Transfer) is an architectural style for designing web services...",\n        author: "Jane Smith", \n        publishedAt: "2024-02-20",\n        tags: ["api", "rest", "backend"]\n      },\n      {\n        id: 3,\n        title: "Database Integration with PostgreSQL",\n        content: "PostgreSQL is a powerful, open source object-relational database system...",\n        author: "Bob Johnson",\n        publishedAt: "2024-03-10",\n        tags: ["database", "postgresql", "sql"]\n      }\n    ],\n    total: 3,\n    page: 1\n  });\n});\n\napp.get("/api/posts/:id", (req, res) => {\n  const postId = parseInt(req.params.id);\n  const posts = [\n    {\n      id: 1,\n      title: "Getting Started with Express.js",\n      content: "Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It facilitates the rapid development of Node based Web applications.",\n      author: "John Doe",\n      publishedAt: "2024-01-15",\n      tags: ["nodejs", "express", "tutorial"],\n      views: 1250,\n      likes: 45\n    },\n    {\n      id: 2,\n      title: "Building RESTful APIs",\n      content: "REST (Representational State Transfer) is an architectural style for designing web services. It uses standard HTTP methods like GET, POST, PUT, and DELETE to perform operations on resources.",\n      author: "Jane Smith",\n      publishedAt: "2024-02-20", \n      tags: ["api", "rest", "backend"],\n      views: 890,\n      likes: 32\n    },\n    {\n      id: 3,\n      title: "Database Integration with PostgreSQL",\n      content: "PostgreSQL is a powerful, open source object-relational database system with over 30 years of active development. It has earned a strong reputation for reliability, feature robustness, and performance.",\n      author: "Bob Johnson",\n      publishedAt: "2024-03-10",\n      tags: ["database", "postgresql", "sql"],\n      views: 650,\n      likes: 28\n    }\n  ];\n  \n  const post = posts.find(p => p.id === postId);\n  if (!post) {\n    return res.status(404).json({ error: "Post not found" });\n  }\n  \n  res.json({ post });\n});\n\n// Error handling middleware\napp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {\n  console.error(err.stack);\n  res.status(500).json({ error: "Something went wrong!" });\n});\n\n// 404 handler\napp.use("*", (req, res) => {\n  res.status(404).json({ error: "Route not found" });\n});\n\napp.listen(PORT, () => {\n  console.log(`🚀 SwiStack Express API Server running on port ${PORT}`);\n  console.log(`📊 Health check: http://localhost:${PORT}/health`);\n  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);\n  console.log(`📝 Posts API: http://localhost:${PORT}/api/posts`);\n});'
        }
      ]),
      icon: '🚀',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'Python Flask API',
      key: 'python-flask',
      description: 'RESTful API with Flask and SQLAlchemy',
      category: 'backend',
      language: 'python',
      framework: 'flask',
      dependencies: JSON.stringify({
        'Flask': '^2.3.0',
        'Flask-SQLAlchemy': '^3.0.0',
        'Flask-CORS': '^4.0.0',
      }),
      scripts: JSON.stringify({
        'start': 'python app.py',
        'dev': 'flask --app app.py --debug run --port 3002',
      }),
      config: JSON.stringify({
        pythonVersion: '3.11',
        packageManager: 'pip',
      }),
      dockerImage: 'python:3.11-alpine',
      files: JSON.stringify([
        {
          path: 'app.py',
          type: 'file',
          content: 'from flask import Flask, jsonify\n\napp = Flask(__name__)\n\n@app.route("/")\ndef hello():\n    return jsonify({"message": "Hello Flask!"})\n\nif __name__ == "__main__":\n    app.run(debug=True)'
        },
        {
          path: 'requirements.txt',
          type: 'file',
          content: 'Flask==2.3.0\nFlask-CORS==4.0.0'
        }
      ]),
      icon: '🐍',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'Next.js Full-stack',
      key: 'nextjs-fullstack',
      description: 'Full-stack Next.js application with API routes',
      category: 'fullstack',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.1.0',
      }),
      scripts: JSON.stringify({
        'dev': 'next dev -p 3003',
        'build': 'next build',
        'start': 'next start -p 3003',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'package.json',
          type: 'file',
          content: '{\n  \"name\": \"nextjs-fullstack\",\n  \"version\": \"0.1.0\",\n  \"private\": true,\n  \"scripts\": {\n    \"dev\": \"next dev\",\n    \"build\": \"next build\",\n    \"start\": \"next start\",\n    \"lint\": \"next lint\"\n  },\n  \"dependencies\": {\n    \"next\": \"14.0.0\",\n    \"react\": \"^18\",\n    \"react-dom\": \"^18\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5\",\n    \"@types/node\": \"^20\",\n    \"@types/react\": \"^18\",\n    \"@types/react-dom\": \"^18\",\n    \"autoprefixer\": \"^10.0.1\",\n    \"postcss\": \"^8\",\n    \"tailwindcss\": \"^3.3.0\",\n    \"eslint\": \"^8\",\n    \"eslint-config-next\": \"14.0.0\"\n  }\n}'
        },
        {
          path: 'next.config.js',
          type: 'file',
          content: '/** @type {import(\"next\").NextConfig} */\nconst nextConfig = {\n  experimental: {\n    appDir: true,\n  },\n}\n\nmodule.exports = nextConfig'
        },
        {
          path: 'tailwind.config.js',
          type: 'file',
          content: '/** @type {import(\"tailwindcss\").Config} */\nmodule.exports = {\n  content: [\n    \"./pages/**/*.{js,ts,jsx,tsx,mdx}\",\n    \"./components/**/*.{js,ts,jsx,tsx,mdx}\",\n    \"./app/**/*.{js,ts,jsx,tsx,mdx}\",\n  ],\n  theme: {\n    extend: {\n      backgroundImage: {\n        \"gradient-radial\": \"radial-gradient(var(--tw-gradient-stops))\",\n        \"gradient-conic\": \"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))\",\n      },\n    },\n  },\n  plugins: [],\n}'
        },
        {
          path: 'app',
          type: 'directory'
        },
        {
          path: 'app/page.tsx',
          type: 'file',
          content: 'export default function Home() {\n  return (\n    <main className="flex min-h-screen flex-col items-center justify-center p-24">\n      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">\n        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">\n          Welcome to Next.js!\n        </h1>\n        <p className="text-xl text-gray-600 mb-8">\n          Build fast, modern web applications with React Server Components\n        </p>\n        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">\n          <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">\n            <h3 className="text-lg font-semibold mb-2">📚 Documentation</h3>\n            <p className="text-gray-600">Learn about Next.js features and API.</p>\n          </div>\n          <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">\n            <h3 className="text-lg font-semibold mb-2">🚀 Deploy</h3>\n            <p className="text-gray-600">Deploy your Next.js app with Vercel.</p>\n          </div>\n        </div>\n      </div>\n    </main>\n  );\n}'
        },
        {
          path: 'app/layout.tsx',
          type: 'file',
          content: 'import type { Metadata } from \"next\";\nimport { Inter } from \"next/font/google\";\nimport \"./globals.css\";\n\nconst inter = Inter({ subsets: [\"latin\"] });\n\nexport const metadata: Metadata = {\n  title: \"Next.js Full-stack App\",\n  description: \"Built with SwiStack\",\n};\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <html lang=\"en\">\n      <body className={inter.className}>{children}</body>\n    </html>\n  );\n}'
        },
        {
          path: 'app/globals.css',
          type: 'file',
          content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --foreground-rgb: 0, 0, 0;\n  --background-start-rgb: 214, 219, 220;\n  --background-end-rgb: 255, 255, 255;\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    --foreground-rgb: 255, 255, 255;\n    --background-start-rgb: 0, 0, 0;\n    --background-end-rgb: 0, 0, 0;\n  }\n}\n\nbody {\n  color: rgb(var(--foreground-rgb));\n  background: linear-gradient(\n      to bottom,\n      transparent,\n      rgb(var(--background-end-rgb))\n    )\n    rgb(var(--background-start-rgb));\n}'
        }
      ]),
      icon: '▲',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'Vue.js App',
      key: 'vue',
      description: 'Modern Vue.js application with TypeScript',
      category: 'frontend',
      language: 'typescript',
      framework: 'vue',
      dependencies: JSON.stringify({
        'vue': '^3.3.0',
        '@vitejs/plugin-vue': '^4.2.0',
        'vite': '^4.4.0',
        'typescript': '^5.1.0',
      }),
      scripts: JSON.stringify({
        'dev': 'vite',
        'build': 'vue-tsc && vite build',
        'preview': 'vite preview',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'src',
          type: 'directory'
        },
        {
          path: 'src/App.vue',
          type: 'file',
          content: '<template>\n  <div>\n    <h1>Welcome to Vue.js!</h1>\n  </div>\n</template>\n\n<script setup lang="ts">\n// Vue 3 Composition API\n</script>'
        }
      ]),
      icon: '💚',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'E-Learning Platform',
      key: 'elearning-fullstack',
      description: 'Comprehensive e-learning platform with course management, video streaming, progress tracking, and payment processing',
      category: 'fullstack',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.4',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'express': '^4.18.2',
        'typescript': '^5.3.2',
        'postgresql': '^14.0.0',
        'redis': '^4.6.0'
      }),
      scripts: JSON.stringify({
        'dev:frontend': 'cd frontend && next dev -p 3004',
        'dev:backend': 'cd backend && PORT=3005 npm run dev',
        'dev': 'concurrently "npm run dev:backend" "npm run dev:frontend"',
        'build': 'npm run build:backend && npm run build:frontend',
        'build:frontend': 'cd frontend && next build',
        'build:backend': 'cd backend && npm run build',
        'start': 'npm run start:backend',
        'start:backend': 'cd backend && PORT=3005 npm start',
        'db:setup': 'cd backend && npm run db:migrate && npm run db:seed'
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
        database: 'postgresql',
        features: [
          'authentication',
          'video-streaming',
          'payment-processing',
          'real-time-notifications',
          'role-based-access',
          'progress-tracking',
          'analytics-dashboard',
          'course-management',
          'quiz-system',
          'discussion-forums'
        ]
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'README.md',
          type: 'file',
          content: '# E-Learning Platform\n\nFull-stack e-learning platform with Next.js and Express.\n\n## Quick Start\n\n```bash\nnpm install\nnpm run dev\n```\n\nFrontend: http://localhost:3004\nBackend: http://localhost:3005'
        },
        {
          path: 'package.json',
          type: 'file',
          content: '{\n  "name": "elearning-platform",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "concurrently \\"cd backend && npm run dev\\" \\"cd frontend && npm run dev\\"",\n    "build": "cd backend && npm run build && cd ../frontend && npm run build"\n  },\n  "devDependencies": {\n    "concurrently": "^8.2.2"\n  }\n}'
        },
        {
          path: 'frontend',
          type: 'directory'
        },
        {
          path: 'frontend/package.json',
          type: 'file',
          content: '{\n  "name": "elearning-frontend",\n  "scripts": {\n    "dev": "next dev -p 3004",\n    "build": "next build",\n    "start": "next start -p 3004"\n  },\n  "dependencies": {\n    "next": "^14.0.4",\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "typescript": "^5.3.2",\n    "tailwindcss": "^3.4.0"\n  }\n}'
        },
        {
          path: 'frontend/next.config.js',
          type: 'file',
          content: 'module.exports = {\n  experimental: { appDir: true },\n  env: { NEXT_PUBLIC_API_URL: "http://localhost:3005" }\n};'
        },
        {
          path: 'frontend/tailwind.config.js',
          type: 'file',
          content: 'module.exports = {\n  content: ["./src/**/*.{js,ts,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: []\n};'
        },
        {
          path: 'frontend/src',
          type: 'directory'
        },
        {
          path: 'frontend/src/app',
          type: 'directory'
        },
        {
          path: 'frontend/src/app/layout.tsx',
          type: 'file',
          content: 'import "./globals.css";\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html>\n      <body className="min-h-screen bg-gray-50">{children}</body>\n    </html>\n  );\n}'
        },
        {
          path: 'frontend/src/app/page.tsx',
          type: 'file',
          content: 'export default function HomePage() {\n  return (\n    <div className="p-8 text-center">\n      <h1 className="text-4xl font-bold text-blue-600 mb-4">📚 EduPlatform</h1>\n      <p className="text-lg mb-6">Learn Without Limits</p>\n      <button className="bg-blue-600 text-white px-6 py-3 rounded">Start Learning</button>\n    </div>\n  );\n}'
        },
        {
          path: 'frontend/src/app/globals.css',
          type: 'file',
          content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;'
        },
        {
          path: 'backend',
          type: 'directory'
        },
        {
          path: 'backend/package.json',
          type: 'file',
          content: '{\n  "name": "elearning-backend",\n  "scripts": {\n    "dev": "PORT=3005 node src/server.js",\n    "start": "PORT=3005 node src/server.js"\n  },\n  "dependencies": {\n    "express": "^4.18.2",\n    "cors": "^2.8.5",\n    "dotenv": "^16.3.1"\n  }\n}'
        },
        {
          path: 'backend/src',
          type: 'directory'
        },
        {
          path: 'backend/src/server.js',
          type: 'file',
          content: 'const express = require("express");\nconst cors = require("cors");\n\nconst app = express();\nconst PORT = 3005;\n\napp.use(cors());\napp.use(express.json());\n\napp.get("/", (req, res) => {\n  res.json({ message: "E-Learning API" });\n});\n\napp.get("/api/courses", (req, res) => {\n  res.json({ courses: [{ id: 1, title: "Web Dev Course" }] });\n});\n\napp.listen(PORT, () => {\n  console.log(`API running on port ${PORT}`);\n});'
        },
        {
          path: 'backend/.env.example',
          type: 'file',
          content: 'PORT=3005\nFRONTEND_URL=http://localhost:3004'
        }
      ]),
      icon: '🎓',
      version: '1.0.0',
      isActive: true,
      isOfficial: true
    },
    {
      name: 'SaaS Landing Page',
      key: 'saas-landing',
      description: 'Professional SaaS landing page with pricing, features, and testimonials',
      category: 'frontend',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.1.0',
        'tailwindcss': '^3.3.0',
        'lucide-react': '^0.294.0',
      }),
      scripts: JSON.stringify({
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
        'lint': 'next lint',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'app',
          type: 'directory'
        },
        {
          path: 'app/page.tsx',
          type: 'file',
          content: 'import Link from "next/link";\nimport { ArrowRight, Check, Star, Users, Zap, Shield } from "lucide-react";\n\nexport default function Home() {\n  return (\n    <div className="min-h-screen bg-white">\n      <nav className="border-b border-gray-200">\n        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\n          <div className="flex justify-between items-center h-16">\n            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">\n              SaaS Platform\n            </h1>\n            <div className="hidden md:block">\n              <div className="ml-10 flex items-baseline space-x-4">\n                <Link href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">\n                  Features\n                </Link>\n                <Link href="#pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">\n                  Pricing\n                </Link>\n                <Link href="#signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">\n                  Sign Up\n                </Link>\n              </div>\n            </div>\n          </div>\n        </div>\n      </nav>\n      <div className="relative overflow-hidden">\n        <div className="max-w-7xl mx-auto">\n          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">\n            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">\n              <div className="sm:text-center lg:text-left">\n                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">\n                  <span className="block xl:inline">Transform your business with</span>\n                  <span className="block text-blue-600 xl:inline"> our SaaS Platform</span>\n                </h1>\n                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">\n                  Streamline your workflow, boost productivity, and scale your business with our powerful platform.\n                </p>\n                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">\n                  <Link href="#signup" className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">\n                    Get started\n                    <ArrowRight className="ml-2 h-5 w-5" />\n                  </Link>\n                </div>\n              </div>\n            </main>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}'
        }
      ]),
      icon: '🚀',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'E-commerce Store',
      key: 'ecommerce-store',
      description: 'Full-featured e-commerce store with product catalog, cart, and checkout',
      category: 'fullstack',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.1.0',
        'tailwindcss': '^3.3.0',
        'lucide-react': '^0.294.0',
      }),
      scripts: JSON.stringify({
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'app',
          type: 'directory'
        },
        {
          path: 'app/page.tsx',
          type: 'file',
          content: 'import Link from "next/link";\nimport { ShoppingBag, Star, Heart, Search } from "lucide-react";\n\nexport default function Home() {\n  const products = [\n    { id: 1, name: "Premium Headphones", price: 199, rating: 4.5 },\n    { id: 2, name: "Wireless Speaker", price: 89, rating: 4.8 },\n    { id: 3, name: "Smart Watch", price: 299, rating: 4.2 },\n    { id: 4, name: "Laptop Stand", price: 49, rating: 4.6 },\n  ];\n\n  return (\n    <div className="min-h-screen bg-gray-50">\n      <header className="bg-white shadow-sm">\n        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\n          <div className="flex justify-between items-center h-16">\n            <h1 className="text-2xl font-bold text-gray-900">\n              <span className="text-blue-600">Tech</span>Store\n            </h1>\n            <div className="flex items-center space-x-4">\n              <button className="text-gray-500 hover:text-gray-700 relative">\n                <ShoppingBag className="h-6 w-6" />\n                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">\n                  0\n                </span>\n              </button>\n            </div>\n          </div>\n        </div>\n      </header>\n      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">\n        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Featured Products</h2>\n        <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">\n          {products.map((product) => (\n            <div key={product.id} className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg">\n              <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">\n                <span className="text-gray-500 text-sm">Product Image</span>\n              </div>\n              <div className="p-4">\n                <h3 className="text-sm text-gray-700 font-medium">{product.name}</h3>\n                <p className="text-lg font-medium text-gray-900 mt-2">${product.price}</p>\n                <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">\n                  Add to Cart\n                </button>\n              </div>\n            </div>\n          ))}\n        </div>\n      </div>\n    </div>\n  );\n}'
        }
      ]),
      icon: '🛒',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'Portfolio Website',
      key: 'portfolio',
      description: 'Personal portfolio website with projects, skills, and contact form',
      category: 'frontend',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.1.0',
        'tailwindcss': '^3.3.0',
        'lucide-react': '^0.294.0',
      }),
      scripts: JSON.stringify({
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'app',
          type: 'directory'
        },
        {
          path: 'app/page.tsx',
          type: 'file',
          content: 'import Link from "next/link";\nimport { Github, Linkedin, Mail, ExternalLink, Download } from "lucide-react";\n\nexport default function Home() {\n  const projects = [\n    { \n      id: 1, \n      title: "E-Commerce Platform", \n      description: "Full-stack online store with React, Node.js, and Stripe",\n      tech: ["React", "Node.js", "MongoDB", "Stripe"],\n    },\n    { \n      id: 2, \n      title: "Task Management App", \n      description: "Collaborative project management tool with real-time updates",\n      tech: ["Next.js", "TypeScript", "Socket.io", "PostgreSQL"],\n    }\n  ];\n\n  const skills = [\n    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express.js",\n    "MongoDB", "PostgreSQL", "HTML", "CSS", "Tailwind CSS", "Git", "Docker"\n  ];\n\n  return (\n    <div className="min-h-screen bg-white">\n      <nav className="fixed w-full bg-white/90 backdrop-blur-sm z-50 border-b">\n        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\n          <div className="flex justify-between items-center h-16">\n            <div className="text-2xl font-bold text-gray-900">John Doe</div>\n            <div className="hidden md:flex space-x-8">\n              <Link href="#about" className="text-gray-700 hover:text-blue-600">About</Link>\n              <Link href="#projects" className="text-gray-700 hover:text-blue-600">Projects</Link>\n              <Link href="#contact" className="text-gray-700 hover:text-blue-600">Contact</Link>\n            </div>\n          </div>\n        </div>\n      </nav>\n      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">\n        <div className="max-w-4xl mx-auto text-center">\n          <div className="mb-8">\n            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mx-auto mb-8 flex items-center justify-center text-white text-6xl font-bold">\n              JD\n            </div>\n          </div>\n          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Full-Stack Developer</h1>\n          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">\n            I create beautiful, responsive web applications using modern technologies.\n          </p>\n          <div className="flex flex-wrap justify-center gap-4">\n            <Link href="#contact" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">\n              Get In Touch\n            </Link>\n            <div className="flex justify-center space-x-6 mt-8">\n              <Link href="#" className="text-gray-600 hover:text-blue-600">\n                <Github className="w-6 h-6" />\n              </Link>\n              <Link href="#" className="text-gray-600 hover:text-blue-600">\n                <Linkedin className="w-6 h-6" />\n              </Link>\n            </div>\n          </div>\n        </div>\n      </section>\n    </div>\n  );\n}'
        }
      ]),
      icon: '💼',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'Admin Dashboard',
      key: 'admin-dashboard',
      description: 'Comprehensive admin dashboard with analytics, user management, charts, tables, settings, and real-time data visualization',
      category: 'fullstack',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.1.0',
        'tailwindcss': '^3.3.0',
        'lucide-react': '^0.294.0',
        'recharts': '^2.8.0',
        'react-hook-form': '^7.48.0',
        '@hookform/resolvers': '^3.3.0',
        'zod': '^3.22.0',
        'date-fns': '^2.30.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.0.0',
        '@headlessui/react': '^1.7.0',
        '@heroicons/react': '^2.0.0',
      }),
      scripts: JSON.stringify({
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        // Core configuration files
        {
          path: 'package.json',
          type: 'file',
          content: '{\n  "name": "admin-dashboard",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start",\n    "lint": "next lint",\n    "type-check": "tsc --noEmit"\n  },\n  "dependencies": {\n    "next": "^14.0.0",\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "typescript": "^5.1.0",\n    "tailwindcss": "^3.3.0",\n    "lucide-react": "^0.294.0",\n    "recharts": "^2.8.0",\n    "react-hook-form": "^7.48.0",\n    "@hookform/resolvers": "^3.3.0",\n    "zod": "^3.22.0",\n    "date-fns": "^2.30.0",\n    "clsx": "^2.0.0",\n    "tailwind-merge": "^2.0.0"\n  },\n  "devDependencies": {\n    "@types/node": "^20.8.0",\n    "@types/react": "^18.2.0",\n    "@types/react-dom": "^18.2.0",\n    "autoprefixer": "^10.4.0",\n    "postcss": "^8.4.0",\n    "eslint": "^8.0.0",\n    "eslint-config-next": "^14.0.0"\n  }\n}'
        },
        {
          path: 'next.config.js',
          type: 'file',
          content: '/** @type {import(\'next\').NextConfig} */\nconst nextConfig = {\n  experimental: {\n    appDir: true,\n  },\n  images: {\n    domains: [\'images.unsplash.com\', \'avatars.githubusercontent.com\'],\n  },\n}\n\nmodule.exports = nextConfig'
        },
        {
          path: 'tailwind.config.js',
          type: 'file',
          content: '/** @type {import(\'tailwindcss\').Config} */\nmodule.exports = {\n  content: [\n    \'./pages/**/*.{js,ts,jsx,tsx,mdx}\',\n    \'./components/**/*.{js,ts,jsx,tsx,mdx}\',\n    \'./app/**/*.{js,ts,jsx,tsx,mdx}\',\n  ],\n  theme: {\n    extend: {\n      colors: {\n        border: "hsl(var(--border))",\n        input: "hsl(var(--input))",\n        ring: "hsl(var(--ring))",\n        background: "hsl(var(--background))",\n        foreground: "hsl(var(--foreground))",\n        primary: {\n          DEFAULT: "hsl(var(--primary))",\n          foreground: "hsl(var(--primary-foreground))",\n        },\n        secondary: {\n          DEFAULT: "hsl(var(--secondary))",\n          foreground: "hsl(var(--secondary-foreground))",\n        },\n      },\n    },\n  },\n  plugins: [],\n}'
        },
        {
          path: 'postcss.config.js',
          type: 'file',
          content: 'module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}'
        },
        {
          path: 'tsconfig.json',
          type: 'file',
          content: '{\n  "compilerOptions": {\n    "target": "es5",\n    "lib": ["dom", "dom.iterable", "es6"],\n    "allowJs": true,\n    "skipLibCheck": true,\n    "strict": true,\n    "noEmit": true,\n    "esModuleInterop": true,\n    "module": "esnext",\n    "moduleResolution": "bundler",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "jsx": "preserve",\n    "incremental": true,\n    "plugins": [{"name": "next"}],\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"],\n      "@/components/*": ["./src/components/*"],\n      "@/lib/*": ["./src/lib/*"]\n    }\n  },\n  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],\n  "exclude": ["node_modules"]\n}'
        },
        // Directory structure
        {
          path: 'src',
          type: 'directory'
        },
        {
          path: 'src/lib',
          type: 'directory'
        },
        {
          path: 'src/lib/utils.ts',
          type: 'file',
          content: 'import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n\nexport function formatCurrency(amount: number, currency: string = \'USD\'): string {\n  return new Intl.NumberFormat(\'en-US\', {\n    style: \'currency\',\n    currency,\n  }).format(amount)\n}\n\nexport function formatNumber(num: number): string {\n  return new Intl.NumberFormat(\'en-US\').format(num)\n}'
        },
        // App structure
        {
          path: 'app',
          type: 'directory'
        },
        {
          path: 'app/globals.css',
          type: 'file',
          content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 240 10% 3.9%;\n    --card: 0 0% 100%;\n    --card-foreground: 240 10% 3.9%;\n    --primary: 240 9% 10%;\n    --primary-foreground: 0 0% 98%;\n    --secondary: 240 4.8% 95.9%;\n    --secondary-foreground: 240 5.9% 10%;\n    --border: 240 5.9% 90%;\n    --input: 240 5.9% 90%;\n    --ring: 240 5.9% 10%;\n    --radius: 0.5rem;\n  }\n\n  .dark {\n    --background: 240 10% 3.9%;\n    --foreground: 0 0% 98%;\n    --card: 240 10% 3.9%;\n    --card-foreground: 0 0% 98%;\n    --primary: 0 0% 98%;\n    --primary-foreground: 240 5.9% 10%;\n    --secondary: 240 3.7% 15.9%;\n    --secondary-foreground: 0 0% 98%;\n    --border: 240 3.7% 15.9%;\n    --input: 240 3.7% 15.9%;\n    --ring: 240 4.9% 83.9%;\n  }\n}\n\n@layer base {\n  * {\n    @apply border-border;\n  }\n  body {\n    @apply bg-background text-foreground;\n  }\n}\n\n::-webkit-scrollbar {\n  width: 4px;\n}\n::-webkit-scrollbar-track {\n  background: transparent;\n}\n::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 2px;\n}\n::-webkit-scrollbar-thumb:hover {\n  background: #94a3b8;\n}'
        },
        {
          path: 'app/layout.tsx',
          type: 'file',
          content: 'import type { Metadata } from \'next\'\nimport { Inter } from \'next/font/google\'\nimport \'./globals.css\'\n\nconst inter = Inter({ subsets: [\'latin\'] })\n\nexport const metadata: Metadata = {\n  title: \'Admin Dashboard - Modern Business Analytics\',\n  description: \'Comprehensive admin dashboard for business analytics and user management\',\n}\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode\n}) {\n  return (\n    <html lang="en">\n      <body className={inter.className}>\n        <div id="root">{children}</div>\n      </body>\n    </html>\n  )\n}'
        },
        {
          path: 'app/page.tsx',
          type: 'file',
          content: 'import { redirect } from \'next/navigation\';\n\nexport default function HomePage() {\n  redirect(\'/dashboard\');\n  return null;\n}'
        },
        // Dashboard structure
        {
          path: 'app/dashboard',
          type: 'directory'
        },
        {
          path: 'app/dashboard/layout.tsx',
          type: 'file',
          content: '\'use client\';\n\nimport React, { useState } from \'react\';\nimport Link from \'next/link\';\nimport { usePathname } from \'next/navigation\';\nimport { \n  LayoutDashboard,\n  Users,\n  BarChart3,\n  Settings,\n  ShoppingCart,\n  FileText,\n  Menu,\n  X,\n  Bell,\n  Search\n} from \'lucide-react\';\n\nconst navigation = [\n  { name: \'Dashboard\', href: \'/dashboard\', icon: LayoutDashboard },\n  { name: \'Analytics\', href: \'/dashboard/analytics\', icon: BarChart3 },\n  { name: \'Users\', href: \'/dashboard/users\', icon: Users },\n  { name: \'Orders\', href: \'/dashboard/orders\', icon: ShoppingCart },\n  { name: \'Reports\', href: \'/dashboard/reports\', icon: FileText },\n  { name: \'Settings\', href: \'/dashboard/settings\', icon: Settings },\n];\n\nexport default function DashboardLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  const [sidebarOpen, setSidebarOpen] = useState(false);\n  const pathname = usePathname();\n\n  return (\n    <div className="min-h-screen bg-gray-50">\n      {sidebarOpen && (\n        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />\n      )}\n\n      <div className={\'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 \' + (sidebarOpen ? \'translate-x-0\' : \'-translate-x-full lg:translate-x-0\')}>\n        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">\n          <div className="flex items-center">\n            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">\n              <LayoutDashboard className="w-5 h-5 text-white" />\n            </div>\n            <span className="ml-2 text-xl font-bold">Admin</span>\n          </div>\n          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">\n            <X className="w-5 h-5" />\n          </button>\n        </div>\n\n        <nav className="mt-8 px-4">\n          <ul className="space-y-2">\n            {navigation.map((item) => {\n              const isActive = pathname === item.href;\n              return (\n                <li key={item.name}>\n                  <Link href={item.href} className={\'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors \' + (isActive ? \'bg-blue-600 text-white\' : \'text-gray-700 hover:bg-gray-100 hover:text-gray-900\')} onClick={() => setSidebarOpen(false)}>\n                    <item.icon className="w-5 h-5 mr-3" />\n                    {item.name}\n                  </Link>\n                </li>\n              );\n            })}\n          </ul>\n        </nav>\n      </div>\n\n      <div className="pl-0 lg:pl-64">\n        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">\n          <div className="flex items-center">\n            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">\n              <Menu className="w-5 h-5" />\n            </button>\n            <div className="hidden md:block ml-4">\n              <div className="relative">\n                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />\n                <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80" />\n              </div>\n            </div>\n          </div>\n          <div className="flex items-center space-x-4">\n            <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg">\n              <Bell className="w-5 h-5" />\n              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>\n            </button>\n            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">\n              <span className="text-xs font-medium text-white">JD</span>\n            </div>\n          </div>\n        </header>\n\n        <main className="p-6">\n          {children}\n        </main>\n      </div>\n    </div>\n  );\n}'
        },
        {
          path: 'app/dashboard/page.tsx',
          type: 'file',
          content: '\'use client\';\n\nimport React from \'react\';\nimport { Users, DollarSign, ShoppingCart, TrendingUp, ArrowUpRight, Activity, CreditCard } from \'lucide-react\';\nimport { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from \'recharts\';\n\nconst salesData = [\n  { name: \'Jan\', sales: 4000, users: 2400, orders: 240 },\n  { name: \'Feb\', sales: 3000, users: 1398, orders: 139 },\n  { name: \'Mar\', sales: 2000, users: 9800, orders: 980 },\n  { name: \'Apr\', sales: 2780, users: 3908, orders: 390 },\n  { name: \'May\', sales: 1890, users: 4800, orders: 480 },\n  { name: \'Jun\', sales: 2390, users: 3800, orders: 380 },\n];\n\nconst pieData = [\n  { name: \'Desktop\', value: 400, color: \'#8884d8\' },\n  { name: \'Mobile\', value: 300, color: \'#82ca9d\' },\n  { name: \'Tablet\', value: 200, color: \'#ffc658\' },\n  { name: \'Other\', value: 100, color: \'#ff7c7c\' },\n];\n\nconst stats = [\n  { title: \'Total Revenue\', value: \'$45,231.89\', change: \'+20.1%\', changeType: \'positive\', icon: DollarSign, description: \'+19% from last month\' },\n  { title: \'Subscriptions\', value: \'+2350\', change: \'+180.1%\', changeType: \'positive\', icon: Users, description: \'+201 since last week\' },\n  { title: \'Sales\', value: \'+12,234\', change: \'+19%\', changeType: \'positive\', icon: CreditCard, description: \'+201 since last hour\' },\n  { title: \'Active Now\', value: \'+573\', change: \'+201\', changeType: \'positive\', icon: Activity, description: \'+201 since last hour\' },\n];\n\nconst recentSales = [\n  { name: \'Olivia Martin\', email: \'olivia.martin@email.com\', amount: \'+$1,999.00\', avatar: \'OM\' },\n  { name: \'Jackson Lee\', email: \'jackson.lee@email.com\', amount: \'+$39.00\', avatar: \'JL\' },\n  { name: \'Isabella Nguyen\', email: \'isabella.nguyen@email.com\', amount: \'+$299.00\', avatar: \'IN\' },\n  { name: \'William Kim\', email: \'will@email.com\', amount: \'+$99.00\', avatar: \'WK\' },\n  { name: \'Sofia Davis\', email: \'sofia.davis@email.com\', amount: \'+$39.00\', avatar: \'SD\' },\n];\n\nexport default function DashboardPage() {\n  return (\n    <div className="space-y-6">\n      <div className="flex items-center justify-between space-y-2">\n        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>\n      </div>\n\n      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">\n        {stats.map((stat, index) => (\n          <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">\n            <div className="flex items-center justify-between space-y-0 pb-2">\n              <h3 className="text-sm font-medium">{stat.title}</h3>\n              <stat.icon className="h-4 w-4 text-gray-600" />\n            </div>\n            <div className="space-y-1">\n              <p className="text-2xl font-bold">{stat.value}</p>\n              <p className="text-xs text-gray-600 flex items-center">\n                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />\n                <span className="text-green-500">{stat.change}</span>\n                <span className="ml-1">{stat.description}</span>\n              </p>\n            </div>\n          </div>\n        ))}\n      </div>\n\n      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">\n        <div className="col-span-4 rounded-lg border bg-white p-6 shadow-sm">\n          <h3 className="text-lg font-semibold mb-4">Overview</h3>\n          <ResponsiveContainer width="100%" height={350}>\n            <BarChart data={salesData}>\n              <CartesianGrid strokeDasharray="3 3" />\n              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />\n              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => \'$\' + value} />\n              <Tooltip />\n              <Bar dataKey="sales" fill="#8884d8" radius={[4, 4, 0, 0]} />\n            </BarChart>\n          </ResponsiveContainer>\n        </div>\n\n        <div className="col-span-3 rounded-lg border bg-white p-6 shadow-sm">\n          <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>\n          <div className="space-y-4">\n            {recentSales.map((sale, index) => (\n              <div key={index} className="flex items-center">\n                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">\n                  <span className="text-sm font-medium">{sale.avatar}</span>\n                </div>\n                <div className="ml-4 space-y-1 flex-1">\n                  <p className="text-sm font-medium leading-none">{sale.name}</p>\n                  <p className="text-sm text-gray-600">{sale.email}</p>\n                </div>\n                <div className="ml-auto font-medium">{sale.amount}</div>\n              </div>\n            ))}\n          </div>\n        </div>\n      </div>\n\n      <div className="grid gap-4 md:grid-cols-2">\n        <div className="rounded-lg border bg-white p-6 shadow-sm">\n          <h3 className="text-lg font-semibold mb-4">User Growth</h3>\n          <ResponsiveContainer width="100%" height={300}>\n            <LineChart data={salesData}>\n              <CartesianGrid strokeDasharray="3 3" />\n              <XAxis dataKey="name" />\n              <YAxis />\n              <Tooltip />\n              <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />\n            </LineChart>\n          </ResponsiveContainer>\n        </div>\n\n        <div className="rounded-lg border bg-white p-6 shadow-sm">\n          <h3 className="text-lg font-semibold mb-4">Device Usage</h3>\n          <ResponsiveContainer width="100%" height={300}>\n            <PieChart>\n              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => name + \' \' + (percent * 100).toFixed(0) + \'%\'} outerRadius={80} fill="#8884d8" dataKey="value">\n                {pieData.map((entry, index) => (\n                  <Cell key={\'cell-\' + index} fill={entry.color} />\n                ))}\n              </Pie>\n              <Tooltip />\n            </PieChart>\n          </ResponsiveContainer>\n        </div>\n      </div>\n    </div>\n  );\n}'
        },
        // Users page
        {
          path: 'app/dashboard/users',
          type: 'directory'
        },
        {
          path: 'app/dashboard/users/page.tsx',
          type: 'file',
          content: '\'use client\';\n\nimport React, { useState } from \'react\';\nimport { Search, Plus, Edit, Trash2, Eye, Users } from \'lucide-react\';\n\nconst users = [\n  { id: 1, name: \'John Doe\', email: \'john@example.com\', role: \'Admin\', status: \'Active\', lastLogin: \'2024-01-15 09:30\', avatar: \'JD\' },\n  { id: 2, name: \'Jane Smith\', email: \'jane@example.com\', role: \'Manager\', status: \'Active\', lastLogin: \'2024-01-14 16:45\', avatar: \'JS\' },\n  { id: 3, name: \'Mike Johnson\', email: \'mike@example.com\', role: \'User\', status: \'Inactive\', lastLogin: \'2024-01-10 14:20\', avatar: \'MJ\' },\n  { id: 4, name: \'Sarah Wilson\', email: \'sarah@example.com\', role: \'User\', status: \'Active\', lastLogin: \'2024-01-15 11:15\', avatar: \'SW\' },\n];\n\nexport default function UsersPage() {\n  const [searchTerm, setSearchTerm] = useState(\'\');\n  const [selectedRole, setSelectedRole] = useState(\'all\');\n\n  const filteredUsers = users.filter(user => {\n    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());\n    const matchesRole = selectedRole === \'all\' || user.role.toLowerCase() === selectedRole;\n    return matchesSearch && matchesRole;\n  });\n\n  return (\n    <div className="space-y-6">\n      <div className="flex items-center justify-between">\n        <div>\n          <h2 className="text-3xl font-bold tracking-tight">Users</h2>\n          <p className="text-gray-600">Manage your team members and their permissions</p>\n        </div>\n        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">\n          <Plus className="w-4 h-4" />\n          Add User\n        </button>\n      </div>\n\n      <div className="grid gap-4 md:grid-cols-4">\n        <div className="bg-white rounded-lg border p-6 shadow-sm">\n          <div className="flex items-center justify-between">\n            <div>\n              <p className="text-sm font-medium text-gray-600">Total Users</p>\n              <p className="text-2xl font-bold">{users.length}</p>\n            </div>\n            <Users className="h-8 w-8 text-gray-400" />\n          </div>\n        </div>\n        <div className="bg-white rounded-lg border p-6 shadow-sm">\n          <div className="flex items-center justify-between">\n            <div>\n              <p className="text-sm font-medium text-gray-600">Active Users</p>\n              <p className="text-2xl font-bold">{users.filter(u => u.status === \'Active\').length}</p>\n            </div>\n            <Users className="h-8 w-8 text-green-500" />\n          </div>\n        </div>\n        <div className="bg-white rounded-lg border p-6 shadow-sm">\n          <div className="flex items-center justify-between">\n            <div>\n              <p className="text-sm font-medium text-gray-600">Admins</p>\n              <p className="text-2xl font-bold">{users.filter(u => u.role === \'Admin\').length}</p>\n            </div>\n            <Users className="h-8 w-8 text-blue-500" />\n          </div>\n        </div>\n        <div className="bg-white rounded-lg border p-6 shadow-sm">\n          <div className="flex items-center justify-between">\n            <div>\n              <p className="text-sm font-medium text-gray-600">New This Month</p>\n              <p className="text-2xl font-bold">12</p>\n            </div>\n            <Users className="h-8 w-8 text-purple-500" />\n          </div>\n        </div>\n      </div>\n\n      <div className="flex items-center gap-4">\n        <div className="relative flex-1 max-w-sm">\n          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />\n          <input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />\n        </div>\n        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">\n          <option value="all">All Roles</option>\n          <option value="admin">Admin</option>\n          <option value="manager">Manager</option>\n          <option value="user">User</option>\n        </select>\n      </div>\n\n      <div className="bg-white rounded-lg border shadow-sm">\n        <div className="overflow-x-auto">\n          <table className="w-full">\n            <thead>\n              <tr className="border-b border-gray-200">\n                <th className="text-left p-4 font-medium">User</th>\n                <th className="text-left p-4 font-medium">Role</th>\n                <th className="text-left p-4 font-medium">Status</th>\n                <th className="text-left p-4 font-medium">Last Login</th>\n                <th className="text-right p-4 font-medium">Actions</th>\n              </tr>\n            </thead>\n            <tbody>\n              {filteredUsers.map((user) => (\n                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">\n                  <td className="p-4">\n                    <div className="flex items-center gap-3">\n                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">\n                        <span className="text-sm font-medium">{user.avatar}</span>\n                      </div>\n                      <div>\n                        <p className="font-medium">{user.name}</p>\n                        <p className="text-sm text-gray-600">{user.email}</p>\n                      </div>\n                    </div>\n                  </td>\n                  <td className="p-4">\n                    <span className={\'px-2 py-1 rounded-full text-xs font-medium \' + (user.role === \'Admin\' ? \'bg-red-100 text-red-700\' : user.role === \'Manager\' ? \'bg-blue-100 text-blue-700\' : \'bg-gray-100 text-gray-700\')}>{user.role}</span>\n                  </td>\n                  <td className="p-4">\n                    <span className={\'px-2 py-1 rounded-full text-xs font-medium \' + (user.status === \'Active\' ? \'bg-green-100 text-green-700\' : \'bg-gray-100 text-gray-700\')}>{user.status}</span>\n                  </td>\n                  <td className="p-4">\n                    <p className="text-sm">{user.lastLogin}</p>\n                  </td>\n                  <td className="p-4">\n                    <div className="flex items-center gap-2 justify-end">\n                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button>\n                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>\n                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>\n                    </div>\n                  </td>\n                </tr>\n              ))}\n            </tbody>\n          </table>\n        </div>\n      </div>\n    </div>\n  );\n}'
        }
      ]),
      icon: '📊',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    },
    {
      name: 'Blog Website',
      key: 'blog-site',
      description: 'Modern blog with markdown support, categories, and SEO optimization',
      category: 'frontend',
      language: 'typescript',
      framework: 'nextjs',
      dependencies: JSON.stringify({
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.1.0',
        'tailwindcss': '^3.3.0',
        'lucide-react': '^0.294.0',
      }),
      scripts: JSON.stringify({
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
      }),
      config: JSON.stringify({
        nodeVersion: '18',
        packageManager: 'npm',
      }),
      dockerImage: 'node:18-alpine',
      files: JSON.stringify([
        {
          path: 'app',
          type: 'directory'
        },
        {
          path: 'app/page.tsx',
          type: 'file',
          content: 'import Link from "next/link";\nimport { Calendar, Clock, User, Tag, ArrowRight, Search } from "lucide-react";\n\nexport default function Home() {\n  const posts = [\n    {\n      id: 1,\n      title: "Getting Started with Next.js 14",\n      excerpt: "Learn how to build modern web applications with the latest features in Next.js 14.",\n      author: "John Doe",\n      date: "2024-01-15",\n      readTime: "5 min read",\n      category: "Web Development",\n    },\n    {\n      id: 2,\n      title: "Mastering CSS Grid Layout",\n      excerpt: "Dive deep into CSS Grid and learn how to create complex, responsive layouts.",\n      author: "Jane Smith",\n      date: "2024-01-12",\n      readTime: "8 min read",\n      category: "CSS",\n    }\n  ];\n\n  return (\n    <div className="min-h-screen bg-gray-50">\n      <header className="bg-white shadow-sm">\n        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\n          <div className="flex justify-between items-center h-16">\n            <h1 className="text-2xl font-bold text-gray-900">\n              <span className="text-blue-600">Dev</span>Blog\n            </h1>\n            <nav className="hidden md:flex space-x-8">\n              <Link href="/" className="text-blue-600 font-medium">Home</Link>\n              <Link href="/categories" className="text-gray-700 hover:text-blue-600">Categories</Link>\n              <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>\n            </nav>\n          </div>\n        </div>\n      </header>\n      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">\n        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">\n          <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to DevBlog</h1>\n          <p className="text-xl md:text-2xl mb-8 text-blue-100">\n            Insights, tutorials, and thoughts on web development\n          </p>\n        </div>\n      </section>\n      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">\n        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">\n          <div className="lg:col-span-3">\n            <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Posts</h2>\n            <div className="grid md:grid-cols-2 gap-8">\n              {posts.map((post) => (\n                <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden">\n                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">\n                    <span className="text-gray-500">Post Image</span>\n                  </div>\n                  <div className="p-6">\n                    <div className="flex items-center mb-3">\n                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">\n                        {post.category}\n                      </span>\n                    </div>\n                    <h3 className="text-xl font-bold text-gray-900 mb-2">\n                      <Link href={`/posts/${post.id}`} className="hover:text-blue-600">\n                        {post.title}\n                      </Link>\n                    </h3>\n                    <p className="text-gray-600 mb-4">{post.excerpt}</p>\n                    <div className="flex items-center text-sm text-gray-500">\n                      <User className="w-3 h-3 mr-1" />\n                      {post.author}\n                      <Clock className="w-3 h-3 ml-3 mr-1" />\n                      {post.readTime}\n                    </div>\n                  </div>\n                </article>\n              ))}\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}'
        }
      ]),
      icon: '📝',
      version: '1.0.0',
      isActive: true,
      isOfficial: true,
    }
  ]);
}