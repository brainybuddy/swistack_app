import express from 'express';
import { mistralAgentService } from '../services/ai/MistralAgentService';
import { aiPreviewMonitor } from '../services/ai/AIPreviewMonitor';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Initialize agent service and AI preview monitor
mistralAgentService.initialize().catch(console.error);
console.log('🤖 AI Preview Monitor initialized and ready');

// Create new conversation
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const conversationId = await mistralAgentService.createConversation(userId);
    res.json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Send message to agent
router.post('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify conversation belongs to user
    const conversation = mistralAgentService.getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Set up Server-Sent Events for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const responseStream = await mistralAgentService.sendMessage(conversationId, message);

    for await (const chunk of responseStream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: {"type": "done"}\n\n');
    res.end();
  } catch (error) {
    console.error('Error sending message:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: 'Internal server error' } })}\n\n`);
    res.end();
  }
});

// Get conversation history
router.get('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const conversation = mistralAgentService.getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = mistralAgentService.getConversationHistory(conversationId);
    res.json({ messages });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

// Get agent status
router.get('/status', async (_req, res) => {
  try {
    const status = mistralAgentService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting agent status:', error);
    res.status(500).json({ success: false, error: 'Failed to get agent status' });
  }
});

export default router;
