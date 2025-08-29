#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const os = require('os');

// ANSI color codes for colored output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function colorLog(color, label, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${label}:${colors.reset} ${message}`);
}

// Kill processes by port and name
async function killProcesses() {
  colorLog('yellow', 'CLEANUP', 'Killing existing processes...');
  
  const killCommands = [];
  
  if (os.platform() === 'win32') {
    // Windows commands
    killCommands.push(
      'taskkill /F /IM node.exe 2>nul || echo "No node processes to kill"',
      'taskkill /F /IM tsx.exe 2>nul || echo "No tsx processes to kill"',
      'netstat -ano | findstr :3000 | for /f "tokens=5" %a in (\'more\') do taskkill /F /PID %a 2>nul',
      'netstat -ano | findstr :3001 | for /f "tokens=5" %a in (\'more\') do taskkill /F /PID %a 2>nul'
    );
  } else {
    // Unix/Linux/macOS commands
    killCommands.push(
      'pkill -f "next dev" 2>/dev/null || echo "No Next.js processes to kill"',
      'pkill -f "tsx watch" 2>/dev/null || echo "No tsx processes to kill"',
      'pkill -f "tsc --watch" 2>/dev/null || echo "No TypeScript watch processes to kill"',
      'lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 already free"',
      'lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Port 3001 already free"'
    );
  }

  for (const command of killCommands) {
    try {
      await execAsync(command, { timeout: 5000 });
    } catch (error) {
      // Ignore errors - processes might not exist
    }
  }

  colorLog('green', 'CLEANUP', 'Process cleanup completed');
  
  // Give processes time to fully terminate
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Install dependencies if needed
async function installDependencies() {
  colorLog('blue', 'DEPS', 'Checking and installing dependencies...');
  
  try {
    await execAsync('npm install', { 
      cwd: path.resolve(__dirname),
      timeout: 120000 // 2 minutes timeout
    });
    colorLog('green', 'DEPS', 'Dependencies installed successfully');
  } catch (error) {
    colorLog('red', 'DEPS', `Error installing dependencies: ${error.message}`);
    throw error;
  }
}

// Build shared package first (required by other packages)
async function buildShared() {
  colorLog('yellow', 'SHARED', 'Building shared package...');
  
  try {
    await execAsync('npm run build:shared', { 
      cwd: path.resolve(__dirname),
      timeout: 60000 // 1 minute timeout
    });
    colorLog('green', 'SHARED', 'Shared package built successfully');
  } catch (error) {
    colorLog('red', 'SHARED', `Error building shared package: ${error.message}`);
    throw error;
  }
}

// Start development servers
function startDevServers() {
  colorLog('cyan', 'DEV', 'Starting development servers...');
  
  // Use the existing concurrently setup from package.json
  const devProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname),
    stdio: 'inherit', // Pass through all output
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    colorLog('yellow', 'SHUTDOWN', 'Shutting down development servers...');
    devProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    colorLog('yellow', 'SHUTDOWN', 'Shutting down development servers...');
    devProcess.kill('SIGTERM');
    process.exit(0);
  });

  devProcess.on('close', (code) => {
    if (code !== 0) {
      colorLog('red', 'DEV', `Development servers exited with code ${code}`);
      process.exit(code);
    }
  });

  devProcess.on('error', (error) => {
    colorLog('red', 'DEV', `Error starting development servers: ${error.message}`);
    process.exit(1);
  });
}

// Main execution
async function main() {
  try {
    console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════╗
║       🚀 SwiStack Dev Restart       ║
╚══════════════════════════════════════╝
${colors.reset}`);

    colorLog('cyan', 'START', 'Starting SwiStack development environment...');
    
    // Step 1: Kill existing processes
    await killProcesses();
    
    // Step 2: Install dependencies
    await installDependencies();
    
    // Step 3: Build shared package
    await buildShared();
    
    // Step 4: Start development servers
    colorLog('green', 'READY', 'All setup complete! Starting development servers...');
    console.log(`${colors.yellow}
📡 Services will be available at:
   • Frontend: http://localhost:3000
   • Backend:  http://localhost:3001
   
🔥 Hot reload is enabled for all packages
📝 Logs are color-coded: ${colors.yellow}shared${colors.reset}, ${colors.green}backend${colors.reset}, ${colors.blue}frontend${colors.reset}

Press Ctrl+C to stop all services
${colors.reset}`);
    
    startDevServers();
    
  } catch (error) {
    colorLog('red', 'ERROR', `Failed to start development environment: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  colorLog('red', 'FATAL', `Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  colorLog('red', 'FATAL', `Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the main function
main();