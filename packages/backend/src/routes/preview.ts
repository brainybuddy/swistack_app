import express from 'express';
import { LivePreviewService } from '../services/LivePreviewService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * Get project data for live preview
 */
router.get('/project/:projectId', authMiddleware, async (req, res) => {
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

    const previewableProject = await LivePreviewService.getProjectForPreview(projectId, userId);
    
    if (!previewableProject) {
      return res.status(404).json({ success: false, error: 'Project not found or access denied' });
    }

    res.json({
      success: true,
      data: previewableProject
    });
  } catch (error) {
    console.error('Error getting project for preview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get project preview data' 
    });
  }
});

/**
 * Generate HTML preview for project
 */
router.get('/project/:projectId/html', authMiddleware, async (req, res) => {
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

    const previewableProject = await LivePreviewService.getProjectForPreview(projectId, userId);
    
    if (!previewableProject) {
      return res.status(404).json({ success: false, error: 'Project not found or access denied' });
    }

    const html = LivePreviewService.compileProjectToHTML(previewableProject);

    // Return HTML directly
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating HTML preview:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Preview Error</h1>
          <p>Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
    `);
  }
});

/**
 * Update file and get updated preview
 */
router.put('/project/:projectId/file', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filePath, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    if (!filePath || content === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'filePath and content are required' 
      });
    }

    const result = await LivePreviewService.updateFileAndGeneratePreview(
      projectId, 
      userId, 
      filePath, 
      content
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating file and generating preview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update file and generate preview' 
    });
  }
});

/**
 * Get project port information
 */
router.get('/project/:projectId/ports', authMiddleware, async (req, res) => {
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

    const previewableProject = await LivePreviewService.getProjectForPreview(projectId, userId);
    
    if (!previewableProject) {
      return res.status(404).json({ success: false, error: 'Project not found or access denied' });
    }

    res.json({
      success: true,
      data: {
        projectId: previewableProject.id,
        projectName: previewableProject.name,
        ports: previewableProject.ports,
        template: previewableProject.template
      }
    });
  } catch (error) {
    console.error('Error getting project ports:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get project port information' 
    });
  }
});

export default router;