import express from 'express';
import { portAllocationManager } from '../services/PortAllocationManager';
import { authMiddleware } from '../middleware/auth';
import { ProjectModel } from '../models/Project';

const router = express.Router();

/**
 * Get all port allocations (admin endpoint)
 */
router.get('/allocations', authMiddleware, async (req, res) => {
  try {
    const allocations = portAllocationManager.getAllAllocations();
    res.json({
      success: true,
      data: {
        allocations,
        count: allocations.length,
        strategies: portAllocationManager.getStrategies()
      }
    });
  } catch (error) {
    console.error('Error getting port allocations:', error);
    res.status(500).json({ success: false, error: 'Failed to get port allocations' });
  }
});

/**
 * Get port allocation for a specific project
 */
router.get('/allocations/:projectId', authMiddleware, async (req, res) => {
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

    const allocation = portAllocationManager.getProjectAllocation(projectId);
    
    if (!allocation) {
      return res.status(404).json({ success: false, error: 'Port allocation not found' });
    }

    res.json({
      success: true,
      data: allocation
    });
  } catch (error) {
    console.error('Error getting project port allocation:', error);
    res.status(500).json({ success: false, error: 'Failed to get port allocation' });
  }
});

/**
 * Manually allocate ports for existing project
 */
router.post('/allocations/:projectId/reserve', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { frontendPort, backendPort, reservedPorts } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    // Check if user is project owner (only owners can manually allocate ports)
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only project owners can allocate ports' });
    }

    // Get project details
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Validate port inputs
    if (!frontendPort || !backendPort || !Array.isArray(reservedPorts)) {
      return res.status(400).json({ 
        success: false, 
        error: 'frontendPort, backendPort, and reservedPorts array are required' 
      });
    }

    const allocation = await portAllocationManager.reservePortsForExistingProject(
      projectId,
      project.name,
      frontendPort,
      backendPort,
      reservedPorts
    );

    res.json({
      success: true,
      data: allocation,
      message: `Ports allocated successfully for ${project.name}`
    });
  } catch (error) {
    console.error('Error reserving ports:', error);
    
    if (error instanceof Error && error.message.includes('already allocated')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: 'Failed to reserve ports' });
  }
});

/**
 * Auto-allocate ports for existing project
 */
router.post('/allocations/:projectId/auto', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { strategy = 'spaced' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    // Check if user is project owner
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only project owners can allocate ports' });
    }

    // Get project details
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if already allocated
    const existing = portAllocationManager.getProjectAllocation(projectId);
    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: `Ports already allocated for ${project.name}`
      });
    }

    const allocation = await portAllocationManager.allocatePortsForProject(
      projectId,
      project.name,
      strategy
    );

    res.json({
      success: true,
      data: allocation,
      message: `Ports auto-allocated successfully for ${project.name}`
    });
  } catch (error) {
    console.error('Error auto-allocating ports:', error);
    res.status(500).json({ success: false, error: 'Failed to auto-allocate ports' });
  }
});

/**
 * Release ports for a project
 */
router.delete('/allocations/:projectId', authMiddleware, async (req, res) => {
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

    // Check if user is project owner
    const role = await ProjectModel.getMemberRole(projectId, userId);
    if (role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only project owners can release ports' });
    }

    const released = await portAllocationManager.releaseProjectPorts(projectId);
    
    if (!released) {
      return res.status(404).json({ success: false, error: 'No port allocation found to release' });
    }

    res.json({
      success: true,
      message: 'Port allocation released successfully'
    });
  } catch (error) {
    console.error('Error releasing ports:', error);
    res.status(500).json({ success: false, error: 'Failed to release ports' });
  }
});

/**
 * Check if specific ports are available
 */
router.post('/check-availability', authMiddleware, async (req, res) => {
  try {
    const { ports } = req.body;

    if (!Array.isArray(ports)) {
      return res.status(400).json({ success: false, error: 'ports array is required' });
    }

    const availability = ports.map(port => ({
      port,
      available: portAllocationManager.isPortAvailable(port)
    }));

    res.json({
      success: true,
      data: {
        availability,
        allAvailable: availability.every(p => p.available)
      }
    });
  } catch (error) {
    console.error('Error checking port availability:', error);
    res.status(500).json({ success: false, error: 'Failed to check port availability' });
  }
});

export default router;