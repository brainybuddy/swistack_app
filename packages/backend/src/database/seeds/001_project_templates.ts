import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing templates
  await knex('project_templates').del();

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
        'dev': 'nodemon --exec ts-node src/server.ts',
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
          content: 'import express from "express";\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.get("/", (req, res) => {\n  res.json({ message: "Hello Express!" });\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});'
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
        'dev': 'flask --app app.py --debug run',
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
          content: 'export default function Home() {\n  return <h1>Welcome to Next.js!</h1>;\n}'
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
    }
  ]);
}