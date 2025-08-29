module.exports = {
  apps: [
    {
      name: 'swistack-backend',
      script: './backend/server.js',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      log_file: '/app/logs/backend.log',
      error_file: '/app/logs/backend-error.log',
      out_file: '/app/logs/backend-out.log',
      time: true
    },
    {
      name: 'swistack-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/app/packages/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:3001'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      log_file: '/app/logs/frontend.log',
      error_file: '/app/logs/frontend-error.log',
      out_file: '/app/logs/frontend-out.log',
      time: true
    }
  ]
};