'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Monitor, Zap, ZapOff } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface LivePreviewProps {
  fileTree: FileNode[];
  activeFile?: string;
  activeFileContent?: string;
  className?: string;
}

// Transform file tree into a flat file structure
const flattenFileTree = (nodes: FileNode[], path = ''): Record<string, string> => {
  const files: Record<string, string> = {};
  
  nodes.forEach(node => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    
    if (node.type === 'file') {
      // Include files even if they don't have content initially - they may get content from the editor
      files[currentPath] = node.content || '';
    } else if (node.type === 'folder' && node.children) {
      Object.assign(files, flattenFileTree(node.children, currentPath));
    }
  });
  
  return files;
};

// Dynamic app compiler based on template type
const compileApp = (files: Record<string, string>): string => {
  // Extract all CSS files for bundling
  const cssFiles = Object.entries(files).filter(([path]) => path.endsWith('.css'));
  const allCss = cssFiles.map(([, content]) => content).join('\n\n');
  
  // Detect framework/template type based on files
  const hasNextJs = files['app/page.tsx'] || files['src/app/page.tsx'] || files['pages/index.tsx'] || files['next.config.js'];
  const hasVue = files['src/App.vue'] || Object.keys(files).some(path => path.endsWith('.vue'));
  const hasReact = files['src/App.tsx'] || files['src/App.jsx'] || files['src/main.tsx'];
  const hasExpress = files['src/server.ts'] || files['app.js'];

  if (hasNextJs) {
    return compileNextJsApp(files, allCss);
  } else if (hasVue) {
    return compileVueApp(files, allCss);
  } else if (hasExpress) {
    return compileExpressApiPreview(files);
  } else if (hasReact) {
    return compileReactApp(files, allCss);
  } else {
    return compileGenericApp(files, allCss);
  }
};

