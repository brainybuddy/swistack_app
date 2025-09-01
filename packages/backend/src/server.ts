import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from 'passport';
import { Server } from 'socket.io';

import { API_ENDPOINTS, HTTP_STATUS } from '@swistack/shared';
import { authConfig } from './config/auth';
import { authRouter } from './routes/auth';
import { OAuthService } from './services/OAuthService';
import { projectsRouter } from './routes/projects';
import { filesRouter } from './routes/files';
import { gitRouter } from './routes/git';
import { migrationsRouter } from './routes/migrations';
import languageRouter from './routes/language';
import formatterRouter from './routes/formatter';
import searchRouter from './routes/search';
import autosaveRouter from './routes/autosave';
import { invitationsRouter } from './routes/invitations';
import agentRouter from './routes/agent';
import { storageService } from './services/StorageService';
import { TemplateService } from './services/TemplateService';
import { HealthCheckService } from './services/HealthCheckService';
import { GitService } from './services/GitService';
import { MigrationService } from './services/MigrationService';
import { CollaborationService } from './services/CollaborationService';
import { ProjectUpdateService } from './services/ProjectUpdateService';
import { ErrorResponseUtil } from './utils/ErrorResponse';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize collaboration service
const collaborationService = new CollaborationService(io);
collaborationService.initialize();

// Initialize project update service
ProjectUpdateService.initialize(io);

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors(authConfig.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize OAuth strategies
OAuthService.initialize();
app.use(passport.initialize());

// Health check endpoint
app.get(API_ENDPOINTS.HEALTH, async (req, res) => {
  try {
    const health = await HealthCheckService.checkAllServices();
    
    const statusCode = health.status === 'healthy' ? HTTP_STATUS.OK : 
                      health.status === 'degraded' ? 503 : 503;
    
    res.status(statusCode).json({
      status: health.status,
      timestamp: health.timestamp.toISOString(),
      uptime: health.uptime,
      version: process.env.npm_package_version || '1.0.0',
      services: health.services,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    message: 'Swistack Backend API',
    version: '1.0.0',
    endpoints: {
      health: API_ENDPOINTS.HEALTH,
      auth: '/api/auth',
      projects: '/api/projects',
      files: '/api/files',
      git: '/api/git',
      migrations: '/api/migrations',
      language: '/api/language',
      formatter: '/api/formatter',
      search: '/api/search',
      autosave: '/api/autosave',
      agent: '/api/agent',
    },
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/files', filesRouter);
app.use('/api/git', gitRouter);
app.use('/api/migrations', migrationsRouter);
app.use('/api/language', languageRouter);
app.use('/api/formatter', formatterRouter);
app.use('/api/search', searchRouter);
app.use('/api/autosave', autosaveRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/agent', agentRouter);

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  ErrorResponseUtil.internalServerError(res, undefined, {
    error,
    path: req.originalUrl,
  });
});

// 404 handler
app.use('*', (req, res) => {
  ErrorResponseUtil.notFound(res, 'Route not found', {
    path: req.originalUrl,
  });
});

// Initialize services
async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');
    
    // Run database migrations first (before any service that needs DB access)
    console.log('🗄️ Checking database migrations...');
    const migrationStatus = await MigrationService.checkMigrationStatus();
    
    if (!migrationStatus.migrationTableExists || migrationStatus.needsMigration) {
      console.log('📊 Database needs initialization or updates');
      const initResult = await MigrationService.initializeDatabase();
      
      if (!initResult.success) {
        throw new Error(`Database initialization failed: ${initResult.errors.join(', ')}`);
      }
      
      if (initResult.migrationsRun.length > 0) {
        console.log(`✅ Applied ${initResult.migrationsRun.length} migrations`);
      }
      if (initResult.seedsRun.length > 0) {
        console.log(`✅ Applied ${initResult.seedsRun.length} seeds`);
      }
    } else {
      console.log('✅ Database migrations are up to date');
    }
    
    // Wait for critical services to be healthy
    const servicesReady = await HealthCheckService.waitForServices(60000);
    if (!servicesReady) {
      throw new Error('Critical services failed to start within timeout');
    }
    
    // Initialize storage service
    await storageService.initialize();
    console.log('✅ Storage service initialized');
    
    // Initialize default templates - DISABLED to use database seed templates only
    // await TemplateService.initializeDefaultTemplates();
    console.log('✅ Project templates using database seeds only');
    
    // Start workspace cleanup scheduler
    GitService.startWorkspaceCleanupScheduler(6, 24); // Clean every 6 hours, max age 24 hours
    console.log('✅ Workspace cleanup scheduler started');
    
    console.log('🎉 All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error; // Re-throw to prevent server from starting with broken services
  }
}

server.listen(PORT, async () => {
  console.log(`🚀 Server starting on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}${API_ENDPOINTS.HEALTH}`);
  console.log(`🔐 Auth API available at http://localhost:${PORT}/api/auth`);
  console.log(`📁 Projects API available at http://localhost:${PORT}/api/projects`);
  console.log(`📄 Files API available at http://localhost:${PORT}/api/files`);
  console.log(`🔧 Git API available at http://localhost:${PORT}/api/git`);
  console.log(`🗄️ Migrations API available at http://localhost:${PORT}/api/migrations`);
  console.log(`🔤 Language API available at http://localhost:${PORT}/api/language`);
  console.log(`🎨 Formatter API available at http://localhost:${PORT}/api/formatter`);
  console.log(`🔍 Search API available at http://localhost:${PORT}/api/search`);
  console.log(`💾 Auto-save API available at http://localhost:${PORT}/api/autosave`);
  console.log(`🌍 CORS enabled for: ${authConfig.cors.origin.join(', ')}`);
  
  try {
    // Initialize services and wait for them to be ready
    await initializeServices();
    console.log('🟢 Server fully operational and ready to accept requests');
  } catch (error) {
    console.error('🔴 Server failed to initialize properly:', error);
    console.error('❌ Shutting down server due to initialization failure');
    process.exit(1);
  }
});

export default app;