import { db } from '../config/database';
import { ProjectTemplate, TemplateFile } from '@swistack/shared';

export class TemplateService {
  static async getAll(): Promise<ProjectTemplate[]> {
    const templates = await db('project_templates')
      .where('isActive', true)
      .orderBy('isOfficial', 'desc')
      .orderBy('category')
      .orderBy('name');

    // Return lightweight templates without file content to avoid 431 errors
    return templates.map(template => ({
      ...template,
      files: typeof template.files === 'string' ? JSON.parse(template.files) : template.files,
      dependencies: typeof template.dependencies === 'string' ? JSON.parse(template.dependencies) : template.dependencies,
      scripts: typeof template.scripts === 'string' ? JSON.parse(template.scripts) : template.scripts,
      config: typeof template.config === 'string' ? JSON.parse(template.config) : template.config,
      // Remove file content to reduce response size
      files: (typeof template.files === 'string' ? JSON.parse(template.files) : template.files || []).map((file: any) => ({
        path: file.path,
        type: file.type,
        // Remove content to prevent 431 errors
        content: undefined
      }))
    }));
  }

  static async getAllWithContent(): Promise<ProjectTemplate[]> {
    const templates = await db('project_templates')
      .where('isActive', true)
      .orderBy('isOfficial', 'desc')
      .orderBy('category')
      .orderBy('name');

    return templates.map(template => ({
      ...template,
      files: typeof template.files === 'string' ? JSON.parse(template.files) : template.files,
      dependencies: typeof template.dependencies === 'string' ? JSON.parse(template.dependencies) : template.dependencies,
      scripts: typeof template.scripts === 'string' ? JSON.parse(template.scripts) : template.scripts,
      config: typeof template.config === 'string' ? JSON.parse(template.config) : template.config,
    }));
  }

  static async getByKey(key: string): Promise<ProjectTemplate | null> {
    const template = await db('project_templates')
      .where('key', key)
      .where('isActive', true)
      .first();
    
    if (template) {
      // Handle JSON fields that might already be parsed by PostgreSQL
      template.files = typeof template.files === 'string' ? JSON.parse(template.files) : template.files;
      template.dependencies = typeof template.dependencies === 'string' ? JSON.parse(template.dependencies) : template.dependencies;
      template.scripts = typeof template.scripts === 'string' ? JSON.parse(template.scripts) : template.scripts;
      template.config = typeof template.config === 'string' ? JSON.parse(template.config) : template.config;
      
      // DEBUG: Log template files for E-Learning Platform
      if (key === 'elearning-fullstack') {
        console.log('🔍 E-Learning template files:', template.files.map((f: any) => f.path).slice(0, 5));
        console.log('🔍 E-Learning page.tsx content preview:', template.files.find((f: any) => f.path.includes('page.tsx'))?.content?.substring(0, 100));
      }
    }
    
    return template || null;
  }

  static async getByCategory(category: string): Promise<ProjectTemplate[]> {
    const templates = await db('project_templates')
      .where('category', category)
      .where('isActive', true)
      .orderBy('isOfficial', 'desc')
      .orderBy('name');
    
    return templates.map(template => ({
      ...template,
      files: typeof template.files === 'string' ? JSON.parse(template.files) : template.files,
      dependencies: typeof template.dependencies === 'string' ? JSON.parse(template.dependencies) : template.dependencies,
      scripts: typeof template.scripts === 'string' ? JSON.parse(template.scripts) : template.scripts,
      config: typeof template.config === 'string' ? JSON.parse(template.config) : template.config,
    }));
  }

