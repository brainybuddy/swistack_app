import { EventEmitter } from 'events';
import {
  Goal,
  Task,
  TaskPlan,
  TaskResult,
  AutonomousAgentStatus,
  AutonomyLevel,
  AgentMemory,
  Pattern,
  Experience,
  Learning,
  AgentEvent,
  AgentNotification
} from '@swistack/shared';
import { AIAgentService } from './AIAgentService';
import { GoalPlanner } from './GoalPlanner';
import { TaskExecutor } from './TaskExecutor';
import { AgentMemoryManager } from './AgentMemoryManager';
import { EnvironmentMonitor } from './EnvironmentMonitor';
import { SafetySystem } from './SafetySystem';

export class AutonomousAgent extends EventEmitter {
  private aiService: AIAgentService;
  private goalPlanner: GoalPlanner;
  private taskExecutor: TaskExecutor;
  private memoryManager: AgentMemoryManager;
  private environmentMonitor: EnvironmentMonitor;
  private safetySystem: SafetySystem;

  private status: AutonomousAgentStatus;
  private autonomyLevel: AutonomyLevel;
  private memory: AgentMemory;
  
  private activeGoals: Map<string, Goal> = new Map();
  private activeTasks: Map<string, Task> = new Map();
  private taskQueue: Task[] = [];
  
  private isRunning = false;
  private planningInterval?: NodeJS.Timeout;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();
    
    this.aiService = new AIAgentService();
    this.goalPlanner = new GoalPlanner(this.aiService);
    this.taskExecutor = new TaskExecutor(this.aiService);
    this.memoryManager = new AgentMemoryManager();
    this.environmentMonitor = new EnvironmentMonitor();
    this.safetySystem = new SafetySystem();

