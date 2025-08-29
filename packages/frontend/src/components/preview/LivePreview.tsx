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
  previewType?: 'react' | 'api-docs' | 'static' | 'nextjs';
  templateKey?: string;
  className?: string;
}

// Transform file tree into a flat file structure
const flattenFileTree = (nodes: FileNode[], path = ''): Record<string, string> => {
  const files: Record<string, string> = {};
  
  nodes.forEach(node => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    
    if (node.type === 'file' && node.content) {
      files[currentPath] = node.content;
    } else if (node.type === 'folder' && node.children) {
      Object.assign(files, flattenFileTree(node.children, currentPath));
    }
  });
  
  return files;
};

// Generate API Documentation HTML
const generateApiDocs = (files: Record<string, string>, framework: 'express' | 'flask'): string => {
  // Extract main API file content
  const mainFile = framework === 'flask' ? files['app.py'] : files['src/server.js'];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${framework === 'flask' ? 'Flask' : 'Express'} API Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 2.5rem;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    .endpoint-card {
      background: white;
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .endpoint-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .method-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12px;
      margin-right: 15px;
      color: white;
    }
    .method-get { background: #28a745; }
    .method-post { background: #007bff; }
    .method-put { background: #ffc107; color: #333; }
    .method-delete { background: #dc3545; }
    .endpoint-path {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
    .endpoint-description {
      color: #666;
      margin-bottom: 15px;
    }
    .example-request {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 15px;
      margin: 10px 0;
    }
    .example-request h4 {
      margin: 0 0 10px;
      color: #495057;
    }
    .code-block {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
      background: #f1f3f4;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre;
    }
    .info-banner {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 0 6px 6px 0;
    }
    .quick-start {
      background: white;
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 ${framework === 'flask' ? 'Flask API' : 'Express API'}</h1>
    <p>RESTful API built with ${framework === 'flask' ? 'Python Flask' : 'Node.js Express'} and SwiStack</p>
  </div>

  <div class="info-banner">
    <strong>📋 API Status:</strong> Ready for development • <strong>Port:</strong> ${framework === 'flask' ? '5000' : '3000'} • <strong>Environment:</strong> Development
  </div>

  <div class="quick-start">
    <h2>🏁 Quick Start</h2>
    <div class="example-request">
      <h4>Start Development Server</h4>
      <div class="code-block">${framework === 'flask' ? 
        'python app.py' : 
        'npm run dev'
      }</div>
    </div>
    <div class="example-request">
      <h4>Test API Endpoint</h4>
      <div class="code-block">curl http://localhost:${framework === 'flask' ? '5000' : '3000'}${framework === 'flask' ? '' : ''}</div>
    </div>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method-badge method-get">GET</span>
      <span class="endpoint-path">/</span>
    </div>
    <div class="endpoint-description">Get API information and available endpoints</div>
    <div class="example-request">
      <h4>Example Response</h4>
      <div class="code-block">{
  "message": "Welcome to ${framework === 'flask' ? 'Flask' : 'Express'} API",
  "version": "1.0.0",
  "endpoints": {
    "GET /": "This endpoint",
    "GET /api/users": "Get all users",
    "POST /api/users": "Create a new user"
  }
}</div>
    </div>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method-badge method-get">GET</span>
      <span class="endpoint-path">/api/users</span>
    </div>
    <div class="endpoint-description">Retrieve all users from the system</div>
    <div class="example-request">
      <h4>Example Request</h4>
      <div class="code-block">curl http://localhost:${framework === 'flask' ? '5000' : '3000'}/api/users</div>
    </div>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method-badge method-post">POST</span>
      <span class="endpoint-path">/api/users</span>
    </div>
    <div class="endpoint-description">Create a new user in the system</div>
    <div class="example-request">
      <h4>Example Request</h4>
      <div class="code-block">curl -X POST http://localhost:${framework === 'flask' ? '5000' : '3000'}/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","email":"john@example.com"}'</div>
    </div>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method-badge method-get">GET</span>
      <span class="endpoint-path">/api/users/{id}</span>
    </div>
    <div class="endpoint-description">Get a specific user by ID</div>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method-badge method-put">PUT</span>
      <span class="endpoint-path">/api/users/{id}</span>
    </div>
    <div class="endpoint-description">Update an existing user</div>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method-badge method-delete">DELETE</span>
      <span class="endpoint-path">/api/users/{id}</span>
    </div>
    <div class="endpoint-description">Delete a user from the system</div>
  </div>

  <div style="margin-top: 40px; text-align: center; color: #666; font-size: 14px;">
    <p>📚 Built with <strong>SwiStack</strong> • Powered by ${framework === 'flask' ? 'Python Flask' : 'Node.js Express'}</p>
  </div>
</body>
</html>`;
};

// Next.js E-learning Platform Compiler
const compileElearningPlatform = (files: Record<string, string>): string => {
  // Extract Tailwind CSS and custom styles
  const globalsCss = files['app/globals.css'] || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduLearn - E-learning Platform</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Global styles */
    ${globalsCss}
    
    /* Additional e-learning specific styles */
    body {
      margin: 0;
      padding: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    
    // Mock courses data
    const mockCourses = [
      {
        id: 1,
        title: 'React Fundamentals',
        description: 'Learn the basics of React including components, hooks, and state management.',
        instructor: 'Sarah Johnson',
        duration: '8 weeks',
        difficulty: 'Beginner',
        thumbnail: 'https://picsum.photos/300/200?random=1',
        price: 99,
        rating: 4.8,
        studentsCount: 1250,
        lessonsCount: 24,
        category: 'Frontend Development',
        tags: ['React', 'JavaScript', 'Frontend'],
        progress: 0,
        isEnrolled: false
      },
      {
        id: 2,
        title: 'Node.js Backend Development',
        description: 'Master server-side development with Node.js, Express, and databases.',
        instructor: 'Michael Chen',
        duration: '10 weeks',
        difficulty: 'Intermediate',
        thumbnail: 'https://picsum.photos/300/200?random=2',
        price: 129,
        rating: 4.9,
        studentsCount: 890,
        lessonsCount: 32,
        category: 'Backend Development',
        tags: ['Node.js', 'Express', 'MongoDB'],
        progress: 0,
        isEnrolled: false
      },
      {
        id: 3,
        title: 'Full-Stack JavaScript',
        description: 'Complete web development course covering frontend and backend technologies.',
        instructor: 'Emily Rodriguez',
        duration: '16 weeks',
        difficulty: 'Advanced',
        thumbnail: 'https://picsum.photos/300/200?random=3',
        price: 199,
        rating: 4.7,
        studentsCount: 654,
        lessonsCount: 48,
        category: 'Full-Stack Development',
        tags: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        progress: 0,
        isEnrolled: false
      },
      {
        id: 4,
        title: 'Python Data Science',
        description: 'Data analysis and machine learning with Python, pandas, and scikit-learn.',
        instructor: 'Dr. James Wilson',
        duration: '12 weeks',
        difficulty: 'Intermediate',
        thumbnail: 'https://picsum.photos/300/200?random=4',
        price: 159,
        rating: 4.6,
        studentsCount: 432,
        lessonsCount: 36,
        category: 'Data Science',
        tags: ['Python', 'Pandas', 'Machine Learning'],
        progress: 0,
        isEnrolled: false
      }
    ];

    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://picsum.photos/100/100?random=10',
      enrolledCourses: [],
      completedCourses: [],
      totalProgress: 0,
      joinedDate: '2024-01-15'
    };

    // Navbar Component
    function Navbar({ user, currentView, onViewChange }) {
      const [isProfileOpen, setIsProfileOpen] = useState(false);

      return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">EL</span>
                  </div>
                  <h1 className="ml-3 text-xl font-bold text-gray-900">EduLearn</h1>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <button
                  onClick={() => onViewChange('courses')}
                  className={\`px-3 py-2 rounded-md text-sm font-medium transition-colors \${
                    currentView === 'courses'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }\`}
                >
                  Courses
                </button>
                <button
                  onClick={() => onViewChange('dashboard')}
                  className={\`px-3 py-2 rounded-md text-sm font-medium transition-colors \${
                    currentView === 'dashboard'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }\`}
                >
                  My Learning
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden md:block font-medium text-gray-700">{user.name}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile Settings
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Certificates
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Help & Support
                    </a>
                    <div className="border-t border-gray-100">
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Sign Out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      );
    }

    // CourseCard Component
    function CourseCard({ course, onEnroll }) {
      const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
          case 'Beginner': return 'bg-green-100 text-green-800';
          case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
          case 'Advanced': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      };

      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="relative">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
            {course.isEnrolled && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Enrolled
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              {course.duration}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-blue-600 font-medium">{course.category}</span>
              <span className={\`px-2 py-1 rounded-full text-xs font-medium \${getDifficultyColor(course.difficulty)}\`}>
                {course.difficulty}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

            <p className="text-sm text-gray-700 mb-4">
              <span className="font-medium">Instructor:</span> {course.instructor}
            </p>

            <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">⭐</span>
                  <span>{course.rating}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-1">👥</span>
                  <span>{course.studentsCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-1">📖</span>
                  <span>{course.lessonsCount} lessons</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {course.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {tag}
                </span>
              ))}
              {course.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  +{course.tags.length - 3} more
                </span>
              )}
            </div>

            {course.isEnrolled && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: \`\${course.progress}%\` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              {course.isEnrolled ? (
                <button 
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  onClick={() => alert('Continue Learning - Feature coming soon!')}
                >
                  Continue Learning
                </button>
              ) : (
                <button
                  onClick={() => onEnroll(course.id)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Enroll Now
                </button>
              )}
              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-gray-900">\${course.price}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Dashboard Component
    function Dashboard({ user, courses }) {
      const [activeTab, setActiveTab] = useState('overview');

      const enrolledCourses = courses.filter(course => course.isEnrolled);
      const completedCourses = courses.filter(course => course.progress === 100);
      const inProgressCourses = courses.filter(course => course.isEnrolled && course.progress > 0 && course.progress < 100);

      const totalLessonsCompleted = enrolledCourses.reduce((sum, course) => 
        sum + Math.floor((course.progress / 100) * course.lessonsCount), 0
      );

      const averageProgress = enrolledCourses.length > 0 
        ? enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length 
        : 0;

      const stats = [
        { label: 'Enrolled Courses', value: enrolledCourses.length, color: 'bg-blue-500', icon: '📚' },
        { label: 'Completed Courses', value: completedCourses.length, color: 'bg-green-500', icon: '✅' },
        { label: 'Lessons Completed', value: totalLessonsCompleted, color: 'bg-purple-500', icon: '🎯' },
        { label: 'Average Progress', value: \`\${Math.round(averageProgress)}%\`, color: 'bg-orange-500', icon: '📊' }
      ];

      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
                <p className="text-gray-600">Continue your learning journey</p>
                <p className="text-sm text-gray-500 mt-1">Member since {new Date(user.joinedDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'enrolled', label: 'Enrolled Courses' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'certificates', label: 'Certificates' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors \${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }\`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className={\`p-3 rounded-lg \${stat.color} bg-opacity-10\`}>
                            <span className="text-2xl">{stat.icon}</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Continue Learning</h3>
                    {inProgressCourses.length > 0 ? (
                      <div className="space-y-4">
                        {inProgressCourses.slice(0, 3).map(course => (
                          <div key={course.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                            <div className="flex items-center space-x-4">
                              <img src={course.thumbnail} alt={course.title} className="w-12 h-12 rounded-lg object-cover" />
                              <div>
                                <h4 className="font-medium text-gray-900">{course.title}</h4>
                                <p className="text-sm text-gray-600">by {course.instructor}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-sm text-gray-600">{course.progress}% complete</div>
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: \`\${course.progress}%\` }}
                                  ></div>
                                </div>
                              </div>
                              <button 
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                onClick={() => alert('Continue course - Feature coming soon!')}
                              >
                                Continue
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No courses in progress. Enroll in a course to start learning!</p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">🏆</div>
                        <h4 className="font-medium text-gray-900">First Course</h4>
                        <p className="text-sm text-gray-600">Complete your first course</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">🔥</div>
                        <h4 className="font-medium text-gray-900">Learning Streak</h4>
                        <p className="text-sm text-gray-600">7 days in a row</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">🎯</div>
                        <h4 className="font-medium text-gray-900">Quiz Master</h4>
                        <p className="text-sm text-gray-600">Score 90%+ on 5 quizzes</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'enrolled' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Your Enrolled Courses</h3>
                  {enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {enrolledCourses.map(course => (
                        <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <img src={course.thumbnail} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-4" />
                          <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: \`\${course.progress}%\` }}
                              ></div>
                            </div>
                          </div>
                          <button 
                            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={() => alert('Continue Learning - Feature coming soon!')}
                          >
                            Continue Learning
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📚</div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No enrolled courses</h3>
                      <p className="text-gray-600">Browse our course catalog to get started</p>
                    </div>
                  )}
                </div>
              )}

              {(activeTab === 'completed' || activeTab === 'certificates') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeTab === 'completed' ? 'Completed Courses' : 'Your Certificates'}
                  </h3>
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">{activeTab === 'completed' ? '🎓' : '🏆'}</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {activeTab === 'completed' ? 'No completed courses' : 'No certificates yet'}
                    </h3>
                    <p className="text-gray-600">
                      {activeTab === 'completed' ? 'Complete your first course to see it here' : 'Complete courses to earn certificates'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Main App Component
    function EduLearnApp() {
      const [courses, setCourses] = useState(mockCourses);
      const [user, setUser] = useState(mockUser);
      const [currentView, setCurrentView] = useState('courses');
      const [selectedCategory, setSelectedCategory] = useState('all');
      const [searchQuery, setSearchQuery] = useState('');

      // Filter courses based on category and search
      const filteredCourses = courses.filter(course => {
        const matchesCategory = selectedCategory === 'all' || course.category.toLowerCase().includes(selectedCategory.toLowerCase());
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      });

      const categories = ['all', 'Frontend Development', 'Backend Development', 'Full-Stack Development', 'Data Science'];

      const handleEnrollCourse = (courseId) => {
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === courseId 
              ? { ...course, isEnrolled: true, progress: Math.floor(Math.random() * 75) + 5 }
              : course
          )
        );
        
        setUser(prevUser => ({
          ...prevUser,
          enrolledCourses: [...prevUser.enrolledCourses, courseId]
        }));
        
        alert('Successfully enrolled! Check your dashboard to track progress.');
      };

      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar 
            user={user} 
            currentView={currentView} 
            onViewChange={setCurrentView}
          />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'courses' ? (
              <>
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white p-8 mb-8">
                  <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold mb-4">
                      Learn. Build. Grow.
                    </h1>
                    <p className="text-xl mb-6 opacity-90">
                      Master the latest technologies with our comprehensive courses designed by industry experts.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        1000+ Students
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                        Expert Instructors
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                        Lifetime Access
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEnroll={handleEnrollCourse}
                    />
                  ))}
                </div>

                {filteredCourses.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters</p>
                  </div>
                )}
              </>
            ) : (
              <Dashboard user={user} courses={courses} />
            )}
          </div>
        </div>
      );
    }

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(EduLearnApp));
  </script>
</body>
</html>`;
};

// Next.js App Compiler
const compileNextJsApp = (files: Record<string, string>): string => {
  // Extract Tailwind CSS if available
  const globalsCss = files['app/globals.css'] || '';
  
  // Extract the main page content
  const pageContent = files['app/page.tsx'] || '';
  
  // Extract components
  const userListContent = files['app/components/UserList.tsx'] || '';
  const userFormContent = files['app/components/UserForm.tsx'] || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Next.js Full-stack App - Live Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Global styles from globals.css */
    ${globalsCss}
    
    /* Additional Next.js specific styles */
    body {
      margin: 0;
      padding: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    
    // Mock API calls for preview
    const mockUsers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Jane Smith', 
        email: 'jane@example.com',
        createdAt: new Date().toISOString()
      }
    ];
    
    let userIdCounter = 3;

    // Mock API functions
    const mockFetchUsers = () => {
      return Promise.resolve({ users: mockUsers });
    };
    
    const mockCreateUser = (userData) => {
      const newUser = {
        id: userIdCounter++,
        name: userData.name,
        email: userData.email,
        createdAt: new Date().toISOString()
      };
      mockUsers.push(newUser);
      return Promise.resolve({ user: newUser });
    };
    
    const mockDeleteUser = (userId) => {
      const index = mockUsers.findIndex(u => u.id === userId);
      if (index > -1) {
        mockUsers.splice(index, 1);
      }
      return Promise.resolve({ success: true });
    };

    // UserList Component
    function UserList({ users, onUserDeleted }) {
      const handleDelete = async (userId) => {
        if (confirm('Are you sure you want to delete this user?')) {
          try {
            await mockDeleteUser(userId);
            onUserDeleted(userId);
          } catch (error) {
            alert('Failed to delete user');
          }
        }
      };

      if (users.length === 0) {
        return (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <p className="text-gray-500">No users found</p>
            <p className="text-gray-400 text-sm mt-1">Add a user to get started</p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                  <p className="text-gray-400 text-xs">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(user.id)}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                title="Delete user"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      );
    }

    // UserForm Component  
    function UserForm({ onUserCreated }) {
      const [name, setName] = useState('');
      const [email, setEmail] = useState('');
      const [loading, setLoading] = useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim() || !email.trim()) {
          alert('Please fill in all fields');
          return;
        }

        setLoading(true);

        try {
          const result = await mockCreateUser({
            name: name.trim(),
            email: email.trim()
          });
          
          onUserCreated(result.user);
          setName('');
          setEmail('');
        } catch (error) {
          alert('Failed to create user');
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter user name"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter user email"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      );
    }

    // Main App Component (from page.tsx)
    function Home() {
      const [users, setUsers] = useState([]);
      const [loading, setLoading] = useState(true);
      const [showForm, setShowForm] = useState(false);

      useEffect(() => {
        fetchUsers();
      }, []);

      const fetchUsers = async () => {
        try {
          const data = await mockFetchUsers();
          setUsers(data.users || []);
        } catch (error) {
          console.error('Failed to fetch users:', error);
        } finally {
          setLoading(false);
        }
      };

      const handleUserCreated = (newUser) => {
        setUsers([...users, newUser]);
        setShowForm(false);
      };

      const handleUserDeleted = (userId) => {
        setUsers(users.filter(user => user.id !== userId));
      };

      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Next.js Full-stack App
              </h1>
              <p className="text-gray-600">
                A complete web application with frontend and API routes
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  User Management
                </h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {showForm ? 'Cancel' : 'Add User'}
                </button>
              </div>

              {showForm && (
                <div className="mb-6">
                  <UserForm onUserCreated={handleUserCreated} />
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              ) : (
                <UserList users={users} onUserDeleted={handleUserDeleted} />
              )}
            </div>

            <div className="mt-8 text-center text-gray-500 text-sm">
              <p>Built with Next.js, React, and TypeScript</p>
              <p className="mt-1">Powered by SwiStack</p>
            </div>
          </div>
        </div>
      );
    }

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(Home));
  </script>
</body>
</html>`;
};

// Simple React component compiler
const compileReactApp = (files: Record<string, string>): string => {
  // Extract all CSS files for bundling
  const cssFiles = Object.entries(files).filter(([path]) => path.endsWith('.css'));
  const allCss = cssFiles.map(([, content]) => content).join('\n\n');
  
  // Extract JS files
  const appJs = files['src/App.js'] || '';
  const headerJs = files['src/components/Header.js'] || '';
  const todoListJs = files['src/components/TodoList.js'] || '';
  const todoItemJs = files['src/components/TodoItem.js'] || '';
  const footerJs = files['src/components/Footer.js'] || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Todo App - Live Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    /* Combined CSS from all files */
    ${allCss}
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    
    // Header Component
    function Header() {
      return (
        React.createElement('header', { className: 'header' },
          React.createElement('div', { className: 'container' },
            React.createElement('h1', { className: 'logo' },
              React.createElement('span', { className: 'logo-icon' }, '⚡'),
              'React Todo App'
            ),
            React.createElement('p', { className: 'subtitle' }, 'Built with SwiStack')
          )
        )
      );
    }

    // TodoItem Component
    function TodoItem({ todo, onToggle, onDelete }) {
      return (
        React.createElement('div', { 
          className: \`todo-item \${todo.completed ? 'completed' : ''}\`
        },
          React.createElement('div', { className: 'todo-content' },
            React.createElement('button', {
              className: 'toggle-button',
              onClick: () => onToggle(todo.id)
            }, todo.completed ? '✓' : '○'),
            React.createElement('span', { className: 'todo-text' }, todo.text)
          ),
          React.createElement('button', {
            className: 'delete-button',
            onClick: () => onDelete(todo.id)
          }, '×')
        )
      );
    }

    // TodoList Component
    function TodoList({ todos, onAddTodo, onToggleTodo, onDeleteTodo }) {
      const [newTodo, setNewTodo] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        if (newTodo.trim()) {
          onAddTodo(newTodo.trim());
          setNewTodo('');
        }
      };

      return (
        React.createElement('div', { className: 'todo-list' },
          React.createElement('div', { className: 'todo-header' },
            React.createElement('h2', null, 'My Tasks'),
            React.createElement('p', null, \`\${todos.filter(todo => !todo.completed).length} remaining\`)
          ),
          React.createElement('form', { onSubmit: handleSubmit, className: 'todo-form' },
            React.createElement('input', {
              type: 'text',
              value: newTodo,
              onChange: (e) => setNewTodo(e.target.value),
              placeholder: 'Add a new task...',
              className: 'todo-input'
            }),
            React.createElement('button', {
              type: 'submit',
              className: 'add-button'
            }, 'Add Task')
          ),
          React.createElement('div', { className: 'todos' },
            todos.length === 0 
              ? React.createElement('p', { className: 'empty-state' }, 'No tasks yet. Add one above!')
              : todos.map(todo => 
                  React.createElement(TodoItem, {
                    key: todo.id,
                    todo: todo,
                    onToggle: onToggleTodo,
                    onDelete: onDeleteTodo
                  })
                )
          )
        )
      );
    }

    // Footer Component
    function Footer() {
      return (
        React.createElement('footer', { className: 'footer' },
          React.createElement('div', { className: 'container' },
            React.createElement('p', null, '© 2024 React Todo App. Built with ❤️ using SwiStack.'),
            React.createElement('div', { className: 'footer-links' },
              React.createElement('a', { href: '#', className: 'footer-link' }, 'About'),
              React.createElement('a', { href: '#', className: 'footer-link' }, 'Contact'),
              React.createElement('a', { href: '#', className: 'footer-link' }, 'GitHub')
            )
          )
        )
      );
    }

    // Main App Component
    function App() {
      const [todos, setTodos] = useState([
        { id: 1, text: 'Learn React', completed: false },
        { id: 2, text: 'Build awesome apps', completed: false },
        { id: 3, text: 'Deploy to production', completed: false }
      ]);

      const addTodo = (text) => {
        const newTodo = {
          id: Date.now(),
          text,
          completed: false
        };
        setTodos([...todos, newTodo]);
      };

      const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
      };

      const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
      };

      return (
        React.createElement('div', { className: 'App' },
          React.createElement(Header),
          React.createElement('main', { className: 'main-content' },
            React.createElement(TodoList, {
              todos: todos,
              onAddTodo: addTodo,
              onToggleTodo: toggleTodo,
              onDeleteTodo: deleteTodo
            })
          ),
          React.createElement(Footer)
        )
      );
    }

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
};

export default function LivePreview({ 
  fileTree, 
  activeFile, 
  activeFileContent, 
  previewType = 'react',
  templateKey,
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
      if (activeFile && activeFileContent) {
        files[activeFile] = activeFileContent;
      }
      
      let compiledHtml: string;
      
      switch (previewType) {
        case 'react':
          compiledHtml = compileReactApp(files);
          break;
        case 'api-docs':
          // Detect framework from files
          const isFlask = files['app.py'] !== undefined;
          const framework = isFlask ? 'flask' : 'express';
          compiledHtml = generateApiDocs(files, framework);
          break;
        case 'nextjs':
          // Check if this is the e-learning template based on templateKey or content
          if (templateKey?.includes('elearning') || 
              (files['app/page.tsx'] && (
                files['app/page.tsx'].includes('CourseCard') || 
                files['app/page.tsx'].includes('edulearn-platform') ||
                files['app/page.tsx'].includes('enrolledCourses')
              ))) {
            compiledHtml = compileElearningPlatform(files);
          } else {
            compiledHtml = compileNextJsApp(files);
          }
          break;
        case 'static':
        default:
          // Show the README or main file as static content
          const readmeContent = files['README.md'] || '';
          compiledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Preview</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 6px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <pre>${readmeContent}</pre>
</body>
</html>`;
          break;
      }
      
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
  }, [fileTree, activeFile, activeFileContent, templateKey]);

  // Update preview when files change (hot reload)
  useEffect(() => {
    if (!isHotReloadEnabled) return;
    
    // Debounce the update to avoid too many rapid updates
    const timeoutId = setTimeout(() => {
      updatePreview();
    }, 300); // 300ms debounce
    
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
            <p className="text-sm mb-3">Failed to compile the React application</p>
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
              <p className="text-sm">Compiling React App...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}