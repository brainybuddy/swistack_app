// Integration layer for the Autonomous Agent
import { AutonomousAgent } from './AutonomousAgent';
import { AIAgentService } from './AIAgentService';
import {
  AutonomousAgentStatus,
  Goal,
  Task,
  AgentEvent,
  AgentNotification,
  AutonomyLevel
} from '@swistack/shared';

export class AutonomousAgentService {
  private agent: AutonomousAgent;
  private aiService: AIAgentService;
  private static instance: AutonomousAgentService;

  constructor() {
    this.agent = new AutonomousAgent();
    this.aiService = new AIAgentService();
    this.setupEventHandlers();
  }

  public static getInstance(): AutonomousAgentService {
    if (!AutonomousAgentService.instance) {
      AutonomousAgentService.instance = new AutonomousAgentService();
    }
    return AutonomousAgentService.instance;
  }

  private setupEventHandlers(): void {
    this.agent.on('agent_event', (event: AgentEvent) => {
      console.log(`[AutonomousAgentService] Event: ${event.type}`, event.data);
      // Could emit to WebSocket clients here
    });

    this.agent.on('agent_notification', (notification: AgentNotification) => {
      console.log(`[AutonomousAgentService] Notification: ${notification.title}`);
      // Could send to notification system
    });
  }

  /**
   * Enhanced chat that can trigger autonomous actions
   */
  async chat(
    projectId: string,
    message: string,
    conversationId?: string,
    options?: any
  ): Promise<any> {
    // First, get response from the base AI service
    const baseResponse = await this.aiService.chat(projectId, message, conversationId, options);

    // Analyze if the message contains goals or requests that should trigger autonomous behavior
    const autonomousIntent = await this.detectAutonomousIntent(message, projectId);
    console.log('[AutonomousAgentService] Intent analysis result:', autonomousIntent);
    
    if (autonomousIntent.isGoal) {
      // Process as a goal for the autonomous agent
      try {
        const goal = await this.agent.processGoal(autonomousIntent.goalDescription, {
          projectId,
          originalMessage: message,
          priority: autonomousIntent.priority,
          conversationId
        });

        // Enhance the response with autonomous agent information
        baseResponse.content += `\n\n🤖 **Agent Goal Created**: "${goal.description}"\n\nI'll work on this autonomously and update you on progress.`;
        baseResponse.metadata = {
          ...baseResponse.metadata,
          autonomousGoal: goal,
          agentActivated: true
        };
      } catch (error) {
        console.error('[AutonomousAgentService] Failed to create goal:', error);
        baseResponse.content += '\n\n⚠️ Note: I understood this as a goal but encountered an issue setting it up. I can still help you with this manually.';
      }
    } else if (autonomousIntent.needsProactiveHelp) {
      // Offer proactive assistance
      baseResponse.content += '\n\n💡 **Proactive Suggestion**: I can work on this autonomously in the background. Would you like me to create a goal for this?';
    }

    return baseResponse;
  }

  /**
   * Start the autonomous agent
   */
  async startAgent(projectId: string): Promise<AutonomousAgentStatus> {
    await this.agent.start(projectId);
    return this.agent.getStatus();
  }

  /**
   * Stop the autonomous agent
   */
  async stopAgent(): Promise<AutonomousAgentStatus> {
    await this.agent.stop();
    return this.agent.getStatus();
  }

  /**
   * Get agent status
   */
  getAgentStatus(): AutonomousAgentStatus {
    return this.agent.getStatus();
  }

  /**
   * Create a goal manually
   */
  async createGoal(description: string, context: Record<string, any>): Promise<Goal> {
    return await this.agent.processGoal(description, context);
  }

  /**
   * Set autonomy level
   */
  setAutonomyLevel(level: AutonomyLevel): void {
    this.agent.setAutonomyLevel(level);
  }

  /**
   * Get agent memory for analysis
   */
  getAgentMemory() {
    return this.agent.getMemory();
  }

  /**
   * Pause/resume tasks
   */
  async pauseTask(taskId: string): Promise<void> {
    await this.agent.pauseTask(taskId);
  }

  async resumeTask(taskId: string): Promise<void> {
    await this.agent.resumeTask(taskId);
  }

  // All existing AIAgentService methods - delegate to the original service
  async generateCode(projectId: string, prompt: string, filePath: string, options?: any) {
    return this.aiService.generateCode(projectId, prompt, filePath, options);
  }

