import {
  Goal,
  Task,
  TaskPlan,
  PlanStep,
  AgentMemory,
  Pattern,
  RiskAssessment,
  Risk,
  Mitigation
} from '@swistack/shared';
import { AIAgentService } from './AIAgentService';

export class GoalPlanner {
  private aiService: AIAgentService;

  constructor(aiService: AIAgentService) {
    this.aiService = aiService;
  }

  /**
   * Plan how to achieve a goal by breaking it down into tasks
   */
  async planGoal(goal: Goal, memory: AgentMemory): Promise<TaskPlan> {
    console.log(`[GoalPlanner] Planning goal: ${goal.description}`);

    // Find relevant patterns from memory
    const relevantPatterns = this.findRelevantPatterns(goal, memory);
    
    // Use AI to create a plan
    const planningPrompt = this.buildPlanningPrompt(goal, relevantPatterns, memory);
    
    const response = await this.aiService.chat(
      goal.context.projectId || 'default',
      planningPrompt,
      undefined,
      {
        includeProjectContext: true,
        includeFileContext: true
      }
    );

    // Parse the AI response into a structured plan
    const plan = this.parsePlanFromResponse(response.content, goal);
    
    // Assess risks
    plan.riskAssessment = await this.assessRisks(plan, goal, memory);
    
    return plan;
  }

