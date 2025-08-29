#!/bin/bash

# SwiStack Development Environment Restart Script
# This script kills existing processes and restarts all development servers

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print colored messages with timestamp
log() {
    local color=$1
    local label=$2
    local message=$3
    local timestamp=$(date '+%H:%M:%S')
    echo -e "${color}[${timestamp}] ${label}:${NC} ${message}"
}

# Function to show the banner
show_banner() {
    echo -e "${CYAN}${WHITE}"
    echo "╔══════════════════════════════════════╗"
    echo "║       🚀 SwiStack Dev Restart       ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to kill existing processes
kill_processes() {
    log "$YELLOW" "CLEANUP" "Killing existing development processes..."
    
    # Kill Node.js processes related to our development servers
    pkill -f "next dev" 2>/dev/null && log "$GREEN" "CLEANUP" "Stopped Next.js dev server" || log "$BLUE" "CLEANUP" "No Next.js dev server running"
    pkill -f "tsx watch" 2>/dev/null && log "$GREEN" "CLEANUP" "Stopped backend tsx watch" || log "$BLUE" "CLEANUP" "No tsx watch process running"
    pkill -f "tsc --watch" 2>/dev/null && log "$GREEN" "CLEANUP" "Stopped TypeScript watch" || log "$BLUE" "CLEANUP" "No TypeScript watch process running"
    
    # Kill processes using our development ports
    if lsof -ti:3000 >/dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        log "$GREEN" "CLEANUP" "Freed port 3000"
    else
        log "$BLUE" "CLEANUP" "Port 3000 already free"
    fi
    
    if lsof -ti:3001 >/dev/null 2>&1; then
        lsof -ti:3001 | xargs kill -9 2>/dev/null
        log "$GREEN" "CLEANUP" "Freed port 3001"
    else
        log "$BLUE" "CLEANUP" "Port 3001 already free"
    fi
    
    # Kill any remaining node processes that might be hanging
    pkill -f "concurrently" 2>/dev/null || true
    
    log "$GREEN" "CLEANUP" "Process cleanup completed"
    
    # Give processes time to fully terminate
    sleep 2
}

# Function to install dependencies
install_dependencies() {
    log "$BLUE" "DEPS" "Installing/updating dependencies..."
    
    if npm install --silent; then
        log "$GREEN" "DEPS" "Dependencies installed successfully"
    else
        log "$RED" "DEPS" "Failed to install dependencies"
        exit 1
    fi
}

# Function to build shared package
build_shared() {
    log "$YELLOW" "SHARED" "Building shared package..."
    
    if npm run build:shared --silent; then
        log "$GREEN" "SHARED" "Shared package built successfully"
    else
        log "$RED" "SHARED" "Failed to build shared package"
        exit 1
    fi
}

# Function to start development servers
start_dev_servers() {
    log "$CYAN" "DEV" "Starting development servers..."
    
    # Show service information
    echo -e "${YELLOW}"
    echo "📡 Services will be available at:"
    echo "   • Frontend: http://localhost:3000"
    echo "   • Backend:  http://localhost:3001"
    echo ""
    echo "🔥 Hot reload is enabled for all packages"
    echo "📝 Logs are color-coded: shared, backend, frontend"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo -e "${NC}"
    
    # Set up signal handlers for graceful shutdown
    trap 'log "$YELLOW" "SHUTDOWN" "Shutting down development servers..."; pkill -P $$; exit 0' INT TERM
    
    # Start the development servers using concurrently
    npm run dev
}

# Function to check if required tools are installed
check_prerequisites() {
    local missing_tools=()
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    # Check for lsof (for port checking)
    if ! command -v lsof &> /dev/null; then
        log "$YELLOW" "WARNING" "lsof not found - port cleanup may not work perfectly"
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log "$RED" "ERROR" "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi
}

# Main function
main() {
    show_banner
    log "$CYAN" "START" "Starting SwiStack development environment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Change to script directory
    cd "$(dirname "$0")" || exit 1
    
    # Step 1: Kill existing processes
    kill_processes
    
    # Step 2: Install dependencies
    install_dependencies
    
    # Step 3: Build shared package
    build_shared
    
    # Step 4: Start development servers
    log "$GREEN" "READY" "All setup complete! Starting development servers..."
    start_dev_servers
}

# Handle script errors
set -e
trap 'log "$RED" "ERROR" "Script failed at line $LINENO"' ERR

# Run main function
main "$@"