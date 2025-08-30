import { Router } from 'express';
import { AIAgentService } from '../services/ai/AIAgentService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const aiAgent = new AIAgentService();

// All AI routes require authentication
// router.use(authMiddleware); // Temporarily disabled for AI demo testing

/**
 * POST /api/ai/chat
 * Enhanced chat with project context
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      projectId,
      message,
      conversationId,
      options = {}
    } = req.body;

    if (!projectId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and message are required'
      });
    }

    const response = await aiAgent.chat(
      projectId,
      message,
      conversationId,
      {
        includeProjectContext: options.includeProjectContext !== false,
        includeFileContext: options.includeFileContext,
        currentFile: options.currentFile,
        selectedCode: options.selectedCode,
        model: options.model,
      }
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI chat failed'
    });
  }
});

/**
 * POST /api/ai/generate-code
 * Generate code with project context
 */
router.post('/generate-code', async (req, res) => {
  try {
    const {
      projectId,
      prompt,
      filePath,
      options = {}
    } = req.body;

    if (!projectId || !prompt || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, prompt, and file path are required'
      });
    }

    const generation = await aiAgent.generateCode(
      projectId,
      prompt,
      filePath,
      {
        fileContent: options.fileContent,
        selectedCode: options.selectedCode,
        selectionRange: options.selectionRange,
        model: options.model,
      }
    );

    res.json({
      success: true,
      data: generation
    });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code generation failed'
    });
  }
});

/**
 * POST /api/ai/explain-code
 * Explain code with project context
 */
router.post('/explain-code', async (req, res) => {
  try {
    const {
      projectId,
      code,
      filePath,
      level = 'intermediate'
    } = req.body;

    if (!projectId || !code || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, code, and file path are required'
      });
    }

    const explanation = await aiAgent.explainCode(
      projectId,
      code,
      filePath,
      level
    );

    res.json({
      success: true,
      data: explanation
    });
  } catch (error) {
    console.error('Code explanation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code explanation failed'
    });
  }
});

/**
 * POST /api/ai/fix-error
 * Fix code errors with context
 */
router.post('/fix-error', async (req, res) => {
  try {
    const {
      projectId,
      error,
      filePath,
      fileContent,
      diagnostics
    } = req.body;

    if (!projectId || !error || !filePath || !fileContent) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, error, file path, and file content are required'
      });
    }

    const fix = await aiAgent.fixError(
      projectId,
      error,
      filePath,
      fileContent,
      diagnostics
    );

    res.json({
      success: true,
      data: fix
    });
  } catch (error) {
    console.error('Error fix error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error fixing failed'
    });
  }
});

/**
 * POST /api/ai/suggestions
 * Get intelligent code suggestions
 */
router.post('/suggestions', async (req, res) => {
  try {
    const {
      projectId,
      filePath,
      fileContent,
      cursorPosition,
      triggerType = 'request'
    } = req.body;

    if (!projectId || !filePath || !fileContent) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, file path, and file content are required'
      });
    }

    const suggestions = await aiAgent.getCodeSuggestions(
      projectId,
      filePath,
      fileContent,
      cursorPosition,
      triggerType
    );

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Code suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Getting suggestions failed'
    });
  }
});

/**
 * POST /api/ai/analyze-project
 * Comprehensive project analysis
 */
router.post('/analyze-project', async (req, res) => {
  try {
    const {
      projectId,
      includeDetailedAnalysis = false
    } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const analysis = await aiAgent.analyzeProject(
      projectId,
      includeDetailedAnalysis
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Project analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Project analysis failed'
    });
  }
});

/**
 * POST /api/ai/review-code
 * Review code changes
 */
router.post('/review-code', async (req, res) => {
  try {
    const {
      projectId,
      changes,
      filePath,
      reviewType = 'all'
    } = req.body;

    if (!projectId || !changes || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, changes, and file path are required'
      });
    }

    const review = await aiAgent.reviewCode(
      projectId,
      changes,
      filePath,
      reviewType
    );

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Code review error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code review failed'
    });
  }
});

/**
 * POST /api/ai/conversation/start
 * Start a new conversation
 */
router.post('/conversation/start', async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const conversationId = await aiAgent.startConversation(projectId);

    res.json({
      success: true,
      data: { conversationId }
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start conversation'
    });
  }
});

/**
 * GET /api/ai/conversation/:id
 * Get conversation history
 */
router.get('/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = aiAgent.getConversationHistory(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation'
    });
  }
});

/**
 * GET /api/ai/providers
 * Get AI provider information
 */
router.get('/providers', async (req, res) => {
  try {
    const providerInfo = await aiAgent.getProviderInfo();

    res.json({
      success: true,
      data: providerInfo
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider info'
    });
  }
});

/**
 * POST /api/ai/providers/switch
 * Switch AI provider
 */
router.post('/providers/switch', async (req, res) => {
  try {
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID is required'
      });
    }

    const success = await aiAgent.switchProvider(providerId);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to switch provider - provider may not be available'
      });
    }

    res.json({
      success: true,
      data: { providerId }
    });
  } catch (error) {
    console.error('Switch provider error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to switch provider'
    });
  }
});

/**
 * POST /api/ai/context/update
 * Update project context when files change
 */
router.post('/context/update', async (req, res) => {
  try {
    const { projectId, changes } = req.body;

    if (!projectId || !changes) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and changes are required'
      });
    }

    await aiAgent.updateProjectContext(projectId, changes);

    res.json({
      success: true,
      data: { message: 'Context updated successfully' }
    });
  } catch (error) {
    console.error('Update context error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update context'
    });
  }
});

/**
 * GET /api/ai/files/related/:projectId/:filePath*
 * Get related files for better context
 */
router.get('/files/related/:projectId/*', async (req, res) => {
  try {
    const { projectId } = req.params;
    const filePath = (req.params as any)[0]; // Get the full file path after projectId
    const { maxDepth = 2 } = req.query;

    if (!projectId || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and file path are required'
      });
    }

    const relatedFiles = await aiAgent.getRelatedFiles(
      projectId,
      filePath,
      parseInt(maxDepth as string) || 2
    );

    res.json({
      success: true,
      data: relatedFiles
    });
  } catch (error) {
    console.error('Get related files error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get related files'
    });
  }
});

/**
 * POST /api/ai/feedback
 * Provide feedback on AI responses for learning
 */
router.post('/feedback', async (req, res) => {
  try {
    const {
      messageId,
      feedback, // 'positive' | 'negative'
      details
    } = req.body;

    if (!messageId || !feedback) {
      return res.status(400).json({
        success: false,
        error: 'Message ID and feedback are required'
      });
    }

    // Store feedback for model improvement
    console.log(`AI Feedback received: ${messageId} - ${feedback}`, details);

    res.json({
      success: true,
      data: { message: 'Feedback recorded' }
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record feedback'
    });
  }
});

/**
 * GET /api/ai/health
 * Health check for AI services
 */
router.get('/health', async (req, res) => {
  try {
    const providerInfo = await aiAgent.getProviderInfo();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        providers: providerInfo.status,
        currentProvider: providerInfo.currentProvider,
      }
    });
  } catch (error) {
    console.error('AI Health check error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI services unhealthy',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      }
    });
  }
});

export default router;