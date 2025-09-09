import * as Knex from 'knex';
import * as fs from 'fs';
import * as path from 'path';

export async function seed(knex: Knex): Promise<void> {
  const templateKey = 'comprehensive-elearning-platform';

  // Check if template already exists and delete it to update
  const existing = await knex('project_templates').where('key', templateKey).first();
  if (existing) {
    console.log(`Template ${templateKey} already exists, updating...`);
    await knex('project_templates').where('key', templateKey).del();
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
    console.log(`Found ${files.length} files for template ${templateKey}`);
    
    // Filter out large files and node_modules to prevent database size issues
    files = files.filter(file => {
      if (file.path.includes('node_modules') || file.path.includes('.git') || file.path.includes('package-lock.json')) {
        return false;
      }
      if (file.content && file.content.length > 50000) { // Skip files larger than 50KB
        console.log(`Skipping large file: ${file.path} (${file.content.length} chars)`);
        return false;
      }
      return true;
    });
    console.log(`Filtered to ${files.length} files for template ${templateKey}`);
  } catch (error) {
    console.error('Error reading template directory:', error);
    return;
  }

  const template = {
    key: templateKey,
    name: 'Learnify - E-Learning Platform',
    description: 'A modern e-learning platform featuring expert-led courses, community support, and flexible learning. Built with Next.js 14, TypeScript, and Tailwind CSS with a professional, responsive design.',
    category: 'Educational',
    language: 'TypeScript',
    framework: 'Next.js',
    icon: '🎓',
    isOfficial: true,
    isActive: true,
    version: '1.0.0',
    files: JSON.stringify(files),
    dependencies: JSON.stringify({
      "next": "14.0.4",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "typescript": "^5.3.0",
      "@types/node": "^20.10.0",
      "@types/react": "^18.2.42",
      "@types/react-dom": "^18.2.17",
      "tailwindcss": "^3.3.6",
      "autoprefixer": "^10.4.16",
      "postcss": "^8.4.32",
      "@tailwindcss/forms": "^0.5.7",
      "@tailwindcss/typography": "^0.5.10",
      "@prisma/client": "^5.7.0",
      "prisma": "^5.7.0",
      "next-auth": "^4.24.5",
      "@next-auth/prisma-adapter": "^1.0.7",
      "@tanstack/react-query": "^5.8.4",
      "zustand": "^4.4.7",
      "react-hook-form": "^7.48.2",
      "@hookform/resolvers": "^3.3.2",
      "zod": "^3.22.4",
      "lucide-react": "^0.294.0",
      "class-variance-authority": "^0.7.0",
      "clsx": "^2.0.0",
      "tailwind-merge": "^2.1.0",
      "react-player": "^2.13.0",
      "recharts": "^2.8.0",
      "framer-motion": "^10.16.16",
      "react-hot-toast": "^2.4.1",
      "date-fns": "^2.30.0",
      "@radix-ui/react-slot": "^1.0.2",
      "@radix-ui/react-progress": "^1.0.3",
      "@radix-ui/react-label": "^2.0.2",
      "@radix-ui/react-select": "^2.0.0",
      "@radix-ui/react-dropdown-menu": "^2.0.6",
      "bcryptjs": "^2.4.3",
      "@types/bcryptjs": "^2.4.6"
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