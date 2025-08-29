import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import TerminalService from '../services/TerminalService';

const router = Router();

// Create a new terminal session
router.post('/sessions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    const userId = req.user!.id;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const sessionId = TerminalService.createSession(projectId, userId);

    res.json({
      success: true,
      data: {
        sessionId,
        message: 'Terminal session created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating terminal session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create terminal session'
    });
  }
});

// Execute a command in a terminal session
router.post('/sessions/:sessionId/execute', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body;
    const userId = req.user!.id;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required'
      });
    }

    // Verify session belongs to user
    const session = TerminalService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Terminal session not found'
      });
    }

    const outputs = await TerminalService.executeCommand(sessionId, command);

    res.json({
      success: true,
      data: {
        outputs,
        cwd: session.cwd
      }
    });
  } catch (error) {
    console.error('Error executing terminal command:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute command'
    });
  }
});

// Get terminal session info
router.get('/sessions/:sessionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const session = TerminalService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Terminal session not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: session.id,
        projectId: session.projectId,
        cwd: session.cwd,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('Error getting terminal session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get terminal session'
    });
  }
});

// Get all user's terminal sessions
router.get('/sessions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessions = TerminalService.getUserSessions(userId);

    res.json({
      success: true,
      data: sessions.map(session => ({
        id: session.id,
        projectId: session.projectId,
        cwd: session.cwd,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }))
    });
  } catch (error) {
    console.error('Error getting terminal sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get terminal sessions'
    });
  }
});

// Terminate a terminal session
router.delete('/sessions/:sessionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    // Verify session belongs to user
    const session = TerminalService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Terminal session not found'
      });
    }

    const terminated = TerminalService.terminateSession(sessionId);

    if (terminated) {
      res.json({
        success: true,
        data: {
          message: 'Terminal session terminated successfully'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to terminate terminal session'
      });
    }
  } catch (error) {
    console.error('Error terminating terminal session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate terminal session'
    });
  }
});

export default router;