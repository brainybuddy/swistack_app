import express from 'express';
import { productionDevServerManager } from '../services/ProductionDevServerManager';
import { authMiddleware } from '../middleware/auth';
import { ProjectModel } from '../models/Project';
import { UserModel } from '../models/User';

const router = express.Router();

/**
 * Start production development server for a project
 * Creates containerized environment with custom domain
 */
router.post('/start/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    // Check if user has access to the project
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get user information for custom domain generation
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if server is already running
    const existingInfo = productionDevServerManager.getServerInfo(projectId);
    if (existingInfo && existingInfo.status === 'running') {
      return res.json({
        success: true,
        message: 'Production development server is already running',
        data: {
          url: existingInfo.publicUrl,
          customDomain: existingInfo.customDomain,
          port: existingInfo.port,
          containerId: existingInfo.containerId,
          status: 'running'
        }
      });
    }

    // Start the production development server
    const result = await productionDevServerManager.startProductionDevServer(
      projectId,
      userId,
      user.username
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Production development server started successfully',
        data: {
          url: result.url,
          customDomain: result.customDomain,
          port: result.port,
          containerId: result.containerId,
          status: 'starting'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to start production development server'
      });
    }
  } catch (error) {
    console.error('Error starting production development server:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start production development server' 
    });
  }
});

/**
 * Stop production development server for a project
 */
router.post('/stop/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    // Check if user has access to the project
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const stopped = await productionDevServerManager.stopProductionDevServer(projectId);

    if (stopped) {
      res.json({
        success: true,
        message: 'Production development server stopped successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No production development server found for this project'
      });
    }
  } catch (error) {
    console.error('Error stopping production development server:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop production development server' 
    });
  }
});

/**
 * Get production development server status for a project
 */
router.get('/status/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    // Check if user has access to the project
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const status = await productionDevServerManager.getServerStatus(projectId);

    res.json({
      success: true,
      data: {
        projectId,
        isRunning: status.isRunning,
        url: status.url,
        customDomain: status.customDomain,
        health: status.health,
        resourceUsage: status.resourceUsage,
        status: status.isRunning ? 'running' : 'stopped'
      }
    });
  } catch (error) {
    console.error('Error getting production development server status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get server status' 
    });
  }
});

/**
 * Get all running production development servers for user
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const userServers = productionDevServerManager.getUserServers(userId);

    res.json({
      success: true,
      data: {
        servers: userServers.map(server => ({
          projectId: server.projectId,
          projectName: server.projectName,
          url: server.publicUrl,
          customDomain: server.customDomain,
          port: server.port,
          status: server.status,
          lastStarted: server.lastStarted,
          resourceUsage: server.resourceUsage
        })),
        count: userServers.length
      }
    });
  } catch (error) {
    console.error('Error listing production development servers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list servers' 
    });
  }
});

/**
 * Get production metrics (admin only)
 */
router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check if user is admin (you may want to implement proper admin role checking)
    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const metrics = productionDevServerManager.getMetrics();

    res.json({
      success: true,
      data: {
        metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting production metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get metrics' 
    });
  }
});

/**
 * Scale user containers based on usage (admin only)
 */
router.post('/scale/:userId', authMiddleware, async (req, res) => {
  try {
    const requestUserId = req.user?.id;
    const targetUserId = req.params.userId;
    
    if (!requestUserId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check if requesting user is admin or scaling their own containers
    if (requestUserId !== targetUserId) {
      const user = await UserModel.findById(requestUserId);
      if (!user || !user.isActive) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
    }

    await productionDevServerManager.scaleUserContainers(targetUserId);

    res.json({
      success: true,
      message: 'Container scaling completed'
    });
  } catch (error) {
    console.error('Error scaling containers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to scale containers' 
    });
  }
});

/**
 * Manual cleanup of idle servers (admin only)
 */
router.post('/cleanup', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check if user is admin
    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const maxIdleTime = parseInt(req.body.maxIdleTime as string) || 3600000; // 1 hour default
    await productionDevServerManager.cleanupIdleServers(maxIdleTime);

    res.json({
      success: true,
      message: 'Cleanup completed'
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cleanup servers' 
    });
  }
});

export default router;