  static async initializeDefaultTemplates(): Promise<void> {
    const templates = [
      // React Template
      {
        name: 'React App',
        key: 'react',
        description: 'A modern React application with TypeScript, Tailwind CSS, and Vite',
        category: 'frontend',
        language: 'typescript',
        framework: 'react',
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          'typescript': '^5.0.0',
          'vite': '^4.4.0',
          '@vitejs/plugin-react': '^4.0.0',
          'tailwindcss': '^3.3.0',
          'autoprefixer': '^10.4.0',
          'postcss': '^8.4.0',
          'eslint': '^8.45.0',
          '@typescript-eslint/eslint-plugin': '^6.0.0',
          '@typescript-eslint/parser': '^6.0.0',
        },
        scripts: {
          'dev': 'vite',
          'build': 'tsc && vite build',
          'preview': 'vite preview',
          'lint': 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getReactTemplateFiles(),
        icon: '⚛️',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // Node.js Express Template
      {
        name: 'Node.js Express API',
        key: 'nodejs-express',
        description: 'RESTful API with Express.js, TypeScript, and PostgreSQL',
        category: 'backend',
        language: 'typescript',
        framework: 'express',
        dependencies: {
          'express': '^4.18.2',
          'cors': '^2.8.5',
          'helmet': '^7.0.0',
          'dotenv': '^16.3.1',
          'pg': '^8.11.3',
          'knex': '^3.0.1',
          'joi': '^17.9.2',
          'jsonwebtoken': '^9.0.2',
          'bcryptjs': '^2.4.3',
          '@types/express': '^4.17.17',
          '@types/cors': '^2.8.13',
          '@types/node': '^20.4.0',
          '@types/pg': '^8.10.2',
          '@types/jsonwebtoken': '^9.0.2',
          '@types/bcryptjs': '^2.4.2',
          'typescript': '^5.1.0',
          'ts-node': '^10.9.0',
          'nodemon': '^3.0.0',
        },
        scripts: {
          'start': 'node dist/server.js',
          'dev': 'nodemon --exec ts-node src/server.ts',
          'build': 'tsc',
          'migration': 'knex migrate:latest',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getNodeExpressTemplateFiles(),
        icon: '🚀',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // Python Flask Template
      {
        name: 'Python Flask API',
        key: 'python-flask',
        description: 'RESTful API with Flask, SQLAlchemy, and PostgreSQL',
        category: 'backend',
        language: 'python',
        framework: 'flask',
        dependencies: {
          'Flask': '^2.3.0',
          'Flask-SQLAlchemy': '^3.0.0',
          'Flask-JWT-Extended': '^4.5.0',
          'Flask-CORS': '^4.0.0',
          'psycopg2-binary': '^2.9.7',
          'python-dotenv': '^1.0.0',
          'marshmallow': '^3.20.0',
        },
        scripts: {
          'start': 'python app.py',
          'dev': 'flask --app app.py --debug run',
        },
        config: {
          pythonVersion: '3.11',
          packageManager: 'pip',
        },
        dockerImage: 'python:3.11-alpine',
        files: this.getPythonFlaskTemplateFiles(),
        icon: '🐍',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // Next.js Full-stack Template
      {
        name: 'Next.js Full-stack',
        key: 'nextjs-fullstack',
        description: 'Full-stack Next.js application with API routes and database',
        category: 'fullstack',
        language: 'typescript',
        framework: 'nextjs',
        dependencies: {
          'next': '^13.4.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@types/node': '^20.4.0',
          'typescript': '^5.1.0',
          'tailwindcss': '^3.3.0',
          'autoprefixer': '^10.4.0',
          'postcss': '^8.4.0',
          'prisma': '^5.0.0',
          '@prisma/client': '^5.0.0',
          'zod': '^3.21.0',
        },
        scripts: {
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start',
          'lint': 'next lint',
          'db:push': 'prisma db push',
          'db:studio': 'prisma studio',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getNextjsTemplateFiles(),
        icon: '▲',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // Vue.js Template
      {
        name: 'Vue.js App',
        key: 'vue',
        description: 'Modern Vue.js application with TypeScript and Vite',
        category: 'frontend',
        language: 'typescript',
        framework: 'vue',
        dependencies: {
          'vue': '^3.3.0',
          '@vitejs/plugin-vue': '^4.2.0',
          'vite': '^4.4.0',
          'typescript': '^5.1.0',
          'vue-tsc': '^1.8.0',
          '@vue/tsconfig': '^0.4.0',
        },
        scripts: {
          'dev': 'vite',
          'build': 'vue-tsc && vite build',
          'preview': 'vite preview',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getVueTemplateFiles(),
        icon: '💚',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // SaaS Landing Page Template
      {
        name: 'SaaS Landing Page',
        key: 'saas-landing',
        description: 'Professional SaaS landing page with pricing, features, and testimonials',
        category: 'frontend',
        language: 'typescript',
        framework: 'nextjs',
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@types/node': '^20.4.0',
          'typescript': '^5.1.0',
          'tailwindcss': '^3.3.0',
          'autoprefixer': '^10.4.0',
          'postcss': '^8.4.0',
          'lucide-react': '^0.294.0',
        },
        scripts: {
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start',
          'lint': 'next lint',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getSaasLandingTemplateFiles(),
        icon: '🚀',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // E-commerce Template
      {
        name: 'E-commerce Store',
        key: 'ecommerce-store',
        description: 'Full-featured e-commerce store with product catalog, cart, and checkout',
        category: 'fullstack',
        language: 'typescript',
        framework: 'nextjs',
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          'typescript': '^5.1.0',
          'tailwindcss': '^3.3.0',
          'stripe': '^13.0.0',
          'prisma': '^5.0.0',
          '@prisma/client': '^5.0.0',
          'zustand': '^4.4.0',
          'lucide-react': '^0.294.0',
        },
        scripts: {
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start',
          'db:push': 'prisma db push',
          'db:studio': 'prisma studio',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getEcommerceTemplateFiles(),
        icon: '🛒',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // Portfolio Template
      {
        name: 'Portfolio Website',
        key: 'portfolio',
        description: 'Personal portfolio website with projects, skills, and contact form',
        category: 'frontend',
        language: 'typescript',
        framework: 'nextjs',
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          'typescript': '^5.1.0',
          'tailwindcss': '^3.3.0',
          'framer-motion': '^10.16.0',
          'lucide-react': '^0.294.0',
          'react-hook-form': '^7.45.0',
        },
        scripts: {
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start',
          'lint': 'next lint',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getPortfolioTemplateFiles(),
        icon: '💼',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // Admin Dashboard Template
      {
        name: 'Admin Dashboard',
        key: 'admin-dashboard',
        description: 'Modern admin dashboard with charts, tables, and user management',
        category: 'fullstack',
        language: 'typescript',
        framework: 'nextjs',
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          'typescript': '^5.1.0',
          'tailwindcss': '^3.3.0',
          'recharts': '^2.8.0',
          'lucide-react': '^0.294.0',
          'react-hook-form': '^7.45.0',
          '@headlessui/react': '^1.7.0',
        },
        scripts: {
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start',
          'lint': 'next lint',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getDashboardTemplateFiles(),
        icon: '📊',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // Blog Template
      {
        name: 'Blog Website',
        key: 'blog-site',
        description: 'Modern blog with markdown support, categories, and SEO optimization',
        category: 'frontend',
        language: 'typescript',
        framework: 'nextjs',
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          'typescript': '^5.1.0',
          'tailwindcss': '^3.3.0',
          'gray-matter': '^4.0.3',
          'react-markdown': '^8.0.0',
          'remark-gfm': '^3.0.0',
          'lucide-react': '^0.294.0',
        },
        scripts: {
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start',
          'lint': 'next lint',
        },
        config: {
          nodeVersion: '18',
          packageManager: 'npm',
        },
        dockerImage: 'node:18-alpine',
        files: this.getBlogTemplateFiles(),
        icon: '📝',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },
    ];

    for (const template of templates) {
      const existing = await db('project_templates').where('key', template.key).first();
      if (!existing) {
        await db('project_templates').insert({
          ...template,
          files: JSON.stringify(template.files),
          dependencies: JSON.stringify(template.dependencies),
          scripts: JSON.stringify(template.scripts),
          config: JSON.stringify(template.config),
        });
      }
    }
  }

  private static getReactTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'react-app',
          private: true,
          version: '0.0.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
            preview: 'vite preview'
          }
        }, null, 2)
      },
      {
        path: 'index.html',
        type: 'file',
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      },
      {
        path: 'src',
        type: 'directory'
      },
      {
        path: 'src/main.tsx',
        type: 'file',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
      },
      {
        path: 'src/App.tsx',
        type: 'file',
        content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to React</h1>
        <div className="card">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            count is {count}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App`
      },
      {
        path: 'src/index.css',
        type: 'file',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}`
      },
      {
        path: 'vite.config.ts',
        type: 'file',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
      },
      {
        path: 'tailwind.config.js',
        type: 'file',
        content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
      }
    ];
  }

  private static getNodeExpressTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'nodejs-express-api',
          version: '1.0.0',
          description: 'RESTful API with Express.js and TypeScript',
          main: 'dist/server.js',
          scripts: {
            start: 'node dist/server.js',
            dev: 'nodemon --exec ts-node src/server.ts',
            build: 'tsc',
            migration: 'knex migrate:latest'
          }
        }, null, 2)
      },
      {
        path: 'src',
        type: 'directory'
      },
      {
        path: 'src/server.ts',
        type: 'file',
        content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express API!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`
      },
      {
        path: '.env.example',
        type: 'file',
        content: `PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/myapp`
      },
      {
        path: 'tsconfig.json',
        type: 'file',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            lib: ['ES2020'],
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            declaration: true,
            declarationMap: true,
            sourceMap: true
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist']
        }, null, 2)
      }
    ];
  }

  private static getPythonFlaskTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'app.py',
        type: 'file',
        content: `from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def hello():
    return jsonify({'message': 'Hello from Flask API!'})

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)`
      },
      {
        path: 'requirements.txt',
        type: 'file',
        content: `Flask==2.3.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.0.0
Flask-JWT-Extended==4.5.0
psycopg2-binary==2.9.7
python-dotenv==1.0.0
marshmallow==3.20.0`
      },
      {
        path: '.env.example',
        type: 'file',
        content: `FLASK_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
JWT_SECRET_KEY=your-secret-key`
      }
    ];
  }

  private static getNextjsTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'nextjs-fullstack',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
          }
        }, null, 2)
      },
      {
        path: 'app',
        type: 'directory'
      },
      {
        path: 'app/page.tsx',
        type: 'file',
        content: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">Welcome to Next.js!</h1>
      </div>
    </main>
  )
}`
      },
      {
        path: 'app/layout.tsx',
        type: 'file',
        content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Next.js App',
  description: 'Generated by create next app',
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
        path: 'app/globals.css',
        type: 'file',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
      }
    ];
  }

  private static getVueTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'vue-app',
          private: true,
          version: '0.0.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vue-tsc && vite build',
            preview: 'vite preview'
          }
        }, null, 2)
      },
      {
        path: 'index.html',
        type: 'file',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="/vite.svg">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vue App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`
      },
      {
        path: 'src',
        type: 'directory'
      },
      {
        path: 'src/main.ts',
        type: 'file',
        content: `import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')`
      },
      {
        path: 'src/App.vue',
        type: 'file',
        content: `<template>
  <div class="app">
    <h1>Welcome to Vue.js!</h1>
    <div class="card">
      <button type="button" @click="count++">count is {{ count }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<style scoped>
.app {
  text-align: center;
  padding: 2rem;
}

.card {
  padding: 2em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}
</style>`
      }
    ];
  }

  private static getSaasLandingTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'saas-landing-page',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
          }
        }, null, 2)
      },
      {
        path: 'app',
        type: 'directory'
      },
      {
        path: 'app/page.tsx',
        type: 'file',
        content: `import Link from 'next/link';
import { ArrowRight, Check, Star, Users, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SaaS Platform
                </h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Features
                </Link>
                <Link href="#pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Pricing
                </Link>
                <Link href="#about" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  About
                </Link>
                <Link href="#login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Login
                </Link>
                <Link href="#signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Transform your business with</span>
                  <span className="block text-blue-600 xl:inline"> our SaaS Platform</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Streamline your workflow, boost productivity, and scale your business with our powerful, easy-to-use platform designed for modern teams.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="#signup" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                      Get started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link href="#demo" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10">
                      Watch demo
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Lightning Fast</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Built for speed with modern technologies and optimized performance.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Secure & Reliable</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Enterprise-grade security with 99.9% uptime guarantee.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Team Collaboration</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Work together seamlessly with advanced collaboration tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Trusted by teams worldwide
            </h2>
            <p className="mt-3 text-xl text-blue-200 sm:mt-4">
              Join thousands of satisfied customers
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-blue-200">
                Active Users
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                50K+
              </dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-blue-200">
                Countries
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                100+
              </dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-blue-200">
                Uptime
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                99.9%
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-blue-600">Start your free trial today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="#signup" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`
      },
      {
        path: 'app/layout.tsx',
        type: 'file',
        content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SaaS Platform - Transform Your Business',
  description: 'Streamline your workflow and scale your business with our powerful SaaS platform',
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
        path: 'app/globals.css',
        type: 'file',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
      }
    ];
  }

  private static getEcommerceTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'ecommerce-store',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
          }
        }, null, 2)
      },
      {
        path: 'app',
        type: 'directory'
      },
      {
        path: 'app/page.tsx',
        type: 'file',
        content: `import Link from 'next/link';
import { ShoppingBag, Star, Heart, Search } from 'lucide-react';

export default function Home() {
  const products = [
    { id: 1, name: 'Premium Headphones', price: 199, image: '/api/placeholder/300/300', rating: 4.5 },
    { id: 2, name: 'Wireless Speaker', price: 89, image: '/api/placeholder/300/300', rating: 4.8 },
    { id: 3, name: 'Smart Watch', price: 299, image: '/api/placeholder/300/300', rating: 4.2 },
    { id: 4, name: 'Laptop Stand', price: 49, image: '/api/placeholder/300/300', rating: 4.6 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-blue-600">Tech</span>Store
              </h1>
            </div>
            
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                <Heart className="h-6 w-6" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 relative">
                <ShoppingBag className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>
              <Link href="/login" className="text-gray-700 hover:text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Premium tech</span>
                  <span className="block text-blue-600 xl:inline"> at great prices</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Discover the latest gadgets and electronics with fast shipping and excellent customer service.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="#products" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div id="products" className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Featured Products</h2>

        <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Product Image</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm text-gray-700">
                    <Link href={'/products/' + product.id}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <button className="text-gray-400 hover:text-red-500">
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={'h-4 w-4 ' + (i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300')} fill="currentColor" />
                  ))}
                  <span className="text-sm text-gray-500 ml-2">({product.rating})</span>
                </div>
                <p className="text-lg font-medium text-gray-900 mt-2">${product.price}</p>
                <button className="mt-4 w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="px-6 py-6 bg-blue-600 rounded-lg md:py-12 md:px-12 lg:py-16 lg:px-16 xl:flex xl:items-center">
            <div className="xl:w-0 xl:flex-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Get exclusive deals
              </h2>
              <p className="mt-3 max-w-3xl text-lg leading-6 text-blue-200">
                Sign up for our newsletter and be the first to know about new products and special offers.
              </p>
            </div>
            <div className="mt-8 sm:w-full sm:max-w-md xl:mt-0 xl:ml-8">
              <div className="sm:flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border-white px-5 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white rounded-md"
                />
                <button className="mt-3 w-full flex items-center justify-center px-5 py-3 border border-transparent shadow text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white sm:mt-0 sm:ml-3 sm:w-auto sm:flex-shrink-0">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`
      },
      {
        path: 'app/layout.tsx',
        type: 'file',
        content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TechStore - Premium Electronics',
  description: 'Your one-stop shop for premium tech and electronics',
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
        path: 'app/globals.css',
        type: 'file',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
      }
    ];
  }

  private static getPortfolioTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'portfolio-website',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
          }
        }, null, 2)
      },
      {
        path: 'app',
        type: 'directory'
      },
      {
        path: 'app/page.tsx',
        type: 'file',
        content: `import Link from 'next/link';
import { Github, Linkedin, Mail, ExternalLink, Download } from 'lucide-react';

export default function Home() {
  const projects = [
    { 
      id: 1, 
      title: 'E-Commerce Platform', 
      description: 'Full-stack online store with React, Node.js, and Stripe',
      tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      image: '/api/placeholder/400/300',
      github: '#',
      live: '#'
    },
    { 
      id: 2, 
      title: 'Task Management App', 
      description: 'Collaborative project management tool with real-time updates',
      tech: ['Next.js', 'TypeScript', 'Socket.io', 'PostgreSQL'],
      image: '/api/placeholder/400/300',
      github: '#',
      live: '#'
    },
    { 
      id: 3, 
      title: 'Weather Dashboard', 
      description: 'Beautiful weather app with forecasting and location search',
      tech: ['Vue.js', 'Express.js', 'Weather API', 'Chart.js'],
      image: '/api/placeholder/400/300',
      github: '#',
      live: '#'
    }
  ];

  const skills = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Node.js',
    'Express.js', 'MongoDB', 'PostgreSQL', 'HTML', 'CSS', 'Tailwind CSS',
    'Git', 'Docker', 'AWS', 'Figma'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-sm z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-gray-900">
              John Doe
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="#about" className="text-gray-700 hover:text-blue-600">About</Link>
              <Link href="#projects" className="text-gray-700 hover:text-blue-600">Projects</Link>
              <Link href="#skills" className="text-gray-700 hover:text-blue-600">Skills</Link>
              <Link href="#contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mx-auto mb-8 flex items-center justify-center text-white text-6xl font-bold">
              JD
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Full-Stack Developer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            I create beautiful, responsive web applications using modern technologies. 
            Passionate about clean code, user experience, and solving complex problems.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#contact" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Get In Touch
            </Link>
            <Link href="#" className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Resume
            </Link>
          </div>
          <div className="flex justify-center space-x-6 mt-8">
            <Link href="#" className="text-gray-600 hover:text-blue-600">
              <Github className="w-6 h-6" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-blue-600">
              <Linkedin className="w-6 h-6" />
            </Link>
            <Link href="#contact" className="text-gray-600 hover:text-blue-600">
              <Mail className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">About Me</h2>
          <div className="prose prose-lg mx-auto text-gray-600">
            <p>
              I'm a passionate full-stack developer with over 5 years of experience building web applications. 
              I love turning complex problems into simple, beautiful designs, and I enjoy working with both 
              the technical and creative aspects of development.
            </p>
            <p>
              When I'm not coding, you can find me exploring new technologies, contributing to open source 
              projects, or enjoying the outdoors with my camera.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">Project Image</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-4">
                    <Link href={project.github} className="text-gray-600 hover:text-blue-600">
                      <Github className="w-5 h-5" />
                    </Link>
                    <Link href={project.live} className="text-gray-600 hover:text-blue-600">
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Skills & Technologies</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {skills.map((skill) => (
              <span key={skill} className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm border">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Get In Touch</h2>
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-8">
              I'm always interested in new opportunities and interesting projects. 
              Let's talk about how we can work together!
            </p>
            <Link href="mailto:john@example.com" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors inline-flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Send Email
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 John Doe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}`
      },
      {
        path: 'app/layout.tsx',
        type: 'file',
        content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'John Doe - Full-Stack Developer',
  description: 'Portfolio of John Doe, a passionate full-stack developer',
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
        path: 'app/globals.css',
        type: 'file',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}`
      }
    ];
  }

  private static getDashboardTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'admin-dashboard',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
            'type-check': 'tsc --noEmit'
          },
          dependencies: {
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
            'tailwind-merge': '^2.0.0'
          },
          devDependencies: {
            '@types/node': '^20.8.0',
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            'autoprefixer': '^10.4.0',
            'postcss': '^8.4.0',
            'eslint': '^8.0.0',
            'eslint-config-next': '^14.0.0'
          }
        }, null, 2)
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
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
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
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
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
      {
        path: 'tsconfig.json',
        type: 'file',
        content: JSON.stringify({
          "compilerOptions": {
            "target": "es5",
            "lib": ["dom", "dom.iterable", "es6"],
            "allowJs": true,
            "skipLibCheck": true,
            "strict": true,
            "noEmit": true,
            "esModuleInterop": true,
            "module": "esnext",
            "moduleResolution": "bundler",
            "resolveJsonModule": true,
            "isolatedModules": true,
            "jsx": "preserve",
            "incremental": true,
            "plugins": [
              {
                "name": "next"
              }
            ],
            "baseUrl": ".",
            "paths": {
              "@/*": ["./src/*"],
              "@/components/*": ["./src/components/*"],
              "@/lib/*": ["./src/lib/*"],
              "@/types/*": ["./src/types/*"]
            }
          },
          "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          "exclude": ["node_modules"]
        }, null, 2)
      },
      {
        path: 'app',
        type: 'directory'
      },
      {
        path: 'app/page.tsx',
        type: 'file',
        content: `import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard
  redirect('/dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 bg-blue-600">
          <h1 className="text-white text-xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <Link href="#" className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg">
              <BarChart className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 mr-3" />
              Users
            </Link>
            <Link href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 mr-3" />
              Orders
            </Link>
            <Link href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <DollarSign className="w-5 h-5 mr-3" />
              Revenue
            </Link>
            <Link href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
              <p className="text-gray-600">Welcome back, John!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="relative text-gray-600 hover:text-gray-800">
                <Bell className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                J
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change} from last month</p>
                  </div>
                  <div className={'w-12 h-12 ' + stat.color + ' rounded-lg flex items-center justify-center'}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="p-6 flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">New user registered</p>
                  <p className="text-sm text-gray-600">john.doe@example.com joined the platform</p>
                </div>
                <span className="text-sm text-gray-500">2 min ago</span>
              </div>
              <div className="p-6 flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">New order placed</p>
                  <p className="text-sm text-gray-600">Order #12345 for $299.99</p>
                </div>
                <span className="text-sm text-gray-500">5 min ago</span>
              </div>
              <div className="p-6 flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Product updated</p>
                  <p className="text-sm text-gray-600">Premium Headphones inventory updated</p>
                </div>
                <span className="text-sm text-gray-500">10 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`
      },
      {
        path: 'app/layout.tsx',
        type: 'file',
        content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Dashboard - Analytics & Management',
  description: 'Comprehensive admin dashboard for business analytics and management',
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
        path: 'app/globals.css',
        type: 'file',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`
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
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
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
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
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
      {
        path: 'tsconfig.json',
        type: 'file',
        content: `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`
      },
      {
        path: 'src',
        type: 'directory'
      },
      {
        path: 'src/components',
        type: 'directory'
      },
      {
        path: 'src/lib',
        type: 'directory'
      },
      {
        path: 'src/lib/utils.ts',
        type: 'file',
        content: `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
  }).format(new Date(date))
}
`
      },
      {
        path: 'app/dashboard',
        type: 'directory'
      },
      {
        path: 'app/dashboard/layout.tsx',
        type: 'file',
        content: `'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  ShoppingCart,
  FileText,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href} className={'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ' + (isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')} onClick={() => setSidebarOpen(false)}>
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-0 lg:pl-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block ml-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">JD</span>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
`
      },
      {
        path: 'app/dashboard/users',
        type: 'directory'
      },
      {
        path: 'app/dashboard/page.tsx',
        type: 'file',
        content: `'use client';

import React from 'react';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  CreditCard
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const salesData = [
  { name: 'Jan', sales: 4000, users: 2400, orders: 240 },
  { name: 'Feb', sales: 3000, users: 1398, orders: 139 },
  { name: 'Mar', sales: 2000, users: 9800, orders: 980 },
  { name: 'Apr', sales: 2780, users: 3908, orders: 390 },
  { name: 'May', sales: 1890, users: 4800, orders: 480 },
  { name: 'Jun', sales: 2390, users: 3800, orders: 380 },
];

const pieData = [
  { name: 'Desktop', value: 400, color: '#8884d8' },
  { name: 'Mobile', value: 300, color: '#82ca9d' },
  { name: 'Tablet', value: 200, color: '#ffc658' },
  { name: 'Other', value: 100, color: '#ff7c7c' },
];

const stats = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1%',
    changeType: 'positive',
    icon: DollarSign,
    description: '+19% from last month',
  },
  {
    title: 'Subscriptions',
    value: '+2350',
    change: '+180.1%',
    changeType: 'positive',
    icon: Users,
    description: '+201 since last week',
  },
  {
    title: 'Sales',
    value: '+12,234',
    change: '+19%',
    changeType: 'positive',
    icon: CreditCard,
    description: '+201 since last hour',
  },
  {
    title: 'Active Now',
    value: '+573',
    change: '+201',
    changeType: 'positive',
    icon: Activity,
    description: '+201 since last hour',
  },
];

const recentSales = [
  { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '+$1,999.00', avatar: 'OM' },
  { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '+$39.00', avatar: 'JL' },
  { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '+$299.00', avatar: 'IN' },
  { name: 'William Kim', email: 'will@email.com', amount: '+$99.00', avatar: 'WK' },
  { name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: '+$39.00', avatar: 'SD' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">{stat.title}</h3>
              <stat.icon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-600 flex items-center">
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change}
                </span>
                <span className="ml-1">{stat.description}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Overview</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => '$' + value} />
              <Tooltip />
              <Bar dataKey="sales" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-3 rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
          <div className="space-y-4">
            {recentSales.map((sale, index) => (
              <div key={index} className="flex items-center">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{sale.avatar}</span>
                </div>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{sale.name}</p>
                  <p className="text-sm text-gray-600">{sale.email}</p>
                </div>
                <div className="ml-auto font-medium">{sale.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Device Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => name + ' ' + (percent * 100).toFixed(0) + '%'} outerRadius={80} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={'cell-' + index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
`
      },
      {
        path: 'app/dashboard/users/page.tsx',
        type: 'file',
        content: `'use client';

import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Users } from 'lucide-react';

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-15 09:30', avatar: 'JD' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', status: 'Active', lastLogin: '2024-01-14 16:45', avatar: 'JS' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'User', status: 'Inactive', lastLogin: '2024-01-10 14:20', avatar: 'MJ' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'User', status: 'Active', lastLogin: '2024-01-15 11:15', avatar: 'SW' },
];

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role.toLowerCase() === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-gray-600">Manage your team members and their permissions</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">{users.filter(u => u.status === 'Active').length}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold">{users.filter(u => u.role === 'Admin').length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Last Login</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{user.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (user.role === 'Admin' ? 'bg-red-100 text-red-700' : user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>{user.role}</span>
                  </td>
                  <td className="p-4">
                    <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>{user.status}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{user.lastLogin}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`
      }
    ];
  }

  private static getBlogTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'blog-website',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
          }
        }, null, 2)
      },
      {
        path: 'app',
        type: 'directory'
      },
      {
        path: 'app/page.tsx',
        type: 'file',
        content: `import Link from 'next/link';
import { Calendar, Clock, User, Tag, ArrowRight, Search } from 'lucide-react';

export default function Home() {
  const posts = [
    {
      id: 1,
      title: 'Getting Started with Next.js 14',
      excerpt: 'Learn how to build modern web applications with the latest features in Next.js 14, including the App Router and Server Components.',
      author: 'John Doe',
      date: '2024-01-15',
      readTime: '5 min read',
      category: 'Web Development',
      tags: ['Next.js', 'React', 'JavaScript'],
      image: '/api/placeholder/600/400'
    },
    {
      id: 2,
      title: 'Mastering CSS Grid Layout',
      excerpt: 'Dive deep into CSS Grid and learn how to create complex, responsive layouts with ease. Complete guide with practical examples.',
      author: 'Jane Smith',
      date: '2024-01-12',
      readTime: '8 min read',
      category: 'CSS',
      tags: ['CSS', 'Layout', 'Grid'],
      image: '/api/placeholder/600/400'
    },
    {
      id: 3,
      title: 'TypeScript Best Practices',
      excerpt: 'Explore advanced TypeScript patterns and best practices that will make your code more maintainable and type-safe.',
      author: 'Mike Johnson',
      date: '2024-01-10',
      readTime: '6 min read',
      category: 'TypeScript',
      tags: ['TypeScript', 'Best Practices', 'Development'],
      image: '/api/placeholder/600/400'
    }
  ];

  const categories = [
    { name: 'Web Development', count: 12 },
    { name: 'JavaScript', count: 8 },
    { name: 'CSS', count: 6 },
    { name: 'TypeScript', count: 4 },
    { name: 'React', count: 10 },
    { name: 'Node.js', count: 5 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-blue-600">Dev</span>Blog
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-blue-600 font-medium">Home</Link>
              <Link href="/categories" className="text-gray-700 hover:text-blue-600">Categories</Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to DevBlog
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Insights, tutorials, and thoughts on web development, design, and technology
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Posts</h2>
              
              {/* Featured Post */}
              <article className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <div className="h-64 md:h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">Featured Image</span>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8">
                    <div className="flex items-center mb-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {posts[0].category}
                      </span>
                      <span className="text-gray-500 text-sm ml-4 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {posts[0].date}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      <Link href={'/posts/' + posts[0].id} className="hover:text-blue-600">
                        {posts[0].title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 mb-4">{posts[0].excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1" />
                        {posts[0].author}
                        <Clock className="w-4 h-4 ml-4 mr-1" />
                        {posts[0].readTime}
                      </div>
                      <Link href={'/posts/' + posts[0].id} className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>

              {/* Post Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                {posts.slice(1).map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">Post Image</span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {post.category}
                        </span>
                        <span className="text-gray-500 text-sm ml-3 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {post.date}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        <Link href={'/posts/' + post.id} className="hover:text-blue-600">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="w-3 h-3 mr-1" />
                          {post.author}
                          <Clock className="w-3 h-3 ml-3 mr-1" />
                          {post.readTime}
                        </div>
                        <Link href={'/posts/' + post.id} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Read More
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Link key={category.name} href={'/category/' + category.name.toLowerCase()} className="flex justify-between items-center text-gray-700 hover:text-blue-600 py-1">
                    <span>{category.name}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {category.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Newsletter</h3>
              <p className="text-gray-600 mb-4">
                Subscribe to get the latest posts delivered right to your inbox.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">DevBlog</h3>
              <p className="text-gray-300">
                A place for developers to share knowledge, learn new technologies, and grow together.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-300 hover:text-white">Twitter</Link>
                <Link href="#" className="text-gray-300 hover:text-white">GitHub</Link>
                <Link href="#" className="text-gray-300 hover:text-white">LinkedIn</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 DevBlog. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}`
      },
      {
        path: 'app/layout.tsx',
        type: 'file',
        content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DevBlog - Web Development Insights',
  description: 'Insights, tutorials, and thoughts on web development, design, and technology',
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
        path: 'app/globals.css',
        type: 'file',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
      }
    ];
  }
}