import express, { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '@swistack/shared';
import { MigrationService } from '../services/MigrationService';
import { authMiddleware } from '../middleware/auth';
import { ErrorResponseUtil } from '../utils/ErrorResponse';

const router: Router = express.Router();

// Get migration status
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const status = await MigrationService.checkMigrationStatus();
    const info = await MigrationService.getMigrationInfo();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        status,
        info,
      },
    });
  } catch (error) {
    console.error('Error checking migration status:', error);
    ErrorResponseUtil.internalServerError(res, 'Failed to check migration status');
  }
});

// Run migrations (admin only)
router.post('/run', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin (you may want to add proper admin check here)
    const result = await MigrationService.runMigrations();
    
    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Migrations completed successfully',
        data: {
          migrationsRun: result.migrationsRun,
        },
      });
    } else {
      ErrorResponseUtil.badRequest(res, result.error || 'Migration failed');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    ErrorResponseUtil.internalServerError(res, 'Failed to run migrations');
  }
});

// Initialize database (run migrations and seeds if needed)
router.post('/initialize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await MigrationService.initializeDatabase();
    
    if (result.success) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Database initialized successfully',
        data: {
          migrationsRun: result.migrationsRun,
          seedsRun: result.seedsRun,
        },
      });
    } else {
      ErrorResponseUtil.badRequest(res, result.errors.join(', '));
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    ErrorResponseUtil.internalServerError(res, 'Failed to initialize database');
  }
});

export const migrationsRouter = router;