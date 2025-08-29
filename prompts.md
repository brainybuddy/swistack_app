Execution Order:

Run Prompts 1-9 in sequence, each building on the previous ones
Test integration after every 2-3 prompts to ensure everything works together
Deploy incrementally - you can deploy after Prompt 3 for a basic coding platform

Prompt 1: Authentication System (Full-Stack)
bashclaude code "In the existing Swistack monorepo, create complete authentication system:

Backend (packages/backend):
- Add JWT authentication API with PostgreSQL and Express.js
- Implement bcrypt password hashing and secure session management
- Create user registration, login, logout, and refresh token endpoints
- Add rate limiting and security middleware
- Implement user profile management with CRUD operations
- Add password reset and email verification functionality

Frontend (packages/frontend):
- Create login and registration pages using Next.js and React
- Build user dashboard and profile management interface
- Add form validation with proper error handling
- Implement authentication state management with Context API
- Create protected route components and authentication guards

Shared (packages/shared):
- Add user types, authentication interfaces, and validation schemas
- Create API client utilities for authentication endpoints
- Add authentication helper functions and constants

Integration:
- Complete auth flow from frontend to backend with proper error handling
- JWT token management with automatic refresh
- Secure cookie handling and session persistence
- Use existing monorepo structure and build system"


Prompt 2: Project Management System (Full-Stack)
bashclaude code "In the existing Swistack monorepo, add complete project management system:

Backend (packages/backend):
- Add project CRUD API with PostgreSQL database schema
- Integrate MinIO object storage for file management with proper security
- Create file upload/download endpoints with validation and virus scanning
- Add project templates system (React, Node.js, Python, Go, etc.)
- Implement project sharing and permissions (owner/editor/viewer)
- Add Git integration for version control operations
- Create project settings and environment variables management

Frontend (packages/frontend):
- Build project dashboard with grid and list views
- Create comprehensive file explorer with drag-drop functionality
- Add project settings interface with permissions management
- Implement file upload/download with progress indicators
- Build project creation wizard with template selection
- Add project sharing and collaboration invite system

Shared (packages/shared):
- Add project types, file operation interfaces, and permission schemas
- Create project management utilities and validation functions
- Add file system helper functions and constants

Integration:
- Seamless file operations between frontend and MinIO storage
- Real-time project updates and file synchronization
- Proper error handling for all project operations
- Integration with existing authentication system for permissions
- Use existing monorepo structure and authentication system"


Prompt 3: Browser-Based IDE (Full-Stack)
bashclaude code "In the existing Swistack monorepo, add complete browser-based IDE like Replit:

Backend (packages/backend):
- Add file management API with CRUD operations for project files
- Create syntax highlighting service for 100+ programming languages  
- Add code formatting, linting, and analysis endpoints
- Implement file search and navigation APIs with indexing
- Add auto-save functionality with conflict resolution
- Create code completion and IntelliSense API endpoints

Frontend (packages/frontend):
- Integrate Monaco Editor as core code editor (VSCode engine in browser)
- Create complete IDE interface with multi-tab file editing
- Add file explorer sidebar with drag-drop file management
- Implement syntax highlighting for all major programming languages
- Add code folding, find/replace, go-to-definition, and IntelliSense
- Create tabbed editor with split panes and multiple file editing
- Add integrated search across all project files
- Build command palette and comprehensive keyboard shortcuts

Shared (packages/shared):
- Add file operation types and editor configuration interfaces
- Create language detection and syntax highlighting utilities  
- Add code analysis result types and editor state management
- Define file tree and project structure types

Integration:
- Real-time file saving with auto-save every 2 seconds
- Seamless language detection and syntax highlighting
- File tree synchronization between UI and file system
- Error highlighting integration with backend code analysis  
- Complete web-based IDE experience running entirely in browser
- Use existing authentication and project management systems"


Prompt 4: Real-time Collaboration (Full-Stack)
bashclaude code "In the existing Swistack monorepo, add real-time collaboration system:

Backend (packages/backend):
- Create WebSocket server using Socket.io for multi-user editing
- Implement Operational Transformation algorithm for conflict resolution
- Add Redis pub/sub for horizontal scaling and session management
- Create user presence tracking and activity feed system
- Add file locking and concurrent editing protection
- Implement permission-based collaboration controls

Frontend (packages/frontend):
- Build real-time collaboration interface with live cursors
- Add user presence indicators showing who's online and where
- Create multi-user editing with real-time cursor synchronization
- Implement collaborative file editing with conflict resolution
- Add activity feed showing real-time project changes
- Build team collaboration UI with user avatars and status

Shared (packages/shared):
- Add collaboration types and real-time event interfaces
- Create operational transformation utilities and conflict resolution
- Add WebSocket message types and collaboration schemas

Integration:
- Real-time synchronization between multiple users editing same files
- Live cursor tracking and user presence across all project files
- Seamless collaborative editing with automatic conflict resolution
- Real-time updates for file changes, user actions, and project modifications
- Integration with existing authentication and project permission systems
- WebSocket connection management with automatic reconnection"


Prompt 5: AI Coding Assistant (Full-Stack)
bashclaude code "In the existing Swistack monorepo, add AI coding assistant system:

Backend (packages/backend):
- Create AI service that integrates OpenDevin with complete brand abstraction
- Build LLM proxy supporting multiple providers (Anthropic Claude, OpenAI GPT-4)
- Implement context management system for project-aware AI responses
- Add response sanitization to remove all OpenDevin references and rebrand as 'Swistack AI'
- Create AI request queue system with priority based on user subscription
- Add conversation history and context persistence
- Implement rate limiting based on user tiers