  /**
   * Create specific tasks from a goal plan
   */
  async createTasks(goal: Goal, plan: TaskPlan): Promise<Task[]> {
    const tasks: Task[] = [];

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const task: Task = {
        id: this.generateId(),
        goalId: goal.id,
        description: step.description,
        type: this.inferTaskType(step.action),
        status: 'pending',
        priority: this.calculateStepPriority(step, goal.priority, i),
        dependencies: this.extractDependencies(step, tasks),
        retryCount: 0,
        maxRetries: 3,
        context: {
          ...goal.context,
          stepId: step.id,
          stepAction: step.action,
          stepParameters: step.parameters
        },
        plan: {
          id: this.generateId(),
          taskId: '', // Will be set after task creation
          steps: [step],
          estimatedDuration: this.estimateStepDuration(step),
          riskAssessment: {
            riskLevel: 'low',
            risks: [],
            mitigations: []
          },
          createdAt: new Date()
        },
        createdAt: new Date()
      };

      task.plan!.taskId = task.id;
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Replan a failed task with new approach
   */
  async replanTask(task: Task, error: Error, memory: AgentMemory): Promise<TaskPlan | null> {
    console.log(`[GoalPlanner] Replanning failed task: ${task.description}`);

    // Analyze failure
    const failureAnalysis = await this.analyzeFailure(task, error, memory);
    
    if (!failureAnalysis.canReplan) {
      return null;
    }

    // Find alternative approaches from memory
    const alternatives = this.findAlternativeApproaches(task, memory);
    
    // Create new plan with alternative approach
    const replanPrompt = this.buildReplanPrompt(task, error, alternatives, failureAnalysis);
    
    const response = await this.aiService.chat(
      task.context.projectId || 'default',
      replanPrompt,
      undefined,
      {
        includeProjectContext: true,
        includeFileContext: true
      }
    );

    const newPlan = this.parsePlanFromResponse(response.content, task);
    newPlan.riskAssessment = await this.assessRisks(newPlan, task, memory);

    return newPlan;
  }

  /**
   * Re-evaluate task priority based on current context
   */
  async evaluateTaskPriority(
    task: Task, 
    projectContext: any, 
    memory: AgentMemory
  ): Promise<'low' | 'medium' | 'high' | 'critical'> {
    // Use AI to evaluate current priority
    const evaluationPrompt = `
Given the current project context and task details, evaluate the priority of this task:

Task: ${task.description}
Current Priority: ${task.priority}
Type: ${task.type}
Context: ${JSON.stringify(task.context, null, 2)}

Project Context:
${JSON.stringify(projectContext, null, 2)}

Consider:
1. Blocking dependencies for other tasks
2. Impact on project goals
3. Time sensitivity
4. Resource availability
5. Risk of delay

Return only one of: low, medium, high, critical
`;

    const response = await this.aiService.chat(
      task.context.projectId || 'default',
      evaluationPrompt
    );

    const priority = response.content.toLowerCase().trim();
    if (['low', 'medium', 'high', 'critical'].includes(priority)) {
      return priority as any;
    }

    return task.priority;
  }

  /**
   * Analyze the impact of environment changes
   */
  async analyzeChangeImpact(
    change: any, 
    activeGoals: Map<string, Goal>, 
    memory: AgentMemory
  ): Promise<{
    requiresAction: boolean;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    affectedGoals: string[];
    recommendedActions: Array<{
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      reasoning: string;
    }>;
  }> {
    const impactPrompt = `
Analyze this environment change and determine if autonomous action is needed:

Change Type: ${change.type}
Change Details: ${JSON.stringify(change, null, 2)}

Active Goals:
${Array.from(activeGoals.values()).map(g => `- ${g.description} (${g.priority})`).join('\n')}

Determine:
1. Does this change require immediate action?
2. What is the impact level?
3. Which goals are affected?
4. What actions should be taken?

Response format:
{
  "requiresAction": boolean,
  "impactLevel": "low|medium|high|critical",
  "affectedGoals": ["goal1", "goal2"],
  "recommendedActions": [
    {
      "description": "action description",
      "priority": "low|medium|high|critical",
      "reasoning": "why this action is needed"
    }
  ]
}
`;

    const response = await this.aiService.chat('default', impactPrompt);
    
    try {
      return JSON.parse(response.content);
    } catch (error) {
      return {
        requiresAction: false,
        impactLevel: 'low',
        affectedGoals: [],
        recommendedActions: []
      };
    }
  }

  // Private helper methods
  private findRelevantPatterns(goal: Goal, memory: AgentMemory): Pattern[] {
    // Simple keyword matching for now - could be improved with embeddings
    const goalWords = goal.description.toLowerCase().split(' ');
    
    return memory.patterns.filter(pattern => {
      const patternWords = pattern.description.toLowerCase().split(' ');
      const intersection = goalWords.filter(word => patternWords.includes(word));
      return intersection.length > 0;
    }).slice(0, 5); // Top 5 most relevant
  }

  private buildPlanningPrompt(goal: Goal, patterns: Pattern[], memory: AgentMemory): string {
    return `
You are an autonomous coding agent planning how to achieve a goal. Break down the goal into actionable steps.

GOAL: ${goal.description}
Priority: ${goal.priority}
Context: ${JSON.stringify(goal.context, null, 2)}

RELEVANT PATTERNS FROM PAST EXPERIENCE:
${patterns.map(p => `- ${p.name}: ${p.description} (Success rate: ${p.successRate}%)`).join('\n')}

CONSTRAINTS:
${goal.constraints?.join('\n') || 'None specified'}

Create a step-by-step plan with the following format:

PLAN:
1. [Action Type] Description
   - Parameters: {key: value}
   - Expected Output: description
   - Validation: how to verify success
   - Rollback: what to do if it fails

2. [Action Type] Description
   - Parameters: {key: value}
   - Expected Output: description
   - Validation: how to verify success
   - Rollback: what to do if it fails

Action Types: analyze, create_file, modify_file, delete_file, run_command, test, research, review

Be specific and include all necessary details for autonomous execution.
`;
  }

  private buildReplanPrompt(task: Task, error: Error, alternatives: Pattern[], analysis: any): string {
    return `
A task has failed and needs to be replanned with a different approach.

FAILED TASK: ${task.description}
Error: ${error.message}
Previous Approach: ${JSON.stringify(task.plan?.steps, null, 2)}

FAILURE ANALYSIS:
${JSON.stringify(analysis, null, 2)}

ALTERNATIVE APPROACHES:
${alternatives.map(a => `- ${a.name}: ${a.description}`).join('\n')}

Create a new plan that:
1. Avoids the previous failure mode
2. Uses a different approach
3. Has better error handling
4. Includes validation steps

Use the same format as before but with a different strategy.
`;
  }

  private parsePlanFromResponse(content: string, goal: Goal | Task): TaskPlan {
    // Parse the AI response into structured steps
    const steps: PlanStep[] = [];
    const lines = content.split('\n');
    
    let currentStep: Partial<PlanStep> | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if this is a new step
      const stepMatch = trimmed.match(/^(\d+)\.\s*\[([^\]]+)\]\s*(.+)/);
      if (stepMatch) {
        // Save previous step
        if (currentStep && currentStep.description) {
          steps.push({
            id: this.generateId(),
            description: currentStep.description,
            action: currentStep.action || 'unknown',
            parameters: currentStep.parameters || {},
            expectedOutput: currentStep.expectedOutput || '',
            validationCriteria: currentStep.validationCriteria || [],
            rollbackPlan: currentStep.rollbackPlan
          });
        }
        
        // Start new step
        currentStep = {
          action: stepMatch[2].toLowerCase().replace(/\s+/g, '_'),
          description: stepMatch[3]
        };
      } else if (currentStep) {
        // Parse step details
        if (trimmed.startsWith('- Parameters:')) {
          try {
            const paramStr = trimmed.substring(13).trim();
            currentStep.parameters = JSON.parse(paramStr);
          } catch (e) {
            currentStep.parameters = {};
          }
        } else if (trimmed.startsWith('- Expected Output:')) {
          currentStep.expectedOutput = trimmed.substring(18).trim();
        } else if (trimmed.startsWith('- Validation:')) {
          currentStep.validationCriteria = [trimmed.substring(13).trim()];
        } else if (trimmed.startsWith('- Rollback:')) {
          currentStep.rollbackPlan = trimmed.substring(11).trim();
        }
      }
    }
    