    this.initializeDefaultStatus();
    this.setupEventHandlers();
  }

  private initializeDefaultStatus(): void {
    this.autonomyLevel = {
      level: 'semi_autonomous',
      permissions: [
        { action: 'read_files', scope: ['project'], conditions: [] },
        { action: 'create_files', scope: ['project'], conditions: ['size < 100kb'] },
        { action: 'modify_files', scope: ['project'], conditions: ['backup_created'] },
        { action: 'run_commands', scope: ['build', 'test'], conditions: ['safe_commands_only'] }
      ],
      restrictions: [
        { action: 'delete_files', reason: 'requires_approval', conditions: [] },
        { action: 'external_api_calls', reason: 'security_risk', conditions: [] }
      ],
      approvalRequired: true,
      workingHours: { start: '09:00', end: '17:00' },
      maxConcurrentTasks: 3
    };

    this.status = {
      isActive: false,
      currentMode: 'idle',
      autonomyLevel: this.autonomyLevel,
      currentGoals: [],
      activeTasks: [],
      queuedTasks: [],
      recentActivity: [],
      performance: {
        tasksCompleted: 0,
        successRate: 0,
        averageTaskDuration: 0,
        qualityScore: 0,
        learningRate: 0,
        efficiencyTrend: [],
        period: '24h'
      },
      health: {
        status: 'healthy',
        issues: [],
        resourceUtilization: {
          cpuTime: 0,
          memoryUsed: 0,
          filesModified: 0,
          commandsExecuted: 0,
          apiCalls: 0
        },
        lastHealthCheck: new Date()
      },
      lastActivity: new Date()
    };

    this.memory = {
      patterns: [],
      experiences: [],
      knowledge: [],
      projectSpecifics: []
    };
  }

  private setupEventHandlers(): void {
    // Task execution events
    this.taskExecutor.on('task_started', (task: Task) => {
      this.activeTasks.set(task.id, task);
      this.updateStatus();
      this.emitEvent('task_started', { task });
    });

    this.taskExecutor.on('task_completed', (task: Task, result: TaskResult) => {
      this.handleTaskCompletion(task, result);
    });

    this.taskExecutor.on('task_failed', (task: Task, error: Error) => {
      this.handleTaskFailure(task, error);
    });

    // Environment monitoring events
    this.environmentMonitor.on('file_changed', (change) => {
      this.handleEnvironmentChange('file_changed', change);
    });

    this.environmentMonitor.on('build_failed', (error) => {
      this.handleBuildFailure(error);
    });

    // Memory updates
    this.memoryManager.on('pattern_learned', (pattern: Pattern) => {
      this.memory.patterns.push(pattern);
      this.emitEvent('learning_update', { pattern });
    });
  }

  // Core Agent Lifecycle
  public async start(projectId: string): Promise<void> {
    if (this.isRunning) {
      console.log('[AutonomousAgent] Already running');
      return;
    }

    console.log(`[AutonomousAgent] Starting for project ${projectId}`);
    this.isRunning = true;
    this.status.isActive = true;
    this.status.currentMode = 'idle';

    // Start environment monitoring
    await this.environmentMonitor.start(projectId);

    // Start planning cycle
    this.planningInterval = setInterval(() => {
      this.runPlanningCycle(projectId);
    }, 30000); // Every 30 seconds

    // Start health monitoring
    this.monitoringInterval = setInterval(() => {
      this.checkHealth();
    }, 60000); // Every minute

    this.updateStatus();
    this.emitEvent('agent_started', { projectId });
  }

  public async stop(): Promise<void> {
    console.log('[AutonomousAgent] Stopping');
    this.isRunning = false;
    this.status.isActive = false;
    this.status.currentMode = 'idle';

    // Clear intervals
    if (this.planningInterval) {
      clearInterval(this.planningInterval);
      this.planningInterval = undefined;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Stop environment monitoring
    await this.environmentMonitor.stop();

    // Cancel active tasks
    for (const task of this.activeTasks.values()) {
      if (task.status === 'executing') {
        task.status = 'failed';
        task.error = 'Agent stopped';
      }
    }

    this.updateStatus();
    this.emitEvent('agent_stopped', {});
  }

  // Goal Processing
  public async processGoal(goalDescription: string, context: Record<string, any> = {}): Promise<Goal> {
    console.log(`[AutonomousAgent] Processing goal: ${goalDescription}`);
    
    const goal: Goal = {
      id: this.generateId(),
      description: goalDescription,
      priority: context.priority || 'medium',
      context,
      createdAt: new Date()
    };

    // Use AI to plan the goal
    const plan = await this.goalPlanner.planGoal(goal, this.memory);
    
    // Create tasks from the plan
    const tasks = await this.goalPlanner.createTasks(goal, plan);
    
    // Add to queue
    this.activeGoals.set(goal.id, goal);
    tasks.forEach(task => this.taskQueue.push(task));
    
    this.updateStatus();
    this.emitEvent('goal_created', { goal, tasks });

    // Start execution if conditions are met
    if (this.shouldStartExecution()) {
      await this.processTaskQueue();
    }

    return goal;
  }

  // Task Processing
  private async runPlanningCycle(projectId: string): Promise<void> {
    if (this.status.currentMode !== 'idle' || this.taskQueue.length === 0) {
      return;
    }

    console.log('[AutonomousAgent] Running planning cycle');
    this.status.currentMode = 'planning';

    try {
      // Re-prioritize tasks based on current context
      await this.reprioritizeTasks(projectId);
      
      // Process tasks if we have capacity
      if (this.activeTasks.size < this.autonomyLevel.maxConcurrentTasks) {
        await this.processTaskQueue();
      }
    } catch (error) {
      console.error('[AutonomousAgent] Planning cycle error:', error);
    } finally {
      this.status.currentMode = 'idle';
      this.updateStatus();
    }
  }

  private async processTaskQueue(): Promise<void> {
    const availableSlots = this.autonomyLevel.maxConcurrentTasks - this.activeTasks.size;
    if (availableSlots <= 0 || this.taskQueue.length === 0) {
      return;
    }

    // Get highest priority tasks
    const tasksToExecute = this.taskQueue
      .filter(task => task.status === 'pending')
      .sort((a, b) => this.comparePriority(a.priority, b.priority))
      .slice(0, availableSlots);

    for (const task of tasksToExecute) {
      await this.executeTask(task);
    }
  }

  private async executeTask(task: Task): Promise<void> {
    // Safety check
    const safetyCheck = await this.safetySystem.validateTask(task, this.autonomyLevel);
    if (!safetyCheck.approved) {
      if (safetyCheck.requiresApproval) {
        task.status = 'blocked';
        this.emitNotification({
          type: 'warning',
          title: 'Task Requires Approval',
          message: `Task "${task.description}" requires human approval: ${safetyCheck.reason}`,
          actions: [
            { label: 'Approve', action: 'approve_task', parameters: { taskId: task.id } },
            { label: 'Reject', action: 'reject_task', parameters: { taskId: task.id } }
          ]
        });
        return;
      } else {
        task.status = 'failed';
        task.error = safetyCheck.reason;
        return;
      }
    }

    // Execute the task
    task.status = 'executing';
    this.activeTasks.set(task.id, task);
    this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
    
    try {
      const result = await this.taskExecutor.executeTask(task);
      await this.handleTaskCompletion(task, result);
    } catch (error) {
      await this.handleTaskFailure(task, error as Error);
    }
  }

  // Task Completion Handling
  private async handleTaskCompletion(task: Task, result: TaskResult): Promise<void> {
    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date();
    
    this.activeTasks.delete(task.id);

    // Record experience for learning
    const experience: Experience = {
      id: this.generateId(),
      taskId: task.id,
      goalId: task.goalId,
      context: JSON.stringify(task.context),
      actions: task.plan?.steps.map(s => s.action) || [],
      outcome: 'success',
      metrics: result.metrics,
      lessons: result.learnings?.map(l => l.pattern) || [],
      createdAt: new Date()
    };

    this.memory.experiences.push(experience);
    
    // Learn from the experience
    if (result.learnings) {
      for (const learning of result.learnings) {
        await this.memoryManager.recordLearning(learning);
      }
    }

    // Check if goal is completed
    await this.checkGoalCompletion(task.goalId);

    this.updateStatus();
    this.emitEvent('task_completed', { task, result });
  }

  private async handleTaskFailure(task: Task, error: Error): Promise<void> {
    task.status = 'failed';
    task.error = error.message;
    task.retryCount++;

    this.activeTasks.delete(task.id);

    // Determine if we should retry
    if (task.retryCount < task.maxRetries) {
      // Analyze failure and adjust approach
      const newPlan = await this.goalPlanner.replanTask(task, error, this.memory);
      if (newPlan) {
        task.plan = newPlan;
        task.status = 'pending';
        this.taskQueue.unshift(task); // Put at front of queue
      }
    } else {
      // Record failure experience
      const experience: Experience = {
        id: this.generateId(),
        taskId: task.id,
        goalId: task.goalId,
        context: JSON.stringify(task.context),
        actions: task.plan?.steps.map(s => s.action) || [],
        outcome: 'failure',
        metrics: {
          duration: Date.now() - (task.startedAt?.getTime() || 0),
          resourceUsage: { cpuTime: 0, memoryUsed: 0, filesModified: 0, commandsExecuted: 0, apiCalls: 0 },
          qualityScore: 0,
          impactScore: 0
        },
        lessons: [`Failed: ${error.message}`],
        createdAt: new Date()
      };

      this.memory.experiences.push(experience);
    }

    this.updateStatus();
    this.emitEvent('task_failed', { task, error });
  }

  // Utility Methods
  private async reprioritizeTasks(projectId: string): Promise<void> {
    // Use AI to re-evaluate task priorities based on current project state
    const projectContext = await this.environmentMonitor.getProjectContext(projectId);
    
    for (const task of this.taskQueue) {
      const newPriority = await this.goalPlanner.evaluateTaskPriority(task, projectContext, this.memory);
      if (newPriority !== task.priority) {
        task.priority = newPriority;
      }
    }
  }

  private async checkGoalCompletion(goalId: string): Promise<void> {
    const goal = this.activeGoals.get(goalId);
    if (!goal) return;

    const goalTasks = this.getAllTasksForGoal(goalId);
    const completedTasks = goalTasks.filter(t => t.status === 'completed');
    const failedTasks = goalTasks.filter(t => t.status === 'failed' && t.retryCount >= t.maxRetries);

    if (completedTasks.length + failedTasks.length === goalTasks.length) {
      // Goal is complete
      this.activeGoals.delete(goalId);
      
      if (failedTasks.length === 0) {
        this.emitEvent('goal_completed', { goal, success: true });
      } else {
        this.emitEvent('goal_completed', { goal, success: false, failedTasks });
      }
    }
  }

  private getAllTasksForGoal(goalId: string): Task[] {
    const allTasks = [
      ...Array.from(this.activeTasks.values()),
      ...this.taskQueue
    ];
    return allTasks.filter(task => task.goalId === goalId);
  }

  private shouldStartExecution(): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    if (this.autonomyLevel.workingHours) {
      const [startHour, startMin] = this.autonomyLevel.workingHours.start.split(':').map(Number);
      const [endHour, endMin] = this.autonomyLevel.workingHours.end.split(':').map(Number);
      const startTime = startHour * 100 + startMin;
      const endTime = endHour * 100 + endMin;
      
      if (currentTime < startTime || currentTime > endTime) {
        return false;
      }
    }

    return this.status.health.status === 'healthy' && this.isRunning;
  }

  private comparePriority(a: string, b: string): number {
    const priorities = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return priorities[b as keyof typeof priorities] - priorities[a as keyof typeof priorities];
  }

  private checkHealth(): void {
    // Implement health checks
    this.status.health.lastHealthCheck = new Date();
    // Add specific health check logic here
  }

  private updateStatus(): void {
    this.status.currentGoals = Array.from(this.activeGoals.values());
    this.status.activeTasks = Array.from(this.activeTasks.values());
    this.status.queuedTasks = this.taskQueue.filter(t => t.status === 'pending');
    this.status.lastActivity = new Date();
  }

  private emitEvent(type: string, data: any): void {
    const event: AgentEvent = {
      id: this.generateId(),
      type: type as any,
      data,
      timestamp: new Date()
    };
    this.emit('agent_event', event);
  }

  private emitNotification(notification: Omit<AgentNotification, 'id' | 'createdAt' | 'read'>): void {
    const fullNotification: AgentNotification = {
      id: this.generateId(),
      createdAt: new Date(),
      read: false,
      ...notification
    };
    this.emit('agent_notification', fullNotification);
  }

  private generateId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  public getStatus(): AutonomousAgentStatus {
    return { ...this.status };
  }

  public getMemory(): AgentMemory {
    return { ...this.memory };
  }

  public setAutonomyLevel(level: AutonomyLevel): void {
    this.autonomyLevel = level;
    this.status.autonomyLevel = level;
    this.updateStatus();
  }

  public async pauseTask(taskId: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'executing') {
      // Implement task pausing logic
      task.status = 'blocked';
      await this.taskExecutor.pauseTask(taskId);
      this.updateStatus();
    }
  }

  public async resumeTask(taskId: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'blocked') {
      task.status = 'pending';
      this.taskQueue.unshift(task);
      this.activeTasks.delete(taskId);
      this.updateStatus();
    }
  }

  public async handleEnvironmentChange(type: string, change: any): Promise<void> {
    // Respond to environment changes proactively
    console.log(`[AutonomousAgent] Environment change detected: ${type}`, change);
    
    // Analyze impact and potentially create new goals or adjust existing ones
    const impact = await this.goalPlanner.analyzeChangeImpact(change, this.activeGoals, this.memory);
    
    if (impact.requiresAction) {
      // Create reactive goals
      for (const actionNeeded of impact.recommendedActions) {
        await this.processGoal(actionNeeded.description, {
          priority: actionNeeded.priority,
          reactive: true,
          trigger: change
        });
      }
    }
  }

  private async handleBuildFailure(error: any): Promise<void> {
    // Proactively try to fix build failures
    await this.processGoal('Fix build failure', {
      priority: 'high',
      reactive: true,
      error: error.message,
      buildLogs: error.logs
    });
  }
}