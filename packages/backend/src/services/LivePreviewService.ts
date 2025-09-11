import { ProjectFileModel } from '../models/ProjectFile';
import { ProjectModel } from '../models/Project';
import { portAllocationManager } from './PortAllocationManager';
import { storageService } from './StorageService';
import { nixDevServerManager } from './NixDevServerManager';
import { devServerManager } from './DevServerManager';
import path from 'path';

export interface PreviewableProject {
  id: string;
  name: string;
  template: string;
  ports: {
    frontend: number;
    backend: number;
    reserved: number[];
  };
  files: {
    path: string;
    name: string;
    content: string;
    mimeType?: string;
    type: 'file' | 'directory';
  }[];
}

export class LivePreviewService {
  /**
   * Get a project with all its files prepared for live preview
   */
  static async getProjectForPreview(
    projectId: string, 
    userId: string
  ): Promise<PreviewableProject | null> {
    try {
      // Get project details
      const project = await ProjectModel.findById(projectId, userId);
      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Get port allocation
      const portAllocation = portAllocationManager.getProjectAllocation(projectId);
      if (!portAllocation) {
        throw new Error('Port allocation not found for project');
      }

      // Get all project files
      const projectFiles = await ProjectFileModel.getProjectTree(projectId);
      
      // Process files for preview
      const previewFiles = await Promise.all(
        projectFiles.map(async (file) => {
          let content = '';
          
          if (file.type === 'file') {
            if (file.content) {
              // Content stored in database
              content = file.content;
            } else if (file.storageKey) {
              // Content stored in MinIO
              try {
                content = await storageService.downloadFile(file.storageKey);
              } catch (error) {
                console.error(`Failed to download file ${file.path}:`, error);
                content = '// Failed to load file content';
              }
            }
          }

          return {
            path: file.path,
            name: file.name,
            content,
            mimeType: file.mimeType || undefined,
            type: file.type
          };
        })
      );

      return {
        id: project.id,
        name: project.name,
        template: project.template,
        ports: {
          frontend: portAllocation.frontendPort,
          backend: portAllocation.backendPort,
          reserved: portAllocation.reservedPorts
        },
        files: previewFiles
      };
    } catch (error) {
      console.error('Error getting project for preview:', error);
      return null;
    }
  }

