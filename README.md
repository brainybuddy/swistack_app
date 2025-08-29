# Swistack - Browser-based Coding Platform

A complete monorepo foundation for a browser-based coding platform built with TypeScript, Express.js, Next.js, and shared utilities.

## 🏗️ Architecture

```
swistack/
├── packages/
│   ├── backend/          # Express.js API server
│   ├── frontend/         # Next.js web application  
│   └── shared/           # Shared types and utilities
├── docker-compose.yml    # Development environment
└── package.json          # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (optional, for containerized development)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd swistack

# Install dependencies for all packages
npm install

# Copy environment variables
cp .env.example .env.local
```

### Development

Start all services in development mode:

```bash
# Start all packages concurrently
npm run dev
```

Or start individual packages:

```bash
# Backend only (http://localhost:3001)
npm run dev:backend

# Frontend only (http://localhost:3000)  
npm run dev:frontend

# Shared package (watch mode)
npm run build:shared -- --watch
```

### Docker Development

```bash
# Start all services with Docker
npm run docker:dev

# Stop Docker services
npm run docker:down
```

## 🧪 Testing

```bash
# Run tests for all packages
npm test

# Run tests in watch mode
npm run test:watch

# Test individual packages
npm run test -w @swistack/shared
npm run test -w @swistack/backend  
npm run test -w @swistack/frontend
```

## 🔧 Development Workflow

### Code Quality

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type checking
npm run type-check
```

### Building

```bash
# Build all packages
npm run build

# Build individual packages
npm run build:shared
npm run build:backend
npm run build:frontend

# Clean build artifacts
npm run clean
```

## 📦 Package Structure

### @swistack/shared

Contains shared TypeScript types, utilities, and constants used across the monorepo.

**Key exports:**
- `types/` - Common TypeScript interfaces
- `utils/` - Utility functions (validation, string, date, object helpers)
- `constants/` - Application constants

### @swistack/backend

Express.js API server with TypeScript support.

**Features:**
- Express.js with TypeScript
- CORS and security middleware
- Environment configuration
- Health check endpoint

### @swistack/frontend

Next.js web application with TypeScript support.

**Features:**
- Next.js 14 with App Router
- TypeScript configuration
- Shared package integration
- Responsive design

## 🌍 Environment Variables

Environment variables are managed through `.env` files:

- `.env.example` - Template with all available variables
- `.env.local` - Local development variables (gitignored)
- `packages/backend/.env.example` - Backend-specific variables
- `packages/frontend/.env.example` - Frontend-specific variables

### Key Variables

```bash
# Backend
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379

# Frontend  
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🐳 Docker Configuration

The project includes Docker configuration for development:

- `docker-compose.yml` - Multi-service development setup
- `Dockerfile` - Base configuration
- `packages/*/Dockerfile` - Service-specific configurations

**Services:**
- `backend` - Express.js API (port 3001)
- `frontend` - Next.js app (port 3000)
- `postgres` - PostgreSQL database (port 5432)
- `redis` - Redis cache (port 6379)

## 📋 Available Scripts

### Root Level

- `npm run dev` - Start all packages in development
- `npm run build` - Build all packages
- `npm test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run format` - Format all code
- `npm run type-check` - Type check all packages
- `npm run clean` - Clean build artifacts
- `npm run docker:dev` - Start Docker development environment

### Package Level

Each package supports:
- `npm run dev` - Development mode
- `npm run build` - Production build  
- `npm run test` - Run tests
- `npm run type-check` - Type checking

## 🔧 Configuration Files

- `tsconfig.json` - Root TypeScript configuration
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier code formatting
- `vitest.config.ts` - Test configuration
- `docker-compose.yml` - Docker services

## 🧰 Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Backend:** Express.js
- **Frontend:** Next.js 14
- **Testing:** Vitest
- **Linting:** ESLint
- **Formatting:** Prettier
- **Validation:** Zod
- **Containerization:** Docker

## 📚 Next Steps

This foundation provides:

✅ Complete monorepo setup with workspaces  
✅ TypeScript configuration with shared types  
✅ Development and build workflows  
✅ Testing framework with Vitest  
✅ Code quality tools (ESLint, Prettier)  
✅ Docker development environment  
✅ Environment variable management  

**Ready to build:**
- Authentication system
- Database integration
- API endpoints
- UI components
- State management
- Real-time features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details