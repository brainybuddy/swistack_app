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
      try {
        // Safe JSON parsing with fallback
        template.files = this.safeJSONParse(template.files, []);
        template.dependencies = this.safeJSONParse(template.dependencies, {});
        template.scripts = this.safeJSONParse(template.scripts, {});
        template.config = this.safeJSONParse(template.config, {});
      } catch (error) {
        console.error(`Error parsing template data for ${key}:`, error);
        return null;
      }
    }
    
    return template || null;
  }

  private static safeJSONParse(jsonString: any, fallback: any): any {
    // If it's already an object or array, return it directly
    if (typeof jsonString === 'object' && jsonString !== null) {
      return jsonString;
    }
    
    if (!jsonString || jsonString === '[object Object]') {
      return fallback;
    }
    
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parse error:', error, 'Input:', jsonString);
      return fallback;
    }
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
    console.log('🧹 Clearing existing templates to fix JSON parsing issues...');
    
    try {
      // Clear existing templates to fix JSON parsing issues
      await db('project_templates').del();
    } catch (error) {
      console.error('❌ Error clearing templates:', error);
      // Continue anyway
    }
    
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
        files: TemplateService.getReactTemplateFiles(),
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
        files: TemplateService.getNodeExpressTemplateFiles(),
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
        files: TemplateService.getPythonFlaskTemplateFiles(),
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
        files: TemplateService.getNextjsTemplateFiles(),
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
        files: TemplateService.getVueTemplateFiles(),
        icon: '💚',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },

      // Next.js E-learning Platform Template
      {
        name: 'Next.js E-learning Platform',
        key: 'nextjs-elearning',
        description: 'Course management with videos, quizzes, and progress tracking - comprehensive MVP-ready platform',
        category: 'fullstack',
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
          'lucide-react': '^0.263.1',
          '@headlessui/react': '^1.7.0',
          '@heroicons/react': '^2.0.0',
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
        files: TemplateService.getEnhancedElearningTemplateFiles(),
        icon: '🎓',
        version: '1.0.0',
        isActive: true,
        isOfficial: true,
      },
    ];

    // Use a transaction to ensure all templates are inserted atomically
    await db.transaction(async (trx) => {
      for (const template of templates) {
        try {
          const existing = await trx('project_templates').where('key', template.key).first();
          if (!existing) {
            console.log(`📝 Inserting template: ${template.key}`);
            await trx('project_templates').insert({
              ...template,
              files: JSON.stringify(template.files),
              dependencies: JSON.stringify(template.dependencies),
              scripts: JSON.stringify(template.scripts),
              config: JSON.stringify(template.config),
            });
            console.log(`✅ Template ${template.key} inserted successfully`);
          }
        } catch (error) {
          console.error(`❌ Error inserting template ${template.key}:`, error);
          throw error; // Re-throw to rollback transaction
        }
      }
    });
    
    // Verify templates were inserted
    const count = await db('project_templates').count('* as count').first();
    console.log(`📊 Total templates in database: ${count?.count || 0}`);
    
    // Force a check to see if they're really there
    const allTemplates = await db('project_templates').select('key', 'name');
    console.log('📋 Templates actually in DB:', allTemplates.length);
    for (const t of allTemplates) {
      console.log(`   - ${t.key}: ${t.name}`);
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

  private static getEnhancedElearningTemplateFiles(): TemplateFile[] {
    return [
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify({
          name: 'edulearn-platform',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
          },
          dependencies: {
            'next': '14.0.0',
            'react': '^18',
            'react-dom': '^18',
            'lucide-react': '^0.263.1',
            '@headlessui/react': '^1.7.0',
            '@heroicons/react': '^2.0.0'
          },
          devDependencies: {
            'typescript': '^5',
            '@types/node': '^20',
            '@types/react': '^18',
            '@types/react-dom': '^18',
            'autoprefixer': '^10.0.1',
            'postcss': '^8',
            'tailwindcss': '^3.3.0',
            'eslint': '^8',
            'eslint-config-next': '14.0.0',
            'prisma': '^5.7.0',
            '@prisma/client': '^5.7.0',
            'sqlite3': '^5.1.6'
          }
        }, null, 2)
      },
      
      // Prisma Schema
      {
        path: 'prisma/schema.prisma',
        type: 'file',
        content: `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Course {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  instructor  String
  duration    String
  level       String
  category    String
  image       String
  enrolled    Int      @default(0)
  rating      Float    @default(0.0)
  price       Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lessons     Lesson[]
  enrollments Enrollment[]
}

model Lesson {
  id        String  @id @default(cuid())
  title     String
  duration  String
  videoUrl  String
  completed Boolean @default(false)
  courseId  Int
  course    Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)
}

model User {
  id            Int          @id @default(autoincrement())
  name          String
  email         String       @unique
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  enrollments   Enrollment[]
}

model Enrollment {
  id       Int    @id @default(autoincrement())
  userId   Int
  courseId Int
  progress Float  @default(0)
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  @@unique([userId, courseId])
}`
      },
      
      // Database utilities
      {
        path: 'lib/db.ts',
        type: 'file',
        content: `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`
      },
      
      // Environment variables
      {
        path: '.env.local',
        type: 'file',
        content: `# Database
DATABASE_URL="file:./dev.db"

# App Configuration
NEXT_PUBLIC_APP_NAME="EduLearn Pro"
NEXT_PUBLIC_APP_DESCRIPTION="Full-stack e-learning platform with real database"`
      },
      {
        path: 'app',
        type: 'directory'
      },
      
      // API Routes - Courses
      {
        path: 'app/api/courses/route.ts',
        type: 'file',
        content: `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        lessons: true,
        enrollments: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        instructor: body.instructor,
        duration: body.duration,
        level: body.level,
        category: body.category,
        image: body.image || 'https://picsum.photos/400/300',
        price: body.price,
        rating: body.rating || 0,
        enrolled: body.enrolled || 0,
      },
      include: {
        lessons: true,
        enrollments: true,
      }
    })
    
    return NextResponse.json(course)
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}`
      },
      
      // API Routes - Individual Course
      {
        path: 'app/api/courses/[id]/route.ts',
        type: 'file',
        content: `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        lessons: true,
        enrollments: {
          include: { user: true }
        },
      }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}`
      },
      
      // Database Seeder API
      {
        path: 'app/api/seed/route.ts',
        type: 'file',
        content: `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Clear existing data
    await prisma.enrollment.deleteMany()
    await prisma.lesson.deleteMany()
    await prisma.course.deleteMany()
    await prisma.user.deleteMany()
    
    // Create sample courses with lessons
    const courses = await Promise.all([
      prisma.course.create({
        data: {
          title: 'React Fundamentals',
          description: 'Learn the basics of React including components, hooks, and state management.',
          instructor: 'Sarah Johnson',
          duration: '8 weeks',
          level: 'Beginner',
          category: 'Frontend',
          image: 'https://picsum.photos/400/300?random=1',
          price: 99.99,
          rating: 4.8,
          enrolled: 1250,
          lessons: {
            create: [
              { title: 'Introduction to React', duration: '15 min', videoUrl: 'https://example.com/video1' },
              { title: 'Components and Props', duration: '25 min', videoUrl: 'https://example.com/video2' },
              { title: 'State and Hooks', duration: '30 min', videoUrl: 'https://example.com/video3' },
            ]
          }
        }
      }),
      prisma.course.create({
        data: {
          title: 'Node.js Backend Development',
          description: 'Build scalable backend applications with Node.js, Express, and databases.',
          instructor: 'Mike Chen',
          duration: '10 weeks',
          level: 'Intermediate',
          category: 'Backend',
          image: 'https://picsum.photos/400/300?random=2',
          price: 149.99,
          rating: 4.6,
          enrolled: 890,
        }
      }),
      prisma.course.create({
        data: {
          title: 'Full-Stack JavaScript',
          description: 'Complete full-stack development course covering React, Node.js, and databases.',
          instructor: 'Emma Davis',
          duration: '16 weeks',
          level: 'Advanced',
          category: 'Full-Stack',
          image: 'https://picsum.photos/400/300?random=3',
          price: 199.99,
          rating: 4.9,
          enrolled: 654,
        }
      })
    ])
    
    // Create sample user
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    })
    
    return NextResponse.json({ 
      message: 'Database seeded successfully',
      courses: courses.length,
      user: user.name
    })
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}`
      },
      {
        path: 'app/types',
        type: 'directory'
      },
      {
        path: 'app/types/index.ts',
        type: 'file',
        content: `export interface User {
  id: number;
  name: string;
  email: string;
  enrolledCourses: number[];
  completedLessons: string[];
  progress: { [courseId: number]: number };
  certificates: Certificate[];
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  image: string;
  lessons: Lesson[];
  enrolled: number;
  rating: number;
  price: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  completed?: boolean;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: Question[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Progress {
  userId: number;
  courseId: number;
  completedLessons: string[];
  currentLesson: string;
  percentage: number;
  lastAccessed: Date;
}

export interface Certificate {
  id: string;
  courseId: number;
  courseName: string;
  issuedDate: Date;
  instructor: string;
}`
      },
      {
        path: 'app/components',
        type: 'directory'
      },
      {
        path: 'app/components/Navbar.tsx',
        type: 'file',
        content: `'use client';

import { useState } from 'react';
import { BookOpen, User, Menu, X, Search, Bell } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EduLearn</span>
            </div>
          </div>

          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
            <button className="flex items-center text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
              <User className="h-5 w-5" />
              <span className="ml-1 text-sm">Profile</span>
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                Notifications
              </button>
              <button className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}`
      },
      {
        path: 'app/components/CourseCard.tsx',
        type: 'file',
        content: `'use client';

import { Course } from '../types';
import { Clock, Users, Star, DollarSign } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: number) => void;
}

export default function CourseCard({ course, onEnroll }: CourseCardProps) {
  const handleEnroll = () => {
    if (onEnroll) {
      onEnroll(course.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="text-white text-center">
            <h3 className="text-lg font-bold mb-2">{course.title}</h3>
            <p className="text-sm opacity-90">{course.category}</p>
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <span className={\`px-2 py-1 text-xs font-medium rounded-full \${
            course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
            course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }\`}>
            {course.level}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{course.enrolled} students</span>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            <span>{course.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-xl font-bold text-green-600">{course.price}</span>
          </div>
          <button
            onClick={handleEnroll}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Enroll Now
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Instructor:</span> {course.instructor}
          </p>
        </div>
      </div>
    </div>
  );
}`
      },
      {
        path: 'app/components/Dashboard.tsx',
        type: 'file',
        content: `'use client';

import { useState } from 'react';
import { BookOpen, Clock, Award, TrendingUp, Play, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [user] = useState({
    name: 'John Doe',
    enrolledCourses: 3,
    completedCourses: 1,
    totalHours: 24,
    certificates: 1,
  });

  const [recentActivity] = useState([
    { id: 1, course: 'React Fundamentals', lesson: 'Components and Props', progress: 75, lastAccessed: '2 hours ago' },
    { id: 2, course: 'Node.js Backend', lesson: 'Express Routing', progress: 60, lastAccessed: '1 day ago' },
    { id: 3, course: 'Python Data Science', lesson: 'Pandas Introduction', progress: 90, lastAccessed: '3 days ago' },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
        <p className="text-gray-600 mt-2">Continue your learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Enrolled Courses</p>
              <p className="text-2xl font-bold text-blue-900">{user.enrolledCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-900">{user.completedCourses}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Learning Hours</p>
              <p className="text-2xl font-bold text-purple-900">{user.totalHours}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Certificates</p>
              <p className="text-2xl font-bold text-yellow-900">{user.certificates}</p>
            </div>
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Continue Learning</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{activity.course}</h3>
                  <span className="text-sm text-gray-500">{activity.lastAccessed}</span>
                </div>
                <p className="text-gray-600 mb-3">{activity.lesson}</p>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{activity.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: \`\${activity.progress}%\` }}
                      ></div>
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Learning Goals</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Weekly Goal</h3>
              <p className="text-gray-600 text-sm mb-4">Complete 3 lessons this week</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-gray-600">2 of 3 lessons completed</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-sm text-gray-700">Quiz: React Hooks</span>
                <span className="text-xs text-red-600 font-medium">Due Today</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <span className="text-sm text-gray-700">Assignment: API Project</span>
                <span className="text-xs text-yellow-600 font-medium">3 days left</span>
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
        path: 'app/page.tsx',
        type: 'file',
        content: `'use client';

import { useState, useEffect } from 'react';
import { Course, User } from './types';
import Navbar from './components/Navbar';
import CourseCard from './components/CourseCard';
import Dashboard from './components/Dashboard';
import { BookOpen, Users, Award, Play, Search, Filter } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');

  const categories = ['All', 'Frontend', 'Backend', 'Full-Stack', 'Data Science', 'Mobile', 'DevOps'];

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    enrolledCourses: [1, 3],
    completedLessons: [],
    progress: { 1: 45, 3: 20 },
    certificates: [],
  };

  const mockCourses: Course[] = [
    {
      id: 1,
      title: 'Complete React Development',
      description: 'Master React from basics to advanced concepts including hooks, context, and performance optimization.',
      instructor: 'Sarah Johnson',
      duration: '12 weeks',
      level: 'Intermediate',
      category: 'Frontend',
      image: 'https://picsum.photos/400/300?random=1',
      lessons: [
        { id: '1-1', title: 'Introduction to React', duration: '45 min', videoUrl: '' },
        { id: '1-2', title: 'Components and JSX', duration: '60 min', videoUrl: '' },
        { id: '1-3', title: 'State and Props', duration: '55 min', videoUrl: '' },
      ],
      enrolled: 1247,
      rating: 4.8,
      price: 89,
    },
    {
      id: 2,
      title: 'Node.js Backend Mastery',
      description: 'Build scalable backend applications with Node.js, Express, and MongoDB.',
      instructor: 'Michael Chen',
      duration: '10 weeks',
      level: 'Advanced',
      category: 'Backend',
      image: 'https://picsum.photos/400/300?random=2',
      lessons: [
        { id: '2-1', title: 'Node.js Fundamentals', duration: '50 min', videoUrl: '' },
        { id: '2-2', title: 'Express.js Framework', duration: '75 min', videoUrl: '' },
      ],
      enrolled: 892,
      rating: 4.9,
      price: 129,
    },
    {
      id: 3,
      title: 'Python Data Science',
      description: 'Learn data analysis, visualization, and machine learning with Python.',
      instructor: 'Dr. Emily Wang',
      duration: '14 weeks',
      level: 'Beginner',
      category: 'Data Science',
      image: 'https://picsum.photos/400/300?random=3',
      lessons: [
        { id: '3-1', title: 'Python Basics for Data Science', duration: '65 min', videoUrl: '' },
        { id: '3-2', title: 'NumPy and Pandas', duration: '80 min', videoUrl: '' },
      ],
      enrolled: 1560,
      rating: 4.7,
      price: 99,
    },
    {
      id: 4,
      title: 'Full-Stack Web Development',
      description: 'Complete web development course covering frontend, backend, and deployment.',
      instructor: 'Alex Rodriguez',
      duration: '16 weeks',
      level: 'Intermediate',
      category: 'Full-Stack',
      image: 'https://picsum.photos/400/300?random=4',
      lessons: [
        { id: '4-1', title: 'HTML, CSS, JavaScript', duration: '90 min', videoUrl: '' },
        { id: '4-2', title: 'React Frontend', duration: '120 min', videoUrl: '' },
      ],
      enrolled: 2103,
      rating: 4.6,
      price: 149,
    },
  ];

  useEffect(() => {
    setUser(mockUser);
    
    // Fetch courses from API
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        setFilteredCourses(data);
        setDbStatus('connected');
      } else {
        // Fallback to mock data if API fails
        setCourses(mockCourses);
        setFilteredCourses(mockCourses);
        setDbStatus('disconnected');
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      // Fallback to mock data
      setCourses(mockCourses);
      setFilteredCourses(mockCourses);
      setDbStatus('disconnected');
    }
  };

  const seedDatabase = async () => {
    try {
      const response = await fetch('/api/seed', { method: 'POST' });
      if (response.ok) {
        alert('Database seeded successfully!');
        fetchCourses(); // Refresh courses
      } else {
        alert('Failed to seed database');
      }
    } catch (error) {
      console.error('Failed to seed database:', error);
      alert('Failed to seed database');
    }
  };

  useEffect(() => {
    let filtered = courses;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [courses, selectedCategory, searchTerm]);

  const handleEnroll = (courseId: number) => {
    const progress = Math.floor(Math.random() * 76) + 5;
    
    setUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        enrolledCourses: [...prevUser.enrolledCourses, courseId],
        progress: { ...prevUser.progress, [courseId]: progress }
      };
    });

    alert(\`Successfully enrolled in course! Your progress: \${progress}%\`);
  };

  if (showDashboard && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <button
              onClick={() => setShowDashboard(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse Courses
            </button>
          </div>
          <Dashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Database Status Indicator */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={\`w-3 h-3 rounded-full \${
                dbStatus === 'connected' ? 'bg-green-500' : 
                dbStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
              }\`}></div>
              <span className="text-sm font-medium text-gray-700">
                Database: {dbStatus === 'connected' ? 'Connected' : 
                          dbStatus === 'disconnected' ? 'Using Mock Data' : 'Connecting...'}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {courses.length} courses loaded
            </span>
          </div>
          {dbStatus === 'connected' && (
            <button
              onClick={seedDatabase}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
            >
              Seed Database
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Transform Your Career with EduLearn</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of learners mastering in-demand skills with our comprehensive online courses.
            Expert instructors, hands-on projects, and career support included.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowDashboard(true)}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Dashboard
            </button>
            <button className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors border-2 border-white">
              Start Learning Today
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Expert-Led Courses</h3>
            <p className="text-gray-600">Learn from industry professionals with real-world experience</p>
          </div>
          <div className="text-center p-6">
            <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Community Support</h3>
            <p className="text-gray-600">Connect with fellow learners and get help when you need it</p>
          </div>
          <div className="text-center p-6">
            <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Certificates</h3>
            <p className="text-gray-600">Earn verified certificates to showcase your achievements</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Featured Courses</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={\`px-4 py-2 rounded-full text-sm font-medium transition-colors \${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }\`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchTerm('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
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
  title: 'EduLearn - Transform Your Career',
  description: 'Master in-demand skills with expert-led online courses. Join thousands of learners building their future.',
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
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}`
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
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
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
    domains: ['localhost'],
  },
}`
      },
      {
        path: 'postcss.config.js',
        type: 'file',
        content: `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

module.exports = config`
      },
      {
        path: '.env.example',
        type: 'file',
        content: `# Application
NEXT_PUBLIC_APP_NAME=EduLearn
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (when implementing backend)
DATABASE_URL=postgresql://username:password@localhost:5432/edulearn

# Authentication (when implementing auth)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Video Storage (for future video hosting)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Service (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment (when implementing payments)
STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key`
      }
    ];
  }
}