    // Save last step
    if (currentStep && currentStep.description) {
      steps.push({
        id: this.generateId(),
        description: currentStep.description,
        action: currentStep.action || 'unknown',
        parameters: currentStep.parameters || {},
        expectedOutput: currentStep.expectedOutput || '',
        validationCriteria: currentStep.validationCriteria || [],
        rollbackPlan: currentStep.rollbackPlan
      });
    }

    return {
      id: this.generateId(),
      taskId: '', // Will be set by caller
      steps,
      estimatedDuration: steps.length * 300000, // 5 minutes per step
      riskAssessment: {
        riskLevel: 'medium',
        risks: [],
        mitigations: []
      },
      createdAt: new Date()
    };
  }

  private async assessRisks(plan: TaskPlan, goal: Goal | Task, memory: AgentMemory): Promise<RiskAssessment> {
    // Analyze each step for potential risks
    const risks: Risk[] = [];
    
    for (const step of plan.steps) {
      // Check for destructive operations
      if (step.action.includes('delete') || step.action.includes('remove')) {
        risks.push({
          type: 'data_loss',
          description: `Step "${step.description}" involves deletion`,
          probability: 0.3,
          impact: 8,
          severity: 0.3 * 8
        });
      }
      
      // Check for external dependencies
      if (step.action.includes('command') || step.action.includes('install')) {
        risks.push({
          type: 'compatibility',
          description: `Step "${step.description}" depends on external systems`,
          probability: 0.2,
          impact: 6,
          severity: 0.2 * 6
        });
      }
      
      // Check for complex modifications
      if (step.action.includes('modify') && step.parameters?.complexity === 'high') {
        risks.push({
          type: 'breaking_change',
          description: `Complex modification in "${step.description}"`,
          probability: 0.4,
          impact: 7,
          severity: 0.4 * 7
        });
      }
    }

    // Generate mitigations
    const mitigations: Mitigation[] = risks.map(risk => ({
      riskType: risk.type,
      strategy: this.generateMitigationStrategy(risk),
      implementation: this.generateMitigationImplementation(risk),
      cost: this.calculateMitigationCost(risk)
    }));

    // Calculate overall risk level
    const maxSeverity = Math.max(...risks.map(r => r.severity), 0);
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    
    if (maxSeverity < 2) riskLevel = 'low';
    else if (maxSeverity < 5) riskLevel = 'medium';
    else if (maxSeverity < 8) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      riskLevel,
      risks,
      mitigations
    };
  }

  private generateMitigationStrategy(risk: Risk): string {
    switch (risk.type) {
      case 'data_loss':
        return 'Create backup before operation';
      case 'breaking_change':
        return 'Implement gradual rollout with validation';
      case 'security':
        return 'Add security validation and approval gates';
      case 'performance':
        return 'Monitor performance metrics during execution';
      case 'compatibility':
        return 'Test in isolated environment first';
      default:
        return 'Monitor and validate during execution';
    }
  }

  private generateMitigationImplementation(risk: Risk): string {
    switch (risk.type) {
      case 'data_loss':
        return 'Automatic file backup to .backup directory';
      case 'breaking_change':
        return 'Run tests after each modification';
      case 'security':
        return 'Require explicit approval for security-sensitive operations';
      case 'performance':
        return 'Set performance thresholds and alerts';
      case 'compatibility':
        return 'Use dependency validation before execution';
      default:
        return 'Add validation checkpoints';
    }
  }

  private calculateMitigationCost(risk: Risk): number {
    // Cost in additional time (seconds)
    return risk.severity * 60; // 1 minute per severity point
  }

  private inferTaskType(action: string): Task['type'] {
    if (action.includes('file')) return 'file_operation';
    if (action.includes('test')) return 'testing';
    if (action.includes('command')) return 'command';
    if (action.includes('research') || action.includes('analyze')) return 'research';
    return 'analysis';
  }

  private calculateStepPriority(step: PlanStep, goalPriority: string, stepIndex: number): Task['priority'] {
    // Steps early in the plan are generally higher priority
    if (stepIndex === 0) return goalPriority as Task['priority'];
    if (stepIndex === 1 && goalPriority === 'critical') return 'high';
    if (stepIndex === 1 && goalPriority === 'high') return 'medium';
    return 'medium';
  }

  private extractDependencies(step: PlanStep, existingTasks: Task[]): string[] {
    // Simple dependency extraction - could be more sophisticated
    const dependencies: string[] = [];
    
    // If this step modifies a file, it depends on any step that creates it
    if (step.action.includes('modify') && step.parameters?.filePath) {
      const filePath = step.parameters.filePath;
      for (const task of existingTasks) {
        if (task.plan?.steps.some(s => 
          s.action.includes('create') && 
          s.parameters?.filePath === filePath
        )) {
          dependencies.push(task.id);
        }
      }
    }
    
    return dependencies;
  }

  private estimateStepDuration(step: PlanStep): number {
    // Estimate duration in milliseconds
    const baseDuration = {
      'create_file': 30000,   // 30 seconds
      'modify_file': 60000,   // 1 minute
      'delete_file': 10000,   // 10 seconds
      'run_command': 120000,  // 2 minutes
      'analyze': 90000,       // 1.5 minutes
      'research': 180000,     // 3 minutes
      'test': 300000          // 5 minutes
    };
    
    return baseDuration[step.action as keyof typeof baseDuration] || 60000;
  }

  private async analyzeFailure(task: Task, error: Error, memory: AgentMemory): Promise<any> {
    // Analyze why the task failed and if it can be replanned
    const similarFailures = memory.experiences.filter(exp => 
      exp.outcome === 'failure' && 
      exp.lessons.some(lesson => lesson.includes(error.message.substring(0, 50)))
    );

    return {
      canReplan: task.retryCount < task.maxRetries,
      errorType: this.categorizeError(error),
      similarFailures: similarFailures.length,
      suggestedApproach: similarFailures.length > 0 ? 'alternative' : 'retry'
    };
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    if (message.includes('permission')) return 'permission';
    if (message.includes('not found')) return 'resource_missing';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network')) return 'network';
    if (message.includes('syntax')) return 'syntax';
    return 'unknown';
  }

  private findAlternativeApproaches(task: Task, memory: AgentMemory): Pattern[] {
    // Find patterns that could be used as alternatives
    return memory.patterns.filter(pattern => 
      pattern.type === 'problem_solution' && 
      pattern.context.some(ctx => 
        task.description.toLowerCase().includes(ctx.toLowerCase())
      )
    ).slice(0, 3);
  }

  private generateId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}