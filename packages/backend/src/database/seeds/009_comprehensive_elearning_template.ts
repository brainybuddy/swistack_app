import * as Knex from 'knex';
import * as fs from 'fs';
import * as path from 'path';

export async function seed(knex: Knex): Promise<void> {
  const templateKey = 'comprehensive-elearning-platform';

  // Check if template already exists
  const existing = await knex('project_templates').where('key', templateKey).first();
  if (existing) {
    console.log(`Template ${templateKey} already exists, skipping...`);
    return;
  }

  // Read all files from the template directory
  const templatePath = path.join(process.cwd(), 'src/services/templates/elearning-platform');
  
  function readDirectory(dirPath: string, relativePath: string = ''): any[] {
    const files: any[] = [];
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const relativeFilePath = path.join(relativePath, item.name).replace(/\\/g, '/');

      if (item.isDirectory()) {
        files.push({
          path: relativeFilePath,
          type: 'directory'
        });
        // Recursively read subdirectories
        files.push(...readDirectory(fullPath, relativeFilePath));
      } else {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          files.push({
            path: relativeFilePath,
            type: 'file',
            content: content
          });
        } catch (error) {
          console.warn(`Could not read file ${fullPath}:`, error);
        }
      }
    }

    return files;
  }

  let files: any[] = [];
  try {
    files = readDirectory(templatePath);
  } catch (error) {
    console.error('Error reading template directory:', error);
    return;
  }

  const template = {
    key: templateKey,
    name: 'E-Learning Platform',
    description: 'A comprehensive online learning management system with courses, modules, quizzes, progress tracking, and interactive features. Built with Next.js 14, TypeScript, Tailwind CSS, and Prisma.',
    category: 'Educational',
    language: 'TypeScript',
    framework: 'Next.js',
    icon: '🎓',
    isOfficial: true,
    isActive: true,
    version: '1.0.0',
    files: JSON.stringify(files),
    dependencies: JSON.stringify({
      "next": "14.0.3",
      "react": "^18",
      "react-dom": "^18",
      "typescript": "^5",
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      "tailwindcss": "^3.3.0",
      "autoprefixer": "^10.0.1",
      "postcss": "^8",
      "prisma": "^5.6.0",
      "@prisma/client": "^5.6.0",
      "next-auth": "^4.24.5",
      "@next-auth/prisma-adapter": "^1.0.7",
      "bcryptjs": "^2.4.3",
      "@types/bcryptjs": "^2.4.6",
      "@tanstack/react-query": "^5.8.4",
      "react-hot-toast": "^2.4.1",
      "class-variance-authority": "^0.7.0",
      "clsx": "^2.0.0",
      "tailwind-merge": "^2.0.0",
      "@radix-ui/react-slot": "^1.0.2",
      "@radix-ui/react-progress": "^1.0.3",
      "@radix-ui/react-label": "^2.0.2",
      "@radix-ui/react-select": "^2.0.0",
      "@radix-ui/react-dropdown-menu": "^2.0.6",
      "lucide-react": "^0.294.0"
    }),
    scripts: JSON.stringify({
      "dev": "next dev -p {{PORT}}",
      "build": "next build",
      "start": "next start -p {{PORT}}",
      "lint": "next lint",
      "type-check": "tsc --noEmit",
      "db:push": "prisma db push",
      "db:studio": "prisma studio",
      "db:generate": "prisma generate"
    }),
    config: JSON.stringify({
      "ports": {
        "main": "{{PORT}}",
        "dev": "{{PORT}}"
      },
      "environment": {
        "DATABASE_URL": "postgresql://username:password@localhost:5432/eduplatform?schema=public",
        "NEXTAUTH_URL": "http://localhost:{{PORT}}",
        "NEXTAUTH_SECRET": "your-secret-key-here"
      },
      "features": [
        "User Authentication (NextAuth.js)",
        "Course Management System", 
        "Progress Tracking",
        "Quiz & Assessments",
        "Interactive Dashboard",
        "Instructor Panel",
        "Student Enrollments",
        "Certificate Generation",
        "Discussion Forums",
        "Mobile Responsive Design"
      ],
      "database": "PostgreSQL with Prisma ORM",
      "styling": "Tailwind CSS with shadcn/ui components"
    })
  };

  await knex('project_templates').insert(template);
  console.log(`✅ Added comprehensive e-learning platform template: ${templateKey}`);
}