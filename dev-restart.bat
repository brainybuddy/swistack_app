@echo off
setlocal enabledelayedexpansion

:: SwiStack Development Environment Restart Script (Windows)
:: This script kills existing processes and restarts all development servers

echo.
echo ╔══════════════════════════════════════╗
echo ║       🚀 SwiStack Dev Restart       ║
echo ╚══════════════════════════════════════╝
echo.

:: Function to log with timestamp
:log
set "timestamp=%time:~0,8%"
echo [%timestamp%] %~1: %~2
exit /b

call :log "START" "Starting SwiStack development environment..."

:: Step 1: Kill existing processes
call :log "CLEANUP" "Killing existing development processes..."

:: Kill Node.js processes
echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul && (
    call :log "CLEANUP" "Stopped Node.js processes"
) || (
    call :log "CLEANUP" "No Node.js processes running"
)

:: Kill tsx processes
taskkill /F /IM tsx.exe 2>nul && (
    call :log "CLEANUP" "Stopped tsx processes"
) || (
    call :log "CLEANUP" "No tsx processes running"
)

:: Kill processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul && call :log "CLEANUP" "Freed port 3000"
)

:: Kill processes on port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul && call :log "CLEANUP" "Freed port 3001"
)

call :log "CLEANUP" "Process cleanup completed"

:: Give processes time to terminate
timeout /t 3 /nobreak >nul

:: Step 2: Install dependencies
call :log "DEPS" "Installing/updating dependencies..."
npm install --silent
if !errorlevel! neq 0 (
    call :log "ERROR" "Failed to install dependencies"
    exit /b 1
)
call :log "DEPS" "Dependencies installed successfully"

:: Step 3: Build shared package
call :log "SHARED" "Building shared package..."
npm run build:shared --silent
if !errorlevel! neq 0 (
    call :log "ERROR" "Failed to build shared package"
    exit /b 1
)
call :log "SHARED" "Shared package built successfully"

:: Step 4: Start development servers
call :log "READY" "All setup complete! Starting development servers..."
echo.
echo 📡 Services will be available at:
echo    • Frontend: http://localhost:3000
echo    • Backend:  http://localhost:3001
echo.
echo 🔥 Hot reload is enabled for all packages
echo 📝 Logs are color-coded: shared, backend, frontend
echo.
echo Press Ctrl+C to stop all services
echo.

call :log "DEV" "Starting development servers..."
npm run dev

:: Handle Ctrl+C gracefully
:cleanup
call :log "SHUTDOWN" "Shutting down development servers..."
taskkill /F /IM node.exe 2>nul
exit /b 0