  async explainCode(projectId: string, code: string, filePath: string, level?: string) {
    return this.aiService.explainCode(projectId, code, filePath, level);
  }

  async fixError(projectId: string, error: string, filePath: string, fileContent: string, diagnostics?: any) {
    return this.aiService.fixError(projectId, error, filePath, fileContent, diagnostics);
  }

  async getCodeSuggestions(projectId: string, filePath: string, fileContent: string, cursorPosition?: any, triggerType?: string) {
    return this.aiService.getCodeSuggestions(projectId, filePath, fileContent, cursorPosition, triggerType);
  }

  async analyzeProject(projectId: string, includeDetailedAnalysis?: boolean) {
    return this.aiService.analyzeProject(projectId, includeDetailedAnalysis);
  }

  async reviewCode(projectId: string, changes: any, filePath: string, reviewType?: string) {
    return this.aiService.reviewCode(projectId, changes, filePath, reviewType);
  }

  async startConversation(projectId: string) {
    return this.aiService.startConversation(projectId);
  }

  getConversationHistory(id: string) {
    return this.aiService.getConversationHistory(id);
  }

  async getProviderInfo() {
    return this.aiService.getProviderInfo();
  }

  async switchProvider(providerId: string) {
    return this.aiService.switchProvider(providerId);
  }

  async updateProjectContext(projectId: string, changes: any) {
    return this.aiService.updateProjectContext(projectId, changes);
  }

  async getRelatedFiles(projectId: string, filePath: string, maxDepth?: number) {
    return this.aiService.getRelatedFiles(projectId, filePath, maxDepth);
  }

  // Private helper methods
  private async detectAutonomousIntent(message: string, projectId: string): Promise<{
    isGoal: boolean;
    goalDescription: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    needsProactiveHelp: boolean;
  }> {
    // Use AI to detect if the message contains a goal or task request
    const intentPrompt = `Analyze this user message to determine if it contains a goal or task that an autonomous coding agent should work on:

Message: "${message}"

Determine:
1. Is this a request for autonomous work? (vs just a question or immediate help)
2. If yes, what is the main goal?
3. What priority should this have?
4. Should the agent offer proactive help?

Examples of autonomous goals:
- "Create a login system"
- "Add unit tests to the project"
- "Improve the performance of the app"
- "Fix all the linting errors"
- "Add dark mode to the UI"

Examples of non-goals:
- "What does this function do?"
- "How do I use React hooks?"
- "Show me the current code"

Response format:
{
  "isGoal": boolean,
  "goalDescription": "concise description of the goal",
  "priority": "low|medium|high|critical",
  "needsProactiveHelp": boolean
}`;

    try {
      const response = await this.aiService.chat(projectId, intentPrompt);
      let jsonContent = response.content;
      
      // Log the raw response to debug
      console.log('[AutonomousAgentService] Raw intent response:', jsonContent.substring(0, 200) + '...');
      
      // Extract JSON from response if it's wrapped in markdown or other text
      const jsonMatch = jsonContent.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
        console.log('[AutonomousAgentService] Extracted JSON:', jsonContent);
      }
      
      let parsed;
      try {
        parsed = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('[AutonomousAgentService] JSON parse failed:', parseError);
        console.log('[AutonomousAgentService] Content that failed to parse:', jsonContent);
        throw parseError; // Re-throw to trigger fallback
      }
      
      return {
        isGoal: parsed.isGoal || false,
        goalDescription: parsed.goalDescription || '',
        priority: parsed.priority || 'medium',
        needsProactiveHelp: parsed.needsProactiveHelp || false
      };
    } catch (error) {
      console.error('[AutonomousAgentService] Failed to detect intent:', error);
      console.log('[AutonomousAgentService] Using fallback logic for message:', message);
      
      // For requests that clearly involve implementing features, assume they are goals
      const isImplementationRequest = /add|create|implement|build|fix|update|modify/i.test(message);
      
      if (isImplementationRequest) {
        console.log('[AutonomousAgentService] ✅ Detected implementation request via fallback:', message.substring(0, 100));
        return {
          isGoal: true,
          goalDescription: message.substring(0, 100),
          priority: 'medium',
          needsProactiveHelp: false
        };
      }
      
      console.log('[AutonomousAgentService] ❌ No implementation keywords found, not treating as goal');
      return {
        isGoal: false,
        goalDescription: '',
        priority: 'medium',
        needsProactiveHelp: false
      };
    }
  }
}

// Export singleton instance
export const autonomousAgentService = AutonomousAgentService.getInstance();