  /**
   * Update a file and return the compiled preview HTML
   */
  static async updateFileAndGeneratePreview(
    projectId: string,
    userId: string,
    filePath: string,
    newContent: string
  ): Promise<{ success: boolean; html?: string; error?: string }> {
    try {
      // Update the file
      const file = await ProjectFileModel.findByPath(projectId, filePath);
      if (!file) {
        return { success: false, error: 'File not found' };
      }

      // Check if user has permission to edit
      const project = await ProjectModel.findById(projectId, userId);
      if (!project) {
        return { success: false, error: 'Access denied' };
      }

      // Update file content
      const contentSize = Buffer.byteLength(newContent, 'utf8');
      await ProjectFileModel.updateContent(file.id, newContent, contentSize, userId);

      // Get updated project for preview
      const previewableProject = await this.getProjectForPreview(projectId, userId);
      if (!previewableProject) {
        return { success: false, error: 'Failed to get updated project' };
      }

      // Generate preview HTML
      const html = await this.compileProjectToHTML(previewableProject);

      return { success: true, html };
    } catch (error) {
      console.error('Error updating file and generating preview:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Compile project files to HTML for preview
   */
  static async compileProjectToHTML(project: PreviewableProject): Promise<string> {
    // 1) Prefer a running Nix/Node dev server if present (auto-detect)
    const detected = await this.detectDevServer(project);
    if (detected) return detected;

    const fileMap = project.files.reduce((acc, file) => {
      if (file.type === 'file') {
        acc[file.path] = file.content;
      }
      return acc;
    }, {} as Record<string, string>);

    // Determine project type and compile accordingly
    const projectType = this.detectProjectType(project.template, fileMap);
    
    switch (projectType) {
      case 'nextjs':
        return this.compileNextJsProject(project, fileMap);
      case 'react':
        return this.compileReactProject(project, fileMap);
      case 'vue':
        return this.compileVueProject(project, fileMap);
      case 'express':
        return this.compileExpressProject(project, fileMap);
      default:
        return this.compileGenericProject(project, fileMap);
    }
  }

  /**
   * If a dev server is running (Nix or classic), present an iframe that auto-updates.
   * Also handles 'starting' by probing the expected port and updating once live.
   */
  private static async detectDevServer(project: PreviewableProject): Promise<string | null> {
    try {
      const urlFromManagers =
        nixDevServerManager.getUrl(project.id) ||
        devServerManager.getServerUrl(project.id) ||
        null;

      const status =
        nixDevServerManager.getStatus(project.id) ||
        devServerManager.getStatus(project.id) ||
        'stopped';

      const candidateUrl = urlFromManagers || `http://localhost:${project.ports.frontend}`;

      // Simple optimistic detection: if status is running or starting, try to embed and let JS probe.
      if (status === 'running' || status === 'starting') {
        return this.generateDevServerEmbed(project, candidateUrl, status);
      }

      // Fallback: quick HEAD/GET probe to the expected port (non-blocking: 500ms timeout)
      const reachable = await this.quickProbe(candidateUrl, 600);
      if (reachable) {
        return this.generateDevServerEmbed(project, candidateUrl, 'running');
      }
      return null;
    } catch {
      return null;
    }
  }

  private static generateDevServerEmbed(project: PreviewableProject, url: string, status: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.name} — Live Dev Server</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html, body, iframe { height: 100%; width: 100%; margin: 0; }
    #bar { position: fixed; inset: 0 auto auto 0; height: 36px; width: 100%; background: rgba(17,24,39,.85); color: #fff; display:flex; align-items:center; gap:12px; padding:0 10px; z-index:9999; font: 12px/1.2 ui-sans-serif,system-ui; }
    #frame { position: absolute; top: 36px; left: 0; right: 0; bottom: 0; border: 0; }
    .pill { padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,.12); }
  </style>
</head>
<body>
  <div id="bar">
    <span>⚡ Dev Server</span>
    <span class="pill">${status}</span>
    <span class="pill">Front: ${project.ports.frontend}</span>
    <a href="${url}" target="_blank" class="underline">Open</a>
    <span id="hint" class="text-gray-300"></span>
  </div>
  <iframe id="frame" src="${url}"></iframe>
  <script>
    const url = ${JSON.stringify(url)};
    const hint = document.getElementById('hint');
    async function probeOnce(signal) {
      try {
        const res = await fetch(url, { method: 'GET', mode: 'no-cors', signal });
        return true; // 'no-cors' always opaque; reaching here means no immediate network error
      } catch (e) {
        return false;
      }
    }
    // Poll a few times while starting
    let tries = 0;
    const iv = setInterval(async () => {
      tries++;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 800);
      const ok = await probeOnce(ctrl.signal);
      clearTimeout(t);
      if (ok) { hint.textContent = '' ; clearInterval(iv); }
      else { hint.textContent = 'waiting for dev server…'; }
      if (tries > 60) clearInterval(iv);
    }, 1000);
  </script>
</body>
</html>`;
  }

  private static async quickProbe(url: string, timeoutMs: number): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), timeoutMs);
      // Node 18 has global fetch
      await fetch(url, { method: 'GET', mode: 'no-cors', signal: ctrl.signal as any });
      clearTimeout(to);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect project type based on template and files
   */
  private static detectProjectType(
    template: string, 
    files: Record<string, string>
  ): string {
    // Check template name first (prefer Next.js app router under src/)
    if (template.includes('nextjs') || template.includes('next')) return 'nextjs';
    if (template.includes('react')) return 'react';
    if (template.includes('vue')) return 'vue';
    if (template.includes('express') || template.includes('api')) return 'express';

    // Check file structure
    if (
      files['src/app/page.tsx'] ||
      files['app/page.tsx'] ||
      files['src/pages/index.tsx'] ||
      files['pages/index.tsx'] ||
      files['next.config.js']
    ) {
      return 'nextjs';
    }
    if (files['src/App.tsx'] || files['src/App.jsx']) {
      return 'react';
    }
    if (files['src/App.vue'] || Object.keys(files).some(f => f.endsWith('.vue'))) {
      return 'vue';
    }
    if (files['src/server.ts'] || files['app.js']) {
      return 'express';
    }

    return 'generic';
  }

  /**
   * Compile Next.js project with port configuration
   */
  private static compileNextJsProject(
    project: PreviewableProject, 
    files: Record<string, string>
  ): string {
    const pageContent =
      files['src/app/page.tsx'] ||
      files['app/page.tsx'] ||
      files['src/pages/index.tsx'] ||
      files['pages/index.tsx'] ||
      '';
    
    if (!pageContent) {
      // No placeholder: return a blank page when entry content isn't available
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>`;
    }

