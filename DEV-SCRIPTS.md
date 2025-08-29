# 🚀 SwiStack Development Scripts

This document describes the development scripts available for running the SwiStack monorepo.

## 🔄 Restart Scripts

These scripts provide a clean way to restart the entire development environment by killing existing processes and starting fresh servers.

### 📋 Available Scripts

| Script | Platform | Command | Description |
|--------|----------|---------|-------------|
| `dev-restart.js` | Cross-platform | `npm run dev:restart` or `node dev-restart.js` | Node.js script that works on all platforms |
| `dev-restart.sh` | Unix/Linux/macOS | `./dev-restart.sh` | Bash script optimized for Unix systems |
| `dev-restart.bat` | Windows | `dev-restart.bat` | Batch script for Windows systems |

### 🚀 Quick Start

**Option 1: Using npm (Recommended)**
```bash
npm run dev:restart
```

**Option 2: Direct script execution**
```bash
# Unix/Linux/macOS
./dev-restart.sh

# Windows
dev-restart.bat

# Cross-platform (Node.js)
node dev-restart.js
```

## 🔧 What These Scripts Do

### 1. **Process Cleanup** 🧹
- Kills existing Node.js development processes
- Frees up ports 3000 (frontend) and 3001 (backend)  
- Stops any running TypeScript watch processes
- Terminates concurrently processes

### 2. **Dependency Management** 📦
- Runs `npm install` to ensure all dependencies are up to date
- Handles workspace dependencies automatically

### 3. **Build Shared Package** 🔨
- Builds the `@swistack/shared` package first
- Required by both frontend and backend packages

### 4. **Start Development Servers** 🌐
- Starts all three packages concurrently:
  - **Shared**: TypeScript watch mode (`tsc --watch`)
  - **Backend**: Express server with hot reload (`tsx watch`)
  - **Frontend**: Next.js development server (`next dev`)

## 📡 Service URLs

After running the restart script, the following services will be available:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 🎨 Features

### Color-Coded Logs
Each package has its own color for easy identification:
- 🟡 **Shared**: Yellow
- 🟢 **Backend**: Green  
- 🔵 **Frontend**: Blue

### Hot Reload
All packages support hot reload:
- **Shared**: Automatic TypeScript compilation on file changes
- **Backend**: Server restart on code changes via `tsx watch`
- **Frontend**: Fast refresh for React components

### Graceful Shutdown
Press `Ctrl+C` to stop all development servers gracefully.

## 🛠️ Troubleshooting

### Port Already in Use
The scripts automatically detect and kill processes using ports 3000 and 3001. If you still get port errors:

```bash
# Manual port cleanup (Unix/macOS)
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Manual port cleanup (Windows)
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### TypeScript Build Errors
If you encounter TypeScript errors:

1. Clean build artifacts:
   ```bash
   npm run clean
   ```

2. Rebuild shared package:
   ```bash
   npm run build:shared
   ```

3. Restart development servers:
   ```bash
   npm run dev:restart
   ```

### Permission Errors (Unix/macOS)
Make sure the shell script is executable:
```bash
chmod +x dev-restart.sh
```

## 🔍 Script Comparison

| Feature | Node.js Script | Shell Script | Batch Script |
|---------|----------------|--------------|--------------|
| Cross-platform | ✅ | ❌ (Unix only) | ❌ (Windows only) |
| Colored output | ✅ | ✅ | ❌ |
| Process detection | ✅ | ✅ | ✅ |
| Port cleanup | ✅ | ✅ | ✅ |
| Error handling | ✅ | ✅ | ✅ |
| Prerequisites check | ✅ | ✅ | ❌ |

## 🚨 Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### Optional (for better port cleanup)
- **lsof** (Unix/macOS) - usually pre-installed
- **netstat** (Windows) - usually pre-installed

## 📝 Regular Development Commands

For normal development (without restart), you can still use:

```bash
# Start all services
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## 🐛 Debugging

If the restart scripts aren't working:

1. **Check Node.js version**:
   ```bash
   node --version  # Should be >= 18.0.0
   ```

2. **Check npm version**:
   ```bash
   npm --version   # Should be >= 9.0.0
   ```

3. **Manually verify ports are free**:
   ```bash
   # Unix/macOS
   lsof -i :3000
   lsof -i :3001
   
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   ```

4. **Check package.json scripts**:
   ```bash
   npm run  # Lists all available scripts
   ```

## 💡 Tips

- Use `npm run dev:restart` for the most reliable cross-platform experience
- The scripts include automatic dependency installation, so they're safe to run after pulling new code
- All scripts handle graceful shutdown with `Ctrl+C`
- Build errors in one package won't prevent others from starting
- The shared package is always built first since other packages depend on it

---

**Happy coding! 🎉**