// Dynamic JSX to HTML converter with improved parsing for complex components
const parseJSXToHTML = (jsxContent: string): string => {
  // Remove import statements and export default function wrapper
  let content = jsxContent
    .replace(/import.*?from.*?['"];/g, '')
    .replace(/export\s+default\s+function\s+\w+\([^)]*\)\s*{/, '')
    .replace(/^['"]use client['"];?\s*/g, '')
    .trim();
  
  // Remove the final closing brace
  if (content.endsWith('}')) {
    content = content.slice(0, -1);
  }
  
  // Extract the return JSX (everything inside the return parentheses)
  const returnMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*$/m);
  if (returnMatch) {
    content = returnMatch[1].trim();
  }
  
  // Only create admin dashboard preview if it's actually an admin dashboard template
  if (content.includes('Admin Dashboard') || content.includes('admin-dashboard') ||
      (content.includes('BarChart') && content.includes('PieChart') && content.includes('admin'))) {
    return createAdminDashboardPreview(content);
  }
  
  // Convert JSX attributes to HTML
  content = content
    // Convert className to class
    .replace(/className=/g, 'class=')
    // Convert Next.js Link to a tags (with proper closing)
    .replace(/<Link\s+href=([^>]+?)([^>]*?)>([\s\S]*?)<\/Link>/g, '<a href=$1$2>$3</a>')
    // Convert href with curly braces to regular quotes
    .replace(/href=\{["'`]([^"'`}]+)["'`]\}/g, 'href="$1"')
    // Remove complex JSX expressions but preserve simple text
    .replace(/\{[^}]*\}/g, (match) => {
      // If it looks like a simple string or number, keep it simple
      if (match.match(/^\{['"`].*?['"`]\}$/)) {
        return match.replace(/^\{['"`]|['"`]\}$/g, '');
      }
      // For complex expressions, return placeholder
      return '';
    })
    // Convert self-closing tags to proper HTML
    .replace(/<(\w+)([^>]*?)\s*\/>/g, '<$1$2></$1>')
    // Clean up any double spaces
    .replace(/\s+/g, ' ');
  
  return content.trim();
};

// Create a simplified preview for admin dashboard with mock data
const createAdminDashboardPreview = (originalContent: string): string => {
  return `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p class="text-gray-600 mt-2">Welcome to your dashboard overview</p>
        </div>
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">2,543</p>
                <p class="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">$45,231</p>
                <p class="text-sm text-gray-600">Revenue</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">1,245</p>
                <p class="text-sm text-gray-600">Orders</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <div class="flex items-center">
              <div class="p-2 bg-orange-100 rounded-lg">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">12.5%</p>
                <p class="text-sm text-gray-600">Growth</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
            <div class="h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <svg class="w-16 h-16 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <p class="text-blue-600 font-medium">Interactive Chart</p>
                <p class="text-sm text-blue-500">Revenue trends</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
            <div class="h-64 bg-gradient-to-r from-green-50 to-green-100 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <svg class="w-16 h-16 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-green-600 font-medium">Analytics Chart</p>
                <p class="text-sm text-green-500">User engagement</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="bg-white rounded-lg border shadow-sm">
          <div class="p-6 border-b">
            <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div class="divide-y">
            <div class="p-6 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 font-semibold">JD</span>
                </div>
                <div class="ml-4">
                  <p class="font-medium text-gray-900">John Doe</p>
                  <p class="text-sm text-gray-600">Updated profile information</p>
                </div>
              </div>
              <span class="text-sm text-gray-500">2 minutes ago</span>
            </div>
            <div class="p-6 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span class="text-green-600 font-semibold">SM</span>
                </div>
                <div class="ml-4">
                  <p class="font-medium text-gray-900">Sarah Miller</p>
                  <p class="text-sm text-gray-600">Completed purchase</p>
                </div>
              </div>
              <span class="text-sm text-gray-500">5 minutes ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Next.js app compiler - dynamic JSX parser
const compileNextJsApp = (files: Record<string, string>, css: string): string => {
  let pageContent = files['app/page.tsx'] || files['src/app/page.tsx'] || '';
  
  // Check if page.tsx only contains a redirect - if so, try to find the actual content page
  if (pageContent.includes('redirect(') && pageContent.includes('return null')) {
    // Try to find any non-redirect page that has actual content
    const alternativePages = Object.keys(files).filter(path => 
      path.includes('page.tsx') && !files[path].includes('redirect(') && files[path].length > 100
    );
    
    if (alternativePages.length > 0) {
      pageContent = files[alternativePages[0]];
      console.log('🔄 Using alternative page for preview:', alternativePages[0]);
    }
  }
  
  if (pageContent.length > 0) {
    try {
      // Parse the JSX content dynamically
      const parsedHTML = parseJSXToHTML(pageContent);
      
      // Extract title from the content for page title
      const titleMatch = parsedHTML.match(/<h[1-6][^>]*>([^<]+)</i);
      const pageTitle = titleMatch ? titleMatch[1] : 'Next.js App';
      
      console.log('✅ Dynamic JSX preview rendered for:', pageTitle);
      
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body>
  ${parsedHTML}
</body>
</html>`;
    } catch (error) {
      console.error('❌ Error parsing JSX:', error);
      // Fallback to basic content extraction
      const titleMatch = pageContent.match(/<h[1-6][^>]*>([^<]+)</i);
      const title = titleMatch ? titleMatch[1] : 'Next.js App';
      
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center max-w-2xl p-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">${title}</h1>
      <p class="text-gray-600 mb-6">Dynamic preview parsing failed</p>
      <div class="text-sm text-gray-500">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Next.js App
        </span>
      </div>
    </div>
  </div>
</body>
</html>`;
    }
  }
  
  // Final fallback
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Next.js App - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">▲ Next.js App</h1>
      <p class="text-gray-600">Built with SwiStack</p>
    </div>
  </div>
</body>
</html>`;
};

// Vue.js app compiler - optimized for speed
const compileVueApp = (files: Record<string, string>, css: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue App - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">💚 Vue.js App</h1>
      <p class="text-gray-600">Built with SwiStack</p>
      <div class="mt-6">
        <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          count is 0
        </button>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Express API preview compiler
const compileExpressApiPreview = (files: Record<string, string>): string => {
  const serverContent = files['src/server.ts'] || '';
  
  // Extract API endpoints from server content for demonstration
  const endpoints = [];
  if (serverContent.includes('/api/users')) endpoints.push('GET /api/users');
  if (serverContent.includes('/api/posts')) endpoints.push('GET /api/posts');
  if (serverContent.includes('/health')) endpoints.push('GET /health');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Express API - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">🚀 Express API Server</h1>
      <p class="text-gray-600 mb-8">RESTful API built with Express.js and TypeScript</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${endpoints.map(endpoint => `
          <div class="bg-white p-6 rounded-lg shadow-md border">
            <h3 class="font-semibold text-lg mb-2">${endpoint}</h3>
            <p class="text-gray-600 text-sm">API endpoint available</p>
            <div class="mt-4">
              <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
            </div>
          </div>
        `).join('')}
        
        <div class="bg-white p-6 rounded-lg shadow-md border">
          <h3 class="font-semibold text-lg mb-2">🏥 Health Check</h3>
          <p class="text-gray-600 text-sm">Server status monitoring</p>
          <div class="mt-4">
            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Healthy</span>
          </div>
        </div>
      </div>
      
      <div class="mt-8 p-6 bg-gray-100 rounded-lg">
        <h3 class="font-semibold mb-4">API Documentation</h3>
        <div class="space-y-2 text-sm text-gray-700">
          <p><strong>Base URL:</strong> http://localhost:3000</p>
          <p><strong>Content-Type:</strong> application/json</p>
          <p><strong>CORS:</strong> Enabled</p>
          <p><strong>Security:</strong> Helmet middleware active</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// React app compiler - optimized for speed
const compileReactApp = (files: Record<string, string>, css: string): string => {
  const appContent = files['src/App.tsx'] || files['src/App.jsx'] || '';
  
  // Quick static render for basic React apps to avoid Babel compilation delay
  const hasCountButton = appContent.includes('count');
  
  if (hasCountButton) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Welcome to React</h1>
      <div class="card">
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          count is 0
        </button>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">⚛️ React App</h1>
      <p class="text-gray-600">Built with SwiStack</p>
    </div>
  </div>
</body>
</html>`;
};

// Generic app compiler for unknown templates
const compileGenericApp = (files: Record<string, string>, css: string): string => {
  const indexHtml = files['index.html'];
  if (indexHtml) {
    return indexHtml;
  }
  
  const mainFiles = Object.entries(files).filter(([path, content]) => 
    path.endsWith('.html') || path.endsWith('.htm')
  );
  
  if (mainFiles.length > 0) {
    return mainFiles[0][1];
  }
  
  // If no files, show empty loading state
  const fileCount = Object.keys(files).length;
  if (fileCount === 0) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
  <div class="text-center text-gray-400">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto mb-4"></div>
    <p class="text-sm">Loading template...</p>
  </div>
</body>
</html>`;
  }
  
  // For unrecognized file types, show loading state instead of content
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
  <div class="text-center text-gray-400">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto mb-4"></div>
    <p class="text-sm">Processing template files...</p>
  </div>
</body>
</html>`;
};

export default function LivePreview({ 
  fileTree, 
  activeFile, 
  activeFileContent, 
  className = '' 
}: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isHotReloadEnabled, setIsHotReloadEnabled] = useState(true);
  const [compileTime, setCompileTime] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<string>('');

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;

    const startTime = Date.now();
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorDetails('');
      
      const files = flattenFileTree(fileTree);
      
      // If there's an active file with updated content, use it
      if (activeFile && activeFileContent !== undefined) {
        files[activeFile] = activeFileContent;
      }
      
      // Debug: log file structure to console (can be removed in production)
      console.log('📁 Preview files:', Object.keys(files));
      if (activeFile) console.log('📄 Active file:', activeFile);
      
      const compiledHtml = compileApp(files);
      
      // Write the compiled HTML to the iframe
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(compiledHtml);
        doc.close();
        
        // Handle iframe load
        iframeRef.current.onload = () => {
          const endTime = Date.now();
          setCompileTime(endTime - startTime);
          setIsLoading(false);
          setLastUpdate(endTime);
        };
        
        // Handle errors
        const errorHandler = (event: any) => {
          console.error('Preview error:', event.error);
          setHasError(true);
          setIsLoading(false);
        };
        
        if (iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.addEventListener('error', errorHandler);
        }
      }
    } catch (error) {
      console.error('Failed to compile preview:', error);
      setErrorDetails(error instanceof Error ? error.message : 'Unknown compilation error');
      setHasError(true);
      setIsLoading(false);
    }
  }, [fileTree, activeFile, activeFileContent]);

  // Update preview when files change (hot reload)
  useEffect(() => {
    if (!isHotReloadEnabled) return;
    
    // Debounce the update to avoid too many rapid updates
    const timeoutId = setTimeout(() => {
      updatePreview();
    }, 100); // 100ms debounce for faster response
    
    return () => clearTimeout(timeoutId);
  }, [updatePreview, isHotReloadEnabled]);

  const handleRefresh = () => {
    updatePreview();
  };

  const handleOpenInNewTab = () => {
    if (iframeRef.current?.contentWindow) {
      const htmlContent = iframeRef.current.contentDocument?.documentElement.outerHTML;
      if (htmlContent) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        }
      }
    }
  };

  if (hasError) {
    return (
      <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Preview</span>
            <span className="text-xs text-red-400">Error</span>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 max-w-md">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <p className="text-lg font-medium mb-2">Compilation Error</p>
            <p className="text-sm mb-3">Failed to compile the application</p>
            {errorDetails && (
              <div className="text-xs text-red-300 bg-red-900/20 p-3 rounded border border-red-800 mb-4 text-left">
                <pre className="whitespace-pre-wrap">{errorDetails}</pre>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Monitor className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">Live Preview</span>
          {isLoading && (
            <div className="flex items-center space-x-1 text-xs text-blue-400">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Updating...</span>
            </div>
          )}
          {!isLoading && isHotReloadEnabled && (
            <div className="flex items-center space-x-1 text-xs text-green-400">
              <Zap className="w-3 h-3" />
              <span>Hot Reload</span>
            </div>
          )}
          {!isLoading && compileTime > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <span>Compiled in {compileTime}ms</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsHotReloadEnabled(!isHotReloadEnabled)}
            className={`p-1 rounded transition-colors ${
              isHotReloadEnabled 
                ? 'text-green-400 hover:bg-green-900/20' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            title={isHotReloadEnabled ? "Disable hot reload" : "Enable hot reload"}
          >
            {isHotReloadEnabled ? (
              <Zap className="w-4 h-4" />
            ) : (
              <ZapOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Live Preview"
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Compiling App...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}