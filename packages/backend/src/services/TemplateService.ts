import { db } from '../config/database';
import { ProjectTemplate, TemplateFile } from '@swistack/shared';

export class TemplateService {
  static async getAll(): Promise<ProjectTemplate[]> {
    return await db('project_templates')
      .where('isActive', true)
      .orderBy('isOfficial', 'desc')
      .orderBy('category')
      .orderBy('name');
  }

  static async getByKey(key: string): Promise<ProjectTemplate | null> {
    const template = await db('project_templates')
      .where('key', key)
      .where('isActive', true)
      .first();
    
    if (template) {
      template.files = JSON.parse(template.files);
      template.dependencies = JSON.parse(template.dependencies);
      template.scripts = JSON.parse(template.scripts);
      template.config = JSON.parse(template.config);
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
      files: JSON.parse(template.files),
      dependencies: JSON.parse(template.dependencies),
      scripts: JSON.parse(template.scripts),
      config: JSON.parse(template.config),
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
}