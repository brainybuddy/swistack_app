interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface TemplateConfig {
  key: string;
  name: string;
  category: 'frontend' | 'backend' | 'fullstack';
  framework: string;
  fileTree: FileNode[];
  previewType: 'react' | 'api-docs' | 'static' | 'nextjs';
}

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'react': {
    key: 'react',
    name: 'React App',
    category: 'frontend',
    framework: 'react',
    previewType: 'react',
    fileTree: [
      {
        name: 'public',
        type: 'folder',
        children: [
          { 
            name: 'index.html', 
            type: 'file', 
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="React App created with SwiStack" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`, 
            language: 'html' 
          }
        ]
      },
      {
        name: 'src',
        type: 'folder',
        children: [
          { 
            name: 'index.js', 
            type: 'file', 
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`, 
            language: 'javascript' 
          },
          { 
            name: 'App.js', 
            type: 'file', 
            content: `import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import TodoList from './components/TodoList';
import Footer from './components/Footer';

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
    <div className="App">
      <Header />
      <main className="main-content">
        <TodoList 
          todos={todos} 
          onAddTodo={addTodo}
          onToggleTodo={toggleTodo}
          onDeleteTodo={deleteTodo}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;`, 
            language: 'javascript' 
          },
          { 
            name: 'App.css', 
            type: 'file', 
            content: `.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}`, 
            language: 'css' 
          },
          { 
            name: 'index.css', 
            type: 'file', 
            content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  background-color: #f5f5f5;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`, 
            language: 'css' 
          },
          {
            name: 'components',
            type: 'folder',
            children: [
              { 
                name: 'Header.js', 
                type: 'file', 
                content: `import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">
          <span className="logo-icon">⚡</span>
          React Todo App
        </h1>
        <p className="subtitle">Built with SwiStack</p>
      </div>
    </header>
  );
}

export default Header;`, 
                language: 'javascript' 
              },
              { 
                name: 'Header.css', 
                type: 'file', 
                content: `.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
  color: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.logo {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 3rem;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .logo {
    font-size: 2rem;
  }
  
  .logo-icon {
    font-size: 2.5rem;
  }
  
  .container {
    padding: 0 1rem;
  }
}`, 
                language: 'css' 
              },
              { 
                name: 'TodoList.js', 
                type: 'file', 
                content: `import React, { useState } from 'react';
import TodoItem from './TodoItem';
import './TodoList.css';

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
    <div className="todo-list">
      <div className="todo-header">
        <h2>My Tasks</h2>
        <p>{todos.filter(todo => !todo.completed).length} remaining</p>
      </div>
      
      <form onSubmit={handleSubmit} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add Task
        </button>
      </form>

      <div className="todos">
        {todos.length === 0 ? (
          <p className="empty-state">No tasks yet. Add one above!</p>
        ) : (
          todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggleTodo}
              onDelete={onDeleteTodo}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TodoList;`, 
                language: 'javascript' 
              },
              { 
                name: 'TodoList.css', 
                type: 'file', 
                content: `.todo-list {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.todo-header {
  text-align: center;
  margin-bottom: 2rem;
}

.todo-header h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.todo-header p {
  color: #666;
  font-size: 1rem;
}

.todo-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.todo-input {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.todo-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-button {
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.add-button:hover {
  transform: translateY(-2px);
}

.todos {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 2rem;
}

@media (max-width: 768px) {
  .todo-list {
    padding: 1.5rem;
  }
  
  .todo-form {
    flex-direction: column;
  }
  
  .todo-header h2 {
    font-size: 1.5rem;
  }
}`, 
                language: 'css' 
              },
              { 
                name: 'TodoItem.js', 
                type: 'file', 
                content: `import React from 'react';
import './TodoItem.css';

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
      <div className="todo-content">
        <button
          className="toggle-button"
          onClick={() => onToggle(todo.id)}
        >
          {todo.completed ? '✓' : '○'}
        </button>
        <span className="todo-text">{todo.text}</span>
      </div>
      <button
        className="delete-button"
        onClick={() => onDelete(todo.id)}
      >
        ×
      </button>
    </div>
  );
}

export default TodoItem;`, 
                language: 'javascript' 
              },
              { 
                name: 'TodoItem.css', 
                type: 'file', 
                content: `.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.todo-item:hover {
  background: #e9ecef;
}

.todo-item.completed {
  opacity: 0.7;
  background: #d4edda;
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.toggle-button {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid #667eea;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  color: #667eea;
  transition: all 0.3s ease;
}

.todo-item.completed .toggle-button {
  background: #667eea;
  color: white;
}

.todo-text {
  font-size: 1rem;
  color: #333;
  transition: all 0.3s ease;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #666;
}

.delete-button {
  width: 2rem;
  height: 2rem;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.delete-button:hover {
  background: #c82333;
}`, 
                language: 'css' 
              },
              { 
                name: 'Footer.js', 
                type: 'file', 
                content: `import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; 2024 React Todo App. Built with ❤️ using SwiStack.</p>
        <div className="footer-links">
          <a href="#" className="footer-link">About</a>
          <a href="#" className="footer-link">Contact</a>
          <a href="#" className="footer-link">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;`, 
                language: 'javascript' 
              },
              { 
                name: 'Footer.css', 
                type: 'file', 
                content: `.footer {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 2rem 0;
  margin-top: auto;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-link {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.footer-link:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 0 1rem;
  }
  
  .footer-links {
    gap: 1.5rem;
  }
}`, 
                language: 'css' 
              }
            ]
          }
        ]
      },
      { 
        name: 'package.json', 
        type: 'file', 
        content: `{
  "name": "react-todo-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`, 
        language: 'json' 
      },
      { 
        name: 'README.md', 
        type: 'file', 
        content: `# React Todo App

A beautiful, responsive todo application built with React and SwiStack.

## Features

- ✅ Add, toggle, and delete tasks
- 🎨 Beautiful gradient design
- 📱 Fully responsive
- ⚡ Fast and lightweight
- 🔥 Hot reload development

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm start
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

- \`npm start\` - Runs the app in development mode
- \`npm test\` - Launches the test runner
- \`npm run build\` - Builds the app for production
- \`npm run eject\` - Ejects from Create React App

## Built With

- [React](https://reactjs.org/) - The web framework used
- [SwiStack](https://swistack.com) - The development platform
- CSS3 - For styling and animations

## License

This project is licensed under the MIT License.
`, 
        language: 'markdown' 
      }
    ]
  },
  
  'nodejs-express': {
    key: 'nodejs-express',
    name: 'Node.js Express API',
    category: 'backend',
    framework: 'express',
    previewType: 'api-docs',
    fileTree: [
      {
        name: 'src',
        type: 'folder',
        children: [
          {
            name: 'server.js',
            type: 'file',
            content: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Express API',
    version: '1.0.0',
    endpoints: {
      'GET /': 'This endpoint',
      'GET /api/users': 'Get all users',
      'POST /api/users': 'Create a new user',
      'GET /api/users/:id': 'Get user by ID',
      'PUT /api/users/:id': 'Update user',
      'DELETE /api/users/:id': 'Delete user'
    }
  });
});

// User routes
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ 
      error: 'Name and email are required' 
    });
  }
  
  const newUser = {
    id: Date.now(),
    name,
    email
  };
  
  res.status(201).json(newUser);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = { 
    id: parseInt(id), 
    name: 'John Doe', 
    email: 'john@example.com' 
  };
  res.json(user);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  
  const updatedUser = {
    id: parseInt(id),
    name: name || 'John Doe',
    email: email || 'john@example.com'
  };
  
  res.json(updatedUser);
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: \`User \${id} deleted successfully\` 
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📚 API Documentation available at http://localhost:\${PORT}\`);
});

module.exports = app;`,
            language: 'javascript'
          },
          {
            name: 'routes',
            type: 'folder',
            children: [
              {
                name: 'users.js',
                type: 'file',
                content: `const express = require('express');
const router = express.Router();

// Mock user data
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() }
];

// Get all users
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: users,
    count: users.length
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Create new user
router.post('/', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: Math.max(...users.map(u => u.id)) + 1,
    name,
    email,
    createdAt: new Date()
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

// Update user
router.put('/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  users[userIndex] = {
    ...users[userIndex],
    ...req.body,
    updatedAt: new Date()
  };
  
  res.json({
    success: true,
    data: users[userIndex]
  });
});

// Delete user
router.delete('/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  users.splice(userIndex, 1);
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

module.exports = router;`,
                language: 'javascript'
              }
            ]
          }
        ]
      },
      {
        name: 'package.json',
        type: 'file',
        content: `{
  "name": "express-api",
  "version": "1.0.0",
  "description": "RESTful API with Express.js",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.0",
    "supertest": "^6.3.0"
  },
  "keywords": ["express", "api", "rest", "node"],
  "author": "SwiStack",
  "license": "MIT"
}`,
        language: 'json'
      },
      {
        name: '.env.example',
        type: 'file',
        content: `PORT=3000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGIN=*`,
        language: 'bash'
      },
      {
        name: 'README.md',
        type: 'file',
        content: `# Express.js REST API

A modern RESTful API built with Express.js and Node.js.

## Features

- 🚀 Express.js framework
- 🔒 Security with Helmet
- 🌐 CORS enabled
- 📝 JSON request/response
- ⚡ Fast and lightweight
- 🔧 Easy to extend

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. The API will be available at [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Users
- \`GET /api/users\` - Get all users
- \`POST /api/users\` - Create a new user
- \`GET /api/users/:id\` - Get user by ID
- \`PUT /api/users/:id\` - Update user
- \`DELETE /api/users/:id\` - Delete user

### Example Requests

\`\`\`bash
# Get all users
curl http://localhost:3000/api/users

# Create a user
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","email":"john@example.com"}'
\`\`\`

## Environment Variables

Copy \`.env.example\` to \`.env\` and update the values:

- \`PORT\` - Server port (default: 3000)
- \`NODE_ENV\` - Environment (development/production)
- \`CORS_ORIGIN\` - CORS allowed origins

## License

MIT License`,
        language: 'markdown'
      }
    ]
  },
  
  'python-flask': {
    key: 'python-flask',
    name: 'Python Flask API',
    category: 'backend',
    framework: 'flask',
    previewType: 'api-docs',
    fileTree: [
      {
        name: 'app.py',
        type: 'file',
        content: `from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Mock data
users = [
    {
        'id': 1,
        'name': 'John Doe',
        'email': 'john@example.com',
        'created_at': datetime.now().isoformat()
    },
    {
        'id': 2,
        'name': 'Jane Smith',
        'email': 'jane@example.com',
        'created_at': datetime.now().isoformat()
    }
]

@app.route('/')
def home():
    return jsonify({
        'message': 'Welcome to Flask API',
        'version': '1.0.0',
        'endpoints': {
            'GET /': 'This endpoint',
            'GET /api/users': 'Get all users',
            'POST /api/users': 'Create a new user',
            'GET /api/users/<id>': 'Get user by ID',
            'PUT /api/users/<id>': 'Update user',
            'DELETE /api/users/<id>': 'Delete user'
        }
    })

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify({
        'success': True,
        'data': users,
        'count': len(users)
    })

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    
    if not data or 'name' not in data or 'email' not in data:
        return jsonify({
            'success': False,
            'error': 'Name and email are required'
        }), 400
    
    new_user = {
        'id': max(user['id'] for user in users) + 1 if users else 1,
        'name': data['name'],
        'email': data['email'],
        'created_at': datetime.now().isoformat()
    }
    
    users.append(new_user)
    
    return jsonify({
        'success': True,
        'data': new_user
    }), 201

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user:
        return jsonify({
            'success': False,
            'error': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'data': user
    })

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user:
        return jsonify({
            'success': False,
            'error': 'User not found'
        }), 404
    
    data = request.get_json()
    if data:
        user.update(data)
        user['updated_at'] = datetime.now().isoformat()
    
    return jsonify({
        'success': True,
        'data': user
    })

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    global users
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user:
        return jsonify({
            'success': False,
            'error': 'User not found'
        }), 404
    
    users = [u for u in users if u['id'] != user_id]
    
    return jsonify({
        'success': True,
        'message': 'User deleted successfully'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🐍 Flask API running on port {port}")
    print(f"📚 API Documentation available at http://localhost:{port}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)`,
        language: 'python'
      },
      {
        name: 'requirements.txt',
        type: 'file',
        content: `Flask==2.3.0
Flask-CORS==4.0.0
python-dotenv==1.0.0
gunicorn==21.2.0`,
        language: 'text'
      },
      {
        name: 'models.py',
        type: 'file',
        content: `from datetime import datetime
from typing import Dict, List, Optional

class User:
    """User model for the Flask API"""
    
    def __init__(self, id: int, name: str, email: str, created_at: Optional[datetime] = None):
        self.id = id
        self.name = name
        self.email = email
        self.created_at = created_at or datetime.now()
        self.updated_at = None
    
    def to_dict(self) -> Dict:
        """Convert user object to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update(self, data: Dict) -> None:
        """Update user with new data"""
        for key, value in data.items():
            if hasattr(self, key) and key not in ['id', 'created_at']:
                setattr(self, key, value)
        self.updated_at = datetime.now()

class UserManager:
    """Manages user operations"""
    
    def __init__(self):
        self.users: List[User] = []
        self._next_id = 1
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """Add some sample users"""
        self.create_user('John Doe', 'john@example.com')
        self.create_user('Jane Smith', 'jane@example.com')
    
    def get_all_users(self) -> List[Dict]:
        """Get all users"""
        return [user.to_dict() for user in self.users]
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        user = next((u for u in self.users if u.id == user_id), None)
        return user.to_dict() if user else None
    
    def create_user(self, name: str, email: str) -> Dict:
        """Create a new user"""
        user = User(self._next_id, name, email)
        self.users.append(user)
        self._next_id += 1
        return user.to_dict()
    
    def update_user(self, user_id: int, data: Dict) -> Optional[Dict]:
        """Update user"""
        user = next((u for u in self.users if u.id == user_id), None)
        if user:
            user.update(data)
            return user.to_dict()
        return None
    
    def delete_user(self, user_id: int) -> bool:
        """Delete user"""
        user = next((u for u in self.users if u.id == user_id), None)
        if user:
            self.users.remove(user)
            return True
        return False`,
        language: 'python'
      },
      {
        name: 'config.py',
        type: 'file',
        content: `import os
from typing import Dict, Any

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
    DEBUG = False
    TESTING = False
    
    # Database
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    
    # API Settings
    API_VERSION = '1.0.0'
    API_TITLE = 'Flask REST API'
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    @staticmethod
    def get_config() -> Dict[str, Any]:
        """Get configuration as dictionary"""
        return {
            'SECRET_KEY': Config.SECRET_KEY,
            'DEBUG': Config.DEBUG,
            'API_VERSION': Config.API_VERSION,
            'API_TITLE': Config.API_TITLE
        }

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    
class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}`,
        language: 'python'
      },
      {
        name: '.env.example',
        type: 'file',
        content: `FLASK_ENV=development
FLASK_APP=app.py
PORT=5000
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=*
DATABASE_URL=sqlite:///app.db`,
        language: 'bash'
      },
      {
        name: 'README.md',
        type: 'file',
        content: `# Flask REST API

A modern RESTful API built with Python Flask.

## Features

- 🐍 Python Flask framework
- 🌐 CORS enabled
- 📝 JSON request/response
- 🔧 Modular structure
- ⚡ Fast and lightweight
- 🛠️ Easy to extend

## Getting Started

1. Create virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Start the development server:
   \`\`\`bash
   python app.py
   \`\`\`

4. The API will be available at [http://localhost:5000](http://localhost:5000)

## API Endpoints

### Users
- \`GET /api/users\` - Get all users
- \`POST /api/users\` - Create a new user
- \`GET /api/users/<id>\` - Get user by ID
- \`PUT /api/users/<id>\` - Update user
- \`DELETE /api/users/<id>\` - Delete user

### Example Requests

\`\`\`bash
# Get all users
curl http://localhost:5000/api/users

# Create a user
curl -X POST http://localhost:5000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get user by ID
curl http://localhost:5000/api/users/1

# Update user
curl -X PUT http://localhost:5000/api/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Smith"}'

# Delete user
curl -X DELETE http://localhost:5000/api/users/1
\`\`\`

## Project Structure

\`\`\`
├── app.py              # Main application
├── models.py           # Data models
├── config.py          # Configuration
├── requirements.txt   # Dependencies
└── README.md         # This file
\`\`\`

## Environment Variables

Copy \`.env.example\` to \`.env\` and update the values:

- \`PORT\` - Server port (default: 5000)
- \`FLASK_ENV\` - Environment (development/production)
- \`SECRET_KEY\` - Secret key for sessions
- \`CORS_ORIGINS\` - CORS allowed origins

## License

MIT License`,
        language: 'markdown'
      }
    ]
  },

  'nextjs-fullstack': {
    key: 'nextjs-fullstack',
    name: 'Next.js Full-stack',
    category: 'fullstack',
    framework: 'nextjs',
    previewType: 'nextjs',
    fileTree: [
      {
        name: 'app',
        type: 'folder',
        children: [
          {
            name: 'page.tsx',
            type: 'file',
            content: `'use client';

import { useState, useEffect } from 'react';
import UserList from './components/UserList';
import UserForm from './components/UserForm';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = (newUser: User) => {
    setUsers([...users, newUser]);
    setShowForm(false);
  };

  const handleUserDeleted = (userId: number) => {
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
}`,
            language: 'tsx'
          },
          {
            name: 'components',
            type: 'folder',
            children: [
              {
                name: 'UserList.tsx',
                type: 'file',
                content: `interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface UserListProps {
  users: User[];
  onUserDeleted: (userId: number) => void;
}

export default function UserList({ users, onUserDeleted }: UserListProps) {
  const handleDelete = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(\`/api/users/\${userId}\`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          onUserDeleted(userId);
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
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
}`,
                language: 'tsx'
              },
              {
                name: 'UserForm.tsx',
                type: 'file',
                content: `'use client';

import { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface UserFormProps {
  onUserCreated: (user: User) => void;
}

export default function UserForm({ onUserCreated }: UserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onUserCreated(result.user);
        setName('');
        setEmail('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
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
}`,
                language: 'tsx'
              }
            ]
          },
          {
            name: 'api',
            type: 'folder',
            children: [
              {
                name: 'users',
                type: 'folder',
                children: [
                  {
                    name: 'route.ts',
                    type: 'file',
                    content: `import { NextRequest, NextResponse } from 'next/server';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// Mock data - in a real app, this would be a database
let users: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    createdAt: new Date().toISOString(),
  },
];

let nextId = 3;

export async function GET() {
  return NextResponse.json({
    success: true,
    users: users,
    count: users.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    const newUser: User = {
      id: nextId++,
      name,
      email,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    return NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON data' },
      { status: 400 }
    );
  }
}`,
                    language: 'typescript'
                  },
                  {
                    name: '[id]',
                    type: 'folder',
                    children: [
                      {
                        name: 'route.ts',
                        type: 'file',
                        content: `import { NextRequest, NextResponse } from 'next/server';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// This would be imported from a shared module in a real app
let users: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    createdAt: new Date().toISOString(),
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    user: user,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    if (name) users[userIndex].name = name;
    if (email) {
      // Check if email already exists for another user
      const existingUser = users.find(user => user.email === email && user.id !== id);
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
      users[userIndex].email = email;
    }

    return NextResponse.json({
      success: true,
      user: users[userIndex],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON data' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  users.splice(userIndex, 1);

  return NextResponse.json({
    success: true,
    message: 'User deleted successfully',
  });
}`,
                        language: 'typescript'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'globals.css',
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
}`,
            language: 'css'
          },
          {
            name: 'layout.tsx',
            type: 'file',
            content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Next.js Full-stack App',
  description: 'A complete web application with frontend and API routes',
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
}`,
            language: 'tsx'
          }
        ]
      },
      {
        name: 'package.json',
        type: 'file',
        content: `{
  "name": "nextjs-fullstack",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  },
  "devDependencies": {
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0"
  }
}`,
        language: 'json'
      },
      {
        name: 'tailwind.config.js',
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
}`,
        language: 'javascript'
      },
      {
        name: 'README.md',
        type: 'file',
        content: `# Next.js Full-stack Application

A complete web application with both frontend components and API routes built with Next.js 14.

## Features

- ▲ Next.js 14 with App Router
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 📱 Responsive design
- 🔄 Full CRUD operations
- 🚀 API routes for backend functionality
- ⚡ Hot reload development

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000) to view the application

## Project Structure

\`\`\`
app/
├── page.tsx              # Home page
├── layout.tsx           # Root layout
├── globals.css          # Global styles
├── components/          # React components
│   ├── UserList.tsx    # User list component
│   └── UserForm.tsx    # User form component
└── api/                # API routes
    └── users/          # User API endpoints
        ├── route.ts    # GET /api/users, POST /api/users
        └── [id]/       # Dynamic user routes
            └── route.ts # GET/PUT/DELETE /api/users/[id]
\`\`\`

## API Endpoints

- \`GET /api/users\` - Get all users
- \`POST /api/users\` - Create a new user
- \`GET /api/users/[id]\` - Get user by ID
- \`PUT /api/users/[id]\` - Update user
- \`DELETE /api/users/[id]\` - Delete user

## Built With

- [Next.js](https://nextjs.org/) - The React framework
- [React](https://reactjs.org/) - The library for web interfaces
- [TypeScript](https://www.typescriptlang.org/) - For type safety
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [SwiStack](https://swistack.com) - The development platform

## License

MIT License`,
        language: 'markdown'
      }
    ]
  },

  'nextjs-elearning': {
    key: 'nextjs-elearning',
    name: 'Next.js E-learning Platform',
    category: 'fullstack',
    framework: 'nextjs',
    previewType: 'nextjs',
    fileTree: [
      {
        name: 'app',
        type: 'folder',
        children: [
          {
            name: 'page.tsx',
            type: 'file',
            content: `'use client';

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CourseCard from './components/CourseCard';
import Dashboard from './components/Dashboard';
import { Course, User } from './types';

// Mock data - in a real app, this would come from an API
const mockCourses: Course[] = [
  {
    id: 1,
    title: 'React Fundamentals',
    description: 'Learn the basics of React including components, hooks, and state management.',
    instructor: 'Sarah Johnson',
    duration: '8 weeks',
    difficulty: 'Beginner',
    thumbnail: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=React+Fundamentals',
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
    thumbnail: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Node.js+Backend',
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
    thumbnail: 'https://via.placeholder.com/300x200/DC2626/FFFFFF?text=Full+Stack+JS',
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
    thumbnail: 'https://via.placeholder.com/300x200/7C3AED/FFFFFF?text=Python+Data+Science',
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

const mockUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://via.placeholder.com/100x100/6366F1/FFFFFF?text=JD',
  enrolledCourses: [],
  completedCourses: [],
  totalProgress: 0,
  joinedDate: '2024-01-15'
};

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [user, setUser] = useState<User>(mockUser);
  const [currentView, setCurrentView] = useState<'courses' | 'dashboard'>('courses');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter courses based on category and search
  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'all' || course.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', 'Frontend Development', 'Backend Development', 'Full-Stack Development', 'Data Science'];

  const handleEnrollCourse = (courseId: number) => {
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, isEnrolled: true, progress: 0 }
          : course
      )
    );
    
    setUser(prevUser => ({
      ...prevUser,
      enrolledCourses: [...prevUser.enrolledCourses, courseId]
    }));
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
}`,
            language: 'tsx'
          },
          {
            name: 'types',
            type: 'folder',
            children: [
              {
                name: 'index.ts',
                type: 'file',
                content: `export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  enrolledCourses: number[];
  completedCourses: number[];
  totalProgress: number;
  joinedDate: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail: string;
  price: number;
  rating: number;
  studentsCount: number;
  lessonsCount: number;
  category: string;
  tags: string[];
  progress: number;
  isEnrolled: boolean;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: number; // in minutes
  orderIndex: number;
  isCompleted: boolean;
  transcript?: string;
  resources?: Resource[];
}

export interface Resource {
  id: number;
  title: string;
  type: 'pdf' | 'link' | 'code' | 'exercise';
  url: string;
  description?: string;
}

export interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // in minutes
}

export interface Question {
  id: number;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  userId: number;
  answers: Record<number, string | string[]>;
  score: number;
  completedAt: string;
  passed: boolean;
}

export interface Progress {
  userId: number;
  courseId: number;
  lessonsCompleted: number[];
  quizzesCompleted: number[];
  overallProgress: number; // percentage
  lastAccessed: string;
  timeSpent: number; // in minutes
}

export interface Certificate {
  id: number;
  userId: number;
  courseId: number;
  issuedDate: string;
  certificateUrl: string;
}`,
                language: 'typescript'
              }
            ]
          },
          {
            name: 'components',
            type: 'folder',
            children: [
              {
                name: 'Navbar.tsx',
                type: 'file',
                content: `'use client';

import { useState } from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  currentView: 'courses' | 'dashboard';
  onViewChange: (view: 'courses' | 'dashboard') => void;
}

export default function Navbar({ user, currentView, onViewChange }: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EL</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">EduLearn</h1>
            </div>
          </div>

          {/* Navigation Links */}
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

          {/* User Profile */}
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
}`,
                language: 'tsx'
              },
              {
                name: 'CourseCard.tsx',
                type: 'file',
                content: `'use client';

import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onEnroll: (courseId: number) => void;
}

export default function CourseCard({ course, onEnroll }: CourseCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Thumbnail */}
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

      {/* Content */}
      <div className="p-6">
        {/* Category and Difficulty */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-blue-600 font-medium">{course.category}</span>
          <span className={\`px-2 py-1 rounded-full text-xs font-medium \${getDifficultyColor(course.difficulty)}\`}>
            {course.difficulty}
          </span>
        </div>

        {/* Title and Description */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

        {/* Instructor */}
        <p className="text-sm text-gray-700 mb-4">
          <span className="font-medium">Instructor:</span> {course.instructor}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{course.rating}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>{course.studentsCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{course.lessonsCount} lessons</span>
            </div>
          </div>
        </div>

        {/* Tags */}
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

        {/* Progress Bar (if enrolled) */}
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

        {/* Action Button and Price */}
        <div className="flex items-center justify-between">
          {course.isEnrolled ? (
            <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
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
}`,
                language: 'tsx'
              },
              {
                name: 'Dashboard.tsx',
                type: 'file',
                content: `'use client';

import { useState } from 'react';
import { User, Course } from '../types';

interface DashboardProps {
  user: User;
  courses: Course[];
}

export default function Dashboard({ user, courses }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'enrolled' | 'completed' | 'certificates'>('overview');

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
      {/* Header */}
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

      {/* Navigation Tabs */}
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
                onClick={() => setActiveTab(tab.key as any)}
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
              {/* Stats Grid */}
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

              {/* Recent Activity */}
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
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
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

              {/* Achievements */}
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
                      <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
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

          {activeTab === 'completed' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Completed Courses</h3>
              {completedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedCourses.map(course => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-6">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-4" />
                      <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>
                      <div className="flex items-center text-green-600 mb-3">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                      <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors">
                        Review Course
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🎓</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No completed courses</h3>
                  <p className="text-gray-600">Complete your first course to see it here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Certificates</h3>
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No certificates yet</h3>
                <p className="text-gray-600">Complete courses to earn certificates</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,
                language: 'tsx'
              }
            ]
          },
          {
            name: 'globals.css',
            type: 'file',
            content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 249, 250, 251;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 15, 23, 42;
    --background-end-rgb: 30, 41, 59;
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
  
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Loading animations */
@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.shimmer {
  animation: shimmer 1.2s ease-in-out infinite;
  background: linear-gradient(
    to right,
    #eff6ff 8%,
    #dbeafe 18%,
    #eff6ff 33%
  );
  background-size: 800px 100px;
}

/* Course card hover effects */
.course-card-hover {
  transition: all 0.3s ease;
}

.course-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Progress bar animations */
.progress-bar {
  transition: width 0.5s ease-in-out;
}

/* Button animations */
.button-hover {
  transition: all 0.2s ease;
}

.button-hover:hover {
  transform: translateY(-1px);
}

.button-hover:active {
  transform: translateY(0);
}`,
            language: 'css'
          },
          {
            name: 'layout.tsx',
            type: 'file',
            content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduLearn - E-learning Platform',
  description: 'Master new skills with our comprehensive online courses. Learn from industry experts with hands-on projects and interactive content.',
  keywords: 'online learning, courses, education, programming, web development, data science',
  authors: [{ name: 'EduLearn Team' }],
  openGraph: {
    title: 'EduLearn - E-learning Platform',
    description: 'Master new skills with our comprehensive online courses.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduLearn - E-learning Platform',
    description: 'Master new skills with our comprehensive online courses.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={inter.className}>
        <div id="root">{children}</div>
        <script
          dangerouslySetInnerHTML={{
            __html: \`
              // Prevent flash of unstyled content
              document.documentElement.classList.add('js');
            \`,
          }}
        />
      </body>
    </html>
  )
}`,
            language: 'tsx'
          },
          {
            name: 'api',
            type: 'folder',
            children: [
              {
                name: 'courses',
                type: 'folder',
                children: [
                  {
                    name: 'route.ts',
                    type: 'file',
                    content: `import { NextRequest, NextResponse } from 'next/server';
import { Course } from '../../types';

// Mock course data - in a real app, this would come from a database
const courses: Course[] = [
  {
    id: 1,
    title: 'React Fundamentals',
    description: 'Learn the basics of React including components, hooks, and state management.',
    instructor: 'Sarah Johnson',
    duration: '8 weeks',
    difficulty: 'Beginner',
    thumbnail: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=React+Fundamentals',
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
    thumbnail: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Node.js+Backend',
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
    thumbnail: 'https://via.placeholder.com/300x200/DC2626/FFFFFF?text=Full+Stack+JS',
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
    thumbnail: 'https://via.placeholder.com/300x200/7C3AED/FFFFFF?text=Python+Data+Science',
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  
  let filteredCourses = courses;
  
  if (category && category !== 'all') {
    filteredCourses = filteredCourses.filter(course => 
      course.category.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  if (search) {
    filteredCourses = filteredCourses.filter(course =>
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }
  
  return NextResponse.json({
    success: true,
    courses: filteredCourses,
    total: filteredCourses.length
  });
}`,
                    language: 'typescript'
                  },
                  {
                    name: '[id]',
                    type: 'folder',
                    children: [
                      {
                        name: 'route.ts',
                        type: 'file',
                        content: `import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = parseInt(params.id);
  
  // Mock course details - in a real app, this would come from a database
  const courseDetails = {
    id: courseId,
    title: 'React Fundamentals',
    description: 'Comprehensive React course covering components, hooks, state management, and modern React patterns.',
    instructor: 'Sarah Johnson',
    instructorBio: 'Senior React Developer with 8+ years of experience at top tech companies.',
    duration: '8 weeks',
    difficulty: 'Beginner',
    thumbnail: 'https://via.placeholder.com/600x400/4F46E5/FFFFFF?text=React+Fundamentals',
    price: 99,
    rating: 4.8,
    studentsCount: 1250,
    lessonsCount: 24,
    category: 'Frontend Development',
    tags: ['React', 'JavaScript', 'Frontend'],
    progress: 0,
    isEnrolled: false,
    syllabus: [
      {
        moduleTitle: 'Introduction to React',
        lessons: [
          'What is React?',
          'Setting up your development environment',
          'Your first React component',
          'Understanding JSX'
        ]
      },
      {
        moduleTitle: 'Components and Props',
        lessons: [
          'Creating functional components',
          'Understanding props',
          'Component composition',
          'Conditional rendering'
        ]
      },
      {
        moduleTitle: 'State and Lifecycle',
        lessons: [
          'Introduction to useState',
          'Managing component state',
          'useEffect hook',
          'Lifecycle methods'
        ]
      }
    ],
    prerequisites: ['Basic JavaScript knowledge', 'HTML/CSS fundamentals'],
    whatYouWillLearn: [
      'Build modern React applications',
      'Understand component lifecycle',
      'Master React hooks',
      'Implement state management',
      'Create responsive UIs',
      'Deploy React applications'
    ]
  };
  
  return NextResponse.json({
    success: true,
    course: courseDetails
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = parseInt(params.id);
  const body = await request.json();
  const { action, userId } = body;
  
  if (action === 'enroll') {
    // Mock enrollment - in a real app, this would update the database
    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment: {
        courseId,
        userId,
        enrolledAt: new Date().toISOString(),
        progress: 0
      }
    });
  }
  
  return NextResponse.json({
    success: false,
    error: 'Invalid action'
  }, { status: 400 });
}`,
                        language: 'typescript'
                      }
                    ]
                  }
                ]
              },
              {
                name: 'users',
                type: 'folder',
                children: [
                  {
                    name: '[id]',
                    type: 'folder',
                    children: [
                      {
                        name: 'progress',
                        type: 'folder',
                        children: [
                          {
                            name: 'route.ts',
                            type: 'file',
                            content: `import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id);
  
  // Mock user progress data
  const userProgress = {
    userId,
    totalCourses: 3,
    completedCourses: 1,
    inProgressCourses: 2,
    totalLessons: 48,
    completedLessons: 22,
    totalQuizzes: 12,
    passedQuizzes: 8,
    overallProgress: 45,
    courses: [
      {
        courseId: 1,
        courseName: 'React Fundamentals',
        progress: 75,
        lessonsCompleted: 18,
        totalLessons: 24,
        lastAccessed: '2024-01-15T10:30:00Z',
        timeSpent: 1200 // minutes
      },
      {
        courseId: 2,
        courseName: 'Node.js Backend',
        progress: 30,
        lessonsCompleted: 9,
        totalLessons: 32,
        lastAccessed: '2024-01-14T14:20:00Z',
        timeSpent: 480
      },
      {
        courseId: 3,
        courseName: 'Python Data Science',
        progress: 100,
        lessonsCompleted: 36,
        totalLessons: 36,
        lastAccessed: '2024-01-10T16:45:00Z',
        timeSpent: 2160,
        completedAt: '2024-01-10T16:45:00Z'
      }
    ],
    recentActivity: [
      {
        type: 'lesson_completed',
        courseId: 1,
        courseName: 'React Fundamentals',
        lessonName: 'Advanced Hooks',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        type: 'quiz_passed',
        courseId: 1,
        courseName: 'React Fundamentals',
        quizName: 'React Hooks Quiz',
        score: 85,
        timestamp: '2024-01-15T09:45:00Z'
      },
      {
        type: 'course_completed',
        courseId: 3,
        courseName: 'Python Data Science',
        timestamp: '2024-01-10T16:45:00Z'
      }
    ]
  };
  
  return NextResponse.json({
    success: true,
    progress: userProgress
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id);
  const body = await request.json();
  const { courseId, lessonId, action, data } = body;
  
  // Mock progress update
  if (action === 'update_progress') {
    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      updatedProgress: {
        userId,
        courseId,
        lessonId,
        progress: data.progress,
        updatedAt: new Date().toISOString()
      }
    });
  }
  
  return NextResponse.json({
    success: false,
    error: 'Invalid action'
  }, { status: 400 });
}`,
                            language: 'typescript'
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: 'package.json',
        type: 'file',
        content: `{
  "name": "edulearn-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-config-next": "14.0.4",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "@tailwindcss/typography": "^0.5.10",
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/aspect-ratio": "^0.4.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}`,
        language: 'json'
      },
      {
        name: 'tailwind.config.js',
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
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-up': 'scaleUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}`,
        language: 'javascript'
      },
      {
        name: 'next.config.js',
        type: 'file',
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['via.placeholder.com', 'images.unsplash.com', 'picsum.photos'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20,
        },
        common: {
          name: 'commons',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
      };
    }
    return config;
  },
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig`,
        language: 'javascript'
      },
      {
        name: 'postcss.config.js',
        type: 'file',
        content: `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

module.exports = config`,
        language: 'javascript'
      },
      {
        name: '.env.example',
        type: 'file',
        content: `# Application
NEXT_PUBLIC_APP_NAME=EduLearn
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/edulearn

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
JWT_SECRET=your-jwt-secret-here

# Payment (Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
MIXPANEL_PROJECT_TOKEN=your-token-here

# Feature Flags
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_CERTIFICATES=true
NEXT_PUBLIC_ENABLE_FORUMS=false`,
        language: 'bash'
      },
      {
        name: '.eslintrc.json',
        type: 'file',
        content: `{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "ignorePatterns": [
    "node_modules/",
    ".next/",
    "out/",
    "build/"
  ]
}`,
        language: 'json'
      },
      {
        name: '.gitignore',
        type: 'file',
        content: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output

# Database
*.db
*.sqlite

# Cache
.cache/
.parcel-cache/

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`,
        language: 'text'
      },
      {
        name: 'README.md',
        type: 'file',
        content: `# EduLearn - E-learning Platform

A comprehensive e-learning platform built with Next.js 14, featuring course management, video lessons, quizzes, and progress tracking. Perfect for launching your own online education business.

## 🚀 Features

### Core Learning Features
- **Course Catalog** - Browse and search through comprehensive course offerings
- **Video Lessons** - High-quality video content with playback controls
- **Interactive Quizzes** - Test knowledge with multiple question types
- **Progress Tracking** - Real-time learning progress and analytics
- **Certificates** - Earn certificates upon course completion

### User Experience
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **User Dashboard** - Personalized learning dashboard with progress overview
- **Course Enrollment** - Easy one-click enrollment system
- **Search & Filter** - Find courses by category, difficulty, or keywords
- **User Profiles** - Manage learning history and achievements

### Technical Features
- **Modern Stack** - Built with Next.js 14, React 18, TypeScript
- **API Routes** - RESTful API for course and user management
- **Database Ready** - Structured for easy database integration
- **Performance Optimized** - Fast loading with image optimization
- **SEO Friendly** - Optimized meta tags and structured data

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React (extensible)
- **Deployment**: Vercel ready (also supports other platforms)

## 📚 Course Categories

- Frontend Development (React, Vue, Angular)
- Backend Development (Node.js, Python, Java)
- Full-Stack Development
- Data Science & Machine Learning
- Mobile Development
- DevOps & Cloud Computing

## 🎯 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Basic understanding of React/Next.js

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd edulearn-platform
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Edit \`.env.local\` with your configuration:
   \`\`\`env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_key (for payments)
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗂️ Project Structure

\`\`\`
app/
├── components/           # Reusable UI components
│   ├── Navbar.tsx       # Navigation component
│   ├── CourseCard.tsx   # Course display card
│   └── Dashboard.tsx    # User dashboard
├── api/                 # API routes
│   ├── courses/         # Course management APIs
│   └── users/           # User management APIs
├── types/               # TypeScript type definitions
├── page.tsx            # Home page
├── layout.tsx          # Root layout
└── globals.css         # Global styles
\`\`\`

## 🔧 Customization

### Adding New Course Categories
1. Update the \`categories\` array in \`page.tsx\`
2. Add corresponding filters in the course API
3. Update the UI components as needed

### Styling Customization
- Modify \`tailwind.config.js\` for theme customization
- Update \`globals.css\` for global style overrides
- Customize component styles in individual files

### Database Integration
The app is structured with TypeScript interfaces ready for database integration:
- \`User\`, \`Course\`, \`Lesson\`, \`Quiz\`, \`Progress\` types
- API routes structured for easy database connection
- Mock data can be replaced with actual database calls

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic builds on every commit

### Other Platforms
- **Netlify**: Configure build command and publish directory
- **AWS/GCP**: Use Next.js standalone output
- **Docker**: Dockerfile included for containerization

## 📊 Analytics & Monitoring

Ready for integration with:
- Google Analytics
- Mixpanel
- PostHog
- Custom analytics solutions

## 🔐 Security Features

- CSRF protection
- XSS prevention
- Secure headers configuration
- Input validation and sanitization
- JWT token management (when implemented)

## 🎨 UI/UX Features

- **Dark Mode Support** - Toggle between light and dark themes
- **Accessibility** - WCAG compliant with keyboard navigation
- **Loading States** - Smooth loading animations and skeletons
- **Error Handling** - User-friendly error messages
- **Mobile Responsive** - Optimized for all screen sizes

## 📈 Performance Optimizations

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Bundle size optimization
- Caching strategies
- CDN ready for static assets

## 🧪 Testing

Structure ready for:
- Unit tests with Jest
- Integration tests
- E2E tests with Playwright
- Component testing with Testing Library

## 📝 License

MIT License - feel free to use this project for commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- Create an issue for bug reports
- Join our community for discussions
- Check the documentation for common questions

## 🔄 Roadmap

- [ ] Payment integration (Stripe/PayPal)
- [ ] Live streaming lessons
- [ ] Discussion forums
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Offline lesson downloads
- [ ] AI-powered recommendations

---

**Built with ❤️ for the education community**

Transform your knowledge into a thriving online education business with EduLearn platform.`,
        language: 'markdown'
      }
    ]
  }
};

export function getTemplateByKey(key: string): TemplateConfig | null {
  return TEMPLATE_CONFIGS[key] || null;
}

export function getAllTemplates(): TemplateConfig[] {
  return Object.values(TEMPLATE_CONFIGS);
}

export default TEMPLATE_CONFIGS;