    try {
      // Parse JSX to HTML (simplified)
      const htmlContent = this.parseJSXToHTML(pageContent);
      
      // Extract CSS files
      const cssFiles = Object.keys(files).filter(f => f.endsWith('.css'));
      const allCSS = cssFiles.map(f => files[f]).join('\\n');

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${allCSS}</style>
  <style>
    /* Preview-specific styles */
    .preview-info {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="preview-info">
    ⚡ Live Preview | Port: ${project.ports.frontend}
  </div>
  ${htmlContent}
  <script>
    // Live preview enhancement
    console.log('🚀 Live Preview Active');
    console.log('Frontend Port: ${project.ports.frontend}');
    console.log('Backend Port: ${project.ports.backend}');
  </script>
</body>
</html>`;
    } catch (error) {
      return this.generateErrorPage(project, error);
    }
  }

  /**
   * Compile React project
   */
  private static compileReactProject(
    project: PreviewableProject,
    files: Record<string, string>
  ): string {
    const appContent = files['src/App.tsx'] || files['src/App.jsx'] || '';
    
    if (!appContent) {
      return this.generateProjectPlaceholder(project, 'React');
    }

    const htmlContent = this.parseJSXToHTML(appContent);
    const cssFiles = Object.keys(files).filter(f => f.endsWith('.css'));
    const allCSS = cssFiles.map(f => files[f]).join('\\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${allCSS}</style>
</head>
<body>
  <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; z-index: 1000;">
    ⚛️ React | Port: ${project.ports.frontend}
  </div>
  <div id="root">
    ${htmlContent}
  </div>
</body>
</html>`;
  }

  /**
   * Compile Vue project
   */
  private static compileVueProject(
    project: PreviewableProject,
    files: Record<string, string>
  ): string {
    return this.generateProjectPlaceholder(project, 'Vue.js', '💚');
  }

  /**
   * Compile Express API project
   */
  private static compileExpressProject(
    project: PreviewableProject,
    files: Record<string, string>
  ): string {
    const serverContent = files['src/server.ts'] || files['app.js'] || '';
    
    // Extract API endpoints
    const endpoints = [];
    if (serverContent.includes('/api/')) {
      // Simple endpoint detection for demo purposes
      const apiLines = serverContent.split('\n').filter(line => line.includes('/api/'));
      apiLines.forEach(line => {
        if (line.includes('get(') && line.includes('/api/')) {
          const match = line.match(/['"`]([^'"`]*\/api\/[^'"`]*)/);
          if (match) endpoints.push(`GET ${match[1]}`);
        }
        if (line.includes('post(') && line.includes('/api/')) {
          const match = line.match(/['"`]([^'"`]*\/api\/[^'"`]*)/);
          if (match) endpoints.push(`POST ${match[1]}`);
        }
        if (line.includes('put(') && line.includes('/api/')) {
          const match = line.match(/['"`]([^'"`]*\/api\/[^'"`]*)/);
          if (match) endpoints.push(`PUT ${match[1]}`);
        }
        if (line.includes('delete(') && line.includes('/api/')) {
          const match = line.match(/['"`]([^'"`]*\/api\/[^'"`]*)/);
          if (match) endpoints.push(`DELETE ${match[1]}`);
        }
      });
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - API Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🚀 ${project.name}</h1>
      <p class="text-gray-600 mb-6">Express.js API Server</p>
      
      <div class="grid gap-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-semibold text-blue-900 mb-2">Server Information</h3>
          <div class="text-sm text-blue-800 space-y-1">
            <p><strong>Backend Port:</strong> ${project.ports.backend}</p>
            <p><strong>Status:</strong> <span class="text-green-600">Running</span></p>
            <p><strong>Base URL:</strong> http://localhost:${project.ports.backend}</p>
          </div>
        </div>
        
        ${endpoints.length > 0 ? `
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 class="font-semibold text-green-900 mb-2">Available Endpoints</h3>
          <div class="space-y-2">
            ${endpoints.map(endpoint => `
              <div class="flex items-center space-x-2 text-sm">
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono">${endpoint}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Compile generic project
   */
  private static compileGenericProject(
    project: PreviewableProject,
    files: Record<string, string>
  ): string {
    const indexHtml = files['index.html'];
    if (indexHtml) {
      // Inject preview info into existing HTML
      return indexHtml.replace(
        '</body>',
        `  <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; z-index: 1000;">
    📄 ${project.template} | Port: ${project.ports.frontend}
  </div>
</body>`
      );
    }

    return this.generateProjectPlaceholder(project, project.template);
  }

  /**
   * Generate project placeholder
   */
  private static generateProjectPlaceholder(
    project: PreviewableProject,
    framework: string,
    icon: string = '🚀'
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
  <div class="text-center max-w-2xl p-8">
    <div class="text-6xl mb-6">${icon}</div>
    <h1 class="text-4xl font-bold text-gray-900 mb-4">${project.name}</h1>
    <p class="text-xl text-gray-600 mb-8">${framework} Application</p>
    
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">🔌 Port Configuration</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="font-semibold text-blue-900">Frontend</div>
          <div class="text-2xl font-bold text-blue-600">${project.ports.frontend}</div>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="font-semibold text-green-900">Backend</div>
          <div class="text-2xl font-bold text-green-600">${project.ports.backend}</div>
        </div>
        <div class="text-center p-3 bg-gray-50 rounded-lg">
          <div class="font-semibold text-gray-900">Reserved</div>
          <div class="text-xs text-gray-600">${project.ports.reserved.length} ports</div>
        </div>
      </div>
    </div>
    
    <div class="text-sm text-gray-500">
      <p>Files: ${project.files.filter(f => f.type === 'file').length} | 
         Folders: ${project.files.filter(f => f.type === 'directory').length}</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate error page
   */
  private static generateErrorPage(project: PreviewableProject, error: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview Error - ${project.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-red-50 min-h-screen flex items-center justify-center">
  <div class="text-center max-w-2xl p-8">
    <div class="text-6xl mb-6">⚠️</div>
    <h1 class="text-3xl font-bold text-red-900 mb-4">Preview Error</h1>
    <p class="text-red-700 mb-8">Failed to compile ${project.name}</p>
    <div class="bg-red-100 border border-red-300 rounded-lg p-4 text-left">
      <pre class="text-sm text-red-800 whitespace-pre-wrap">${error.toString()}</pre>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Simplified JSX to HTML parser
   */
  private static parseJSXToHTML(jsxContent: string): string {
    return jsxContent
      .replace(/import.*?from.*?['"];/g, '')
      .replace(/export\s+default\s+function\s+\w+\([^)]*\)\s*{/, '')
      .replace(/^['"]use client['"];?\s*/g, '')
      .replace(/className=/g, 'class=')
      .replace(/<Link\s+href=([^>]+?)([^>]*?)>([\s\S]*?)<\/Link>/g, '<a href=$1$2>$3</a>')
      .replace(/href=\{["'`]([^"'`}]+)["'`]\}/g, 'href="$1"')
      .replace(/\{[^}]*\}/g, '')
      .replace(/<(\w+)([^>]*?)\s*\/>/g, '<$1$2></$1>')
      .replace(/return\s*\(\s*([\s\S]*?)\s*\);?\s*}?\s*$/m, '$1')
      .trim();
  }
}
