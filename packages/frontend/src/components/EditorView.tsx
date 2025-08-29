'use client';

import { useState } from 'react';
import {
  Play,
  Save,
  Download,
  Share2,
  Settings,
  Terminal as TerminalIcon,
  Eye,
  Code2,
  FileText,
  FolderOpen,
  File,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  MoreVertical,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface EditorViewProps {
  template: any;
}

export default function EditorView({ template }: EditorViewProps) {
  const [activeTab, setActiveTab] = useState('index.html');
  const [showPreview, setShowPreview] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const files = [
    { name: 'index.html', type: 'file', icon: FileText },
    { name: 'style.css', type: 'file', icon: FileText },
    { name: 'script.js', type: 'file', icon: FileText },
    { 
      name: 'components', 
      type: 'folder', 
      icon: FolderOpen,
      children: [
        { name: 'header.html', type: 'file', icon: FileText },
        { name: 'footer.html', type: 'file', icon: FileText }
      ]
    }
  ];

  const tabs = [
    { name: 'index.html', active: true },
    { name: 'style.css', active: false },
    { name: 'script.js', active: false }
  ];

  const editorContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav>
        <div class="container">
            <h1>Welcome to ${template.name}</h1>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About Me</a></li>
                <li><a href="#skills">Skills & Tools</a></li>
                <li><a href="#experience">Experience</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#contact">Contact Me</a></li>
            </ul>
        </div>
    </nav>
    
    <main>
        <section id="hero">
            <h2>Build Something Amazing</h2>
            <p>Start your project with this template</p>
        </section>
    </main>
    
    <script src="script.js"></script>
</body>
</html>`;

  return (
    <div className={`flex-1 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Editor Header */}
      <div className="h-14 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span className="font-medium">{template.name}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg flex items-center space-x-2 transition-colors">
            <Play className="w-4 h-4" />
            <span className="text-sm">Run</span>
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Save className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {sidebarOpen && (
          <div className="w-64 bg-gray-900/30 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Files</h3>
            </div>
            <div className="flex-1 p-2 overflow-auto">
              <div className="space-y-1">
                {files.map((file, idx) => (
                  <div key={idx}>
                    <button className="w-full flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-800 rounded text-left transition-colors">
                      {file.type === 'folder' ? (
                        <>
                          <ChevronRight className="w-3 h-3" />
                          <file.icon className="w-4 h-4 text-blue-400" />
                        </>
                      ) : (
                        <file.icon className="w-4 h-4 text-gray-400 ml-3" />
                      )}
                      <span className="text-sm text-gray-300">{file.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="h-10 bg-gray-900/50 border-b border-gray-800 flex items-center">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab.name)}
                className={`h-full px-4 flex items-center space-x-2 border-r border-gray-800 ${
                  activeTab === tab.name 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-400 hover:bg-gray-800/50'
                } transition-colors`}
              >
                <FileText className="w-3 h-3" />
                <span className="text-sm">{tab.name}</span>
                <X className="w-3 h-3 hover:text-red-400" />
              </button>
            ))}
            <button className="h-full px-3 hover:bg-gray-800/50 transition-colors">
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Split View: Editor + Preview */}
          <div className="flex-1 flex">
            {/* Code Editor */}
            <div className={`${showPreview ? 'w-1/2' : 'w-full'} relative`}>
              <div className="absolute inset-0 bg-gray-900 p-4 font-mono text-sm overflow-auto">
                <pre className="text-gray-300">
                  <code>{editorContent}</code>
                </pre>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <>
                <div className="w-px bg-gray-800"></div>
                <div className="w-1/2 bg-white relative">
                  <div className="absolute top-0 left-0 right-0 h-10 bg-gray-800 flex items-center justify-between px-4">
                    <span className="text-sm text-gray-400">Preview</span>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                      </button>
                      <button 
                        onClick={() => setShowPreview(false)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-10 h-full">
                    <iframe 
                      srcDoc={editorContent}
                      className="w-full h-full"
                      title="Preview"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Terminal */}
          {terminalOpen && (
            <>
              <div className="h-px bg-gray-800"></div>
              <div className="h-48 bg-black flex flex-col">
                <div className="h-8 bg-gray-900 flex items-center justify-between px-4">
                  <div className="flex items-center space-x-2">
                    <TerminalIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Terminal</span>
                  </div>
                  <button 
                    onClick={() => setTerminalOpen(false)}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 p-4 font-mono text-sm text-green-400">
                  <div>$ npm run dev</div>
                  <div className="text-gray-500">Starting development server...</div>
                  <div className="text-blue-400">Server running at http://localhost:3000</div>
                  <div className="flex items-center">
                    <span>$ </span>
                    <input 
                      type="text" 
                      className="flex-1 bg-transparent outline-none ml-2"
                      placeholder="Enter command..."
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 bg-gray-900 border-t border-gray-800 px-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>HTML</span>
          <span>UTF-8</span>
          <span>Line 24, Col 18</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setTerminalOpen(!terminalOpen)}
            className="flex items-center space-x-1 hover:text-white transition-colors"
          >
            <TerminalIcon className="w-3 h-3" />
            <span>Terminal</span>
          </button>
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-1 hover:text-white transition-colors"
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
}