import express from 'express';
import http from 'http';
import https from 'https';
import { devServerManager } from '../services/DevServerManager';
import { nixDevServerManager } from '../services/NixDevServerManager';
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

    // Prefer Nix-based dev for Next.js projects; fallback to default manager
    let result = await nixDevServerManager.start(projectId, userId);
    if (!result.success) {
      // Fallback to old manager (writes to temp workspace)
      result = await devServerManager.startDevServer(projectId, userId);
    }

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

    // Try both managers
    const stopped = await nixDevServerManager.stop(projectId) || await devServerManager.stopDevServer(projectId);

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
 * Restart development server for a project (stop then start)
 */
router.post('/restart/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Stop via both managers (whichever is running)
    await nixDevServerManager.stop(projectId);
    await devServerManager.stopDevServer(projectId);

    // Start again (prefer Nix)
    let result = await nixDevServerManager.start(projectId, userId);
    if (!result.success) {
      result = await devServerManager.startDevServer(projectId, userId);
    }

    if (result.success) {
      res.json({ success: true, data: { url: result.url, port: result.port, status: 'starting' } });
    } else {
      res.status(500).json({ success: false, error: result.error || 'Failed to restart server' });
    }
  } catch (error) {
    console.error('Error restarting development server:', error);
    res.status(500).json({ success: false, error: 'Failed to restart development server' });
  }
});

/**
 * Stop all dev servers
 */
router.post('/stop-all', authMiddleware, async (_req, res) => {
  try {
    await nixDevServerManager.stopAll();
    await devServerManager.stopAllServers();
    res.json({ success: true, message: 'All development servers stopped' });
  } catch (error) {
    console.error('Error stopping all servers:', error);
    res.status(500).json({ success: false, error: 'Failed to stop all servers' });
  }
});

/**
 * Restart all dev servers (stop all; no auto-start to avoid chaos)
 */
router.post('/restart-all', authMiddleware, async (_req, res) => {
  try {
    await nixDevServerManager.stopAll();
    await devServerManager.stopAllServers();
    res.json({ success: true, message: 'All development servers restarted (stopped). Start as needed.' });
  } catch (error) {
    console.error('Error restarting all servers:', error);
    res.status(500).json({ success: false, error: 'Failed to restart all servers' });
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

    const rawStatus = nixDevServerManager.getStatus(projectId) || devServerManager.getStatus(projectId) || 'stopped';
    const url = nixDevServerManager.getUrl(projectId) || devServerManager.getServerUrl(projectId);

    // Verify reachability of the reported URL when raw status is running
    const reachable = await new Promise<boolean>((resolve) => {
      if (!url) return resolve(false);
      try {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { timeout: 1500 }, (resp) => {
          // Any HTTP response means something is listening
          resolve(true);
          resp.resume();
        });
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.on('error', () => resolve(false));
      } catch {
        resolve(false);
      }
    });

    const status: 'running' | 'starting' | 'stopped' | 'error' =
      rawStatus === 'running' ? (reachable ? 'running' : 'starting') :
      rawStatus === 'starting' ? 'starting' :
      rawStatus === 'error' ? 'error' : 'stopped';

    res.json({
      success: true,
      data: {
        projectId,
        isRunning: status === 'running',
        url: url || null,
        status
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
 * Get recent dev server logs for a project
 */
router.get('/logs/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const logs = [
      ...nixDevServerManager.getLogs(projectId),
      ...devServerManager.getLogs(projectId)
    ];
    const rawStatus = nixDevServerManager.getStatus(projectId) || devServerManager.getStatus(projectId) || 'stopped';
    const url = nixDevServerManager.getUrl(projectId) || devServerManager.getServerUrl(projectId);

    // Reachability only matters if raw says running; otherwise keep raw
    const reachable = await new Promise<boolean>((resolve) => {
      if (!url) return resolve(false);
      try {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { timeout: 1500 }, (resp) => { resolve(true); resp.resume(); });
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.on('error', () => resolve(false));
      } catch { resolve(false); }
    });

    const status: 'running' | 'starting' | 'stopped' | 'error' =
      rawStatus === 'running' ? (reachable ? 'running' : 'starting') :
      rawStatus === 'starting' ? 'starting' :
      rawStatus === 'error' ? 'error' : 'stopped';

    res.json({ success: true, data: { logs, url, status } });
  } catch (error) {
    console.error('Error getting dev server logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get dev server logs' });
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