Frontend (packages/frontend):
- Build AI chat interface integrated into the IDE sidebar
- Create code suggestion panels and inline AI assistance
- Add AI-powered code completion and error resolution UI
- Implement context-aware help system with project understanding
- Build AI conversation history and chat management
- Add AI assistance for debugging, refactoring, and code explanation

Shared (packages/shared):
- Add AI interaction types and conversation interfaces
- Create AI context management utilities and response schemas
- Add AI request/response types and error handling

Integration:
- Context-aware AI requests that understand current project and file
- Seamless AI assistance integrated throughout the coding experience
- AI responses that appear as native Swistack features (no OpenDevin branding)
- Real-time AI suggestions based on current code and project context
- Integration with existing authentication system for usage tracking
- AI assistance that works with collaboration features"


Prompt 6: Container Workspace System (Full-Stack)
bashclaude code "In the existing Swistack monorepo, add dynamic container workspace system:

Backend (packages/backend):
- Build Docker container orchestration for isolated user workspaces
- Create container lifecycle management with resource limits and cleanup
- Add pre-built environment templates (Node.js, Python, Go, React, etc.)
- Implement WebSocket connection to container shells for terminal access
- Add container health monitoring and automatic recovery
- Create port management and URL routing for preview servers

Frontend (packages/frontend):
- Build integrated terminal using xterm.js with WebSocket connection
- Create workspace management interface with container status
- Add live preview system with iframe integration and hot reload
- Implement multiple terminal tabs and session management
- Build container resource monitoring dashboard
- Add environment template selection and workspace configuration

Shared (packages/shared):
- Add container management types and workspace configuration schemas
- Create terminal session utilities and WebSocket message types
- Add environment template definitions and resource limit types

Integration:
- Real-time terminal access to user containers through WebSocket
- Live preview of applications running in containers with automatic URL generation
- Container isolation ensuring secure multi-user workspace environment
- Automatic container provisioning when users open projects
- Integration with existing project management for workspace persistence
- Resource monitoring and automatic scaling based on usage"


Prompt 7: Live Preview & Deployment (Full-Stack)
bashclaude code "In the existing Swistack monorepo, add live preview and deployment system:

Backend (packages/backend):
- Create preview server management for running applications in containers
- Add deployment API supporting multiple cloud providers (Vercel, Netlify, Railway)
- Implement build pipeline with automated testing and deployment
- Add custom domain management and SSL certificate automation
- Create deployment history and rollback functionality
- Add environment variable management for different deployment stages

Frontend (packages/frontend):
- Build live preview interface with iframe integration and device simulation
- Create deployment dashboard with one-click deployment buttons
- Add build logs viewer with real-time streaming
- Implement deployment history with rollback capabilities
- Build custom domain configuration and SSL management UI
- Add environment management interface for different deployment stages

Shared (packages/shared):
- Add deployment configuration types and build pipeline schemas
- Create preview server utilities and deployment status types
- Add domain management and SSL certificate types

Integration:
- Hot reload preview that updates automatically when code changes
- Seamless deployment from development to production with proper build pipeline
- Real-time build logs and deployment status updates
- Custom domain management with automatic DNS and SSL configuration
- Integration with existing project management and container systems
- Multiple deployment targets with environment-specific configurations"


Prompt 8: Team Management & Billing (Full-Stack)
bashclaude code "In the existing Swistack monorepo, add team management and billing system:

Backend (packages/backend):
- Create team and organization management with hierarchical permissions
- Add subscription management with Stripe integration for billing
- Implement usage tracking for AI requests, compute time, and storage
- Add team invitation system with role-based access control
- Create billing analytics and usage reports with automated invoicing
- Add enterprise features like SSO and advanced security controls

Frontend (packages/frontend):
- Build team dashboard with member management and permission controls
- Create subscription management interface with plan comparison and upgrades
- Add usage analytics dashboard with detailed consumption metrics
- Implement team invitation flow with role assignment
- Build billing interface with invoice history and payment methods
- Add enterprise admin panel with advanced team management

Shared (packages/shared):
- Add team management types and billing schemas
- Create subscription and usage tracking utilities
- Add permission management and role-based access types

Integration:
- Team-based project sharing with granular permission controls
- Usage-based billing that tracks AI requests, container time, and storage
- Seamless team collaboration integrated with existing real-time features
- Automated billing and subscription management with Stripe webhooks
- Enterprise-grade security and compliance features
- Integration with existing authentication and project management systems"


Prompt 9: Production Deployment & Monitoring (Full-Stack)
bashclaude code "In the existing Swistack monorepo, add complete production deployment and monitoring:

Backend (packages/backend):
- Create production-ready API gateway with Traefik load balancing
- Add comprehensive monitoring with health checks and performance metrics
- Implement centralized logging with structured JSON logs and log aggregation
- Add error tracking integration with Sentry for real-time error monitoring
- Create backup automation for databases and file storage
- Add security scanning and vulnerability monitoring

Frontend (packages/frontend):
- Build production-optimized Next.js with PWA capabilities
- Add performance monitoring and real user monitoring (RUM)
- Implement offline support and service worker for PWA functionality
- Create responsive design optimized for all screen sizes
- Add production error boundaries and graceful error handling
- Build admin dashboard for system monitoring and management

Infrastructure:
- Create Docker Swarm configuration for production deployment
- Add CI/CD pipeline with GitHub Actions for automated testing and deployment
- Implement secrets management and environment variable security
- Add SSL certificate automation with Let's Encrypt
- Create database migration and backup automation scripts
- Add performance monitoring and alerting system

Integration:
- Complete production deployment pipeline from development to production
- Automated testing, security scanning, and deployment with rollback capabilities
- Comprehensive monitoring covering application performance, user experience, and system health
- Automated backup and disaster recovery procedures
- Production-ready security with SSL, secrets management, and vulnerability scanning
- Scalable infrastructure ready for thousands of concurrent users"

