import express from 'express';
import { devServerManager } from '../services/DevServerManager';
import { authMiddleware } from '../middleware/auth';
import { ProjectModel } from '../models/Project';

const router = express.Router();

/**
 * Start development server for a project
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

    // Check if server is already running
    if (devServerManager.isServerRunning(projectId)) {
      const url = devServerManager.getServerUrl(projectId);
      return res.json({
        success: true,
        message: 'Development server is already running',
        data: { url, status: 'running' }
      });
    }

    // Start the development server
    const result = await devServerManager.startDevServer(projectId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Development server started successfully',
        data: {
          port: result.port,
          url: result.url,
          status: 'starting'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to start development server'
      });
    }
  } catch (error) {
    console.error('Error starting development server:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start development server' 
    });
  }
});

/**
 * Stop development server for a project
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

    const stopped = await devServerManager.stopDevServer(projectId);

    if (stopped) {
      res.json({
        success: true,
        message: 'Development server stopped successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No development server found for this project'
      });
    }
  } catch (error) {
    console.error('Error stopping development server:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop development server' 
    });
  }
});

/**
 * Get development server status for a project
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

    const isRunning = devServerManager.isServerRunning(projectId);
    const url = devServerManager.getServerUrl(projectId);

    res.json({
      success: true,
      data: {
        projectId,
        isRunning,
        url: url || null,
        status: isRunning ? 'running' : 'stopped'
      }
    });
  } catch (error) {
    console.error('Error getting development server status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get server status' 
    });
  }
});

/**
 * Get all running development servers (admin/debug endpoint)
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const runningServers = devServerManager.getRunningServers();

    res.json({
      success: true,
      data: {
        servers: runningServers,
        count: runningServers.length
      }
    });
  } catch (error) {
    console.error('Error listing development servers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list servers' 
    });
  }
});

export default router;