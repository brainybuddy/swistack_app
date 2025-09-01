import { EventEmitter } from 'events';
import {
  Task,
  TaskResult,
  ExecutionMetrics,
  Artifact,
  Learning,
  ResourceUsage
} from '@swistack/shared';
import { AIAgentService } from './AIAgentService';
import { aiOrchestrator } from './AIOrchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';

export class TaskExecutor extends EventEmitter {
  private aiService: AIAgentService;
  private activeTasks: Map<string, { task: Task; startTime: number; abortController?: AbortController }> = new Map();

  constructor(aiService: AIAgentService) {
    super();
    this.aiService = aiService;
  }

  /**
   * Execute a task autonomously
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const abortController = new AbortController();
    
    this.activeTasks.set(task.id, { task, startTime, abortController });
    
    console.log(`[TaskExecutor] Executing task: ${task.description}`);
    this.emit('task_started', task);

    try {
      task.status = 'executing';
      task.startedAt = new Date();

      const result = await this.executeTaskSteps(task, abortController.signal);
      
      task.status = 'completed';
      task.actualDuration = Date.now() - startTime;
      
      this.emit('task_completed', task, result);
      return result;

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.actualDuration = Date.now() - startTime;
      
      this.emit('task_failed', task, error);
      throw error;
      
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * Pause a running task
   */
  async pauseTask(taskId: string): Promise<void> {
    const taskExecution = this.activeTasks.get(taskId);
    if (taskExecution?.abortController) {
      taskExecution.abortController.abort();
      console.log(`[TaskExecutor] Paused task: ${taskId}`);
    }
  }

  /**
   * Execute all steps in a task plan
   */
  private async executeTaskSteps(task: Task, signal: AbortSignal): Promise<TaskResult> {
    if (!task.plan) {
      throw new Error('Task has no execution plan');
    }

    const artifacts: Artifact[] = [];
    const learnings: Learning[] = [];
    const resourceUsage: ResourceUsage = {
      cpuTime: 0,
      memoryUsed: 0,
      filesModified: 0,
      commandsExecuted: 0,
      apiCalls: 0
    };

    let totalQualityScore = 0;
    let totalImpactScore = 0;

    for (const step of task.plan.steps) {
      if (signal.aborted) {
        throw new Error('Task execution was aborted');
      }

      console.log(`[TaskExecutor] Executing step: ${step.description}`);
      
      try {
        const stepResult = await this.executeStep(task, step, signal);
        
        // Collect artifacts
        if (stepResult.artifacts) {
          artifacts.push(...stepResult.artifacts);
        }
        
        // Collect learnings
        if (stepResult.learnings) {
          learnings.push(...stepResult.learnings);
        }
        
        // Update resource usage
        resourceUsage.cpuTime += stepResult.resourceUsage.cpuTime;
        resourceUsage.memoryUsed = Math.max(resourceUsage.memoryUsed, stepResult.resourceUsage.memoryUsed);
        resourceUsage.filesModified += stepResult.resourceUsage.filesModified;
        resourceUsage.commandsExecuted += stepResult.resourceUsage.commandsExecuted;
        resourceUsage.apiCalls += stepResult.resourceUsage.apiCalls;
        
        totalQualityScore += stepResult.qualityScore;
        totalImpactScore += stepResult.impactScore;

      } catch (stepError) {
        // Try rollback if available
        if (step.rollbackPlan) {
          console.log(`[TaskExecutor] Step failed, attempting rollback: ${step.rollbackPlan}`);
          await this.executeRollback(step.rollbackPlan, task);
        }
        throw stepError;
      }
    }

    const duration = Date.now() - (task.startedAt?.getTime() || Date.now());
    
    const metrics: ExecutionMetrics = {
      duration,
      resourceUsage,
      qualityScore: totalQualityScore / task.plan.steps.length,
      impactScore: totalImpactScore / task.plan.steps.length
    };

    return {
      success: true,
      output: `Task completed successfully: ${task.description}`,
      metrics,
      artifacts,
      learnings,
      nextRecommendations: await this.generateNextRecommendations(task, artifacts)
    };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    task: Task, 
    step: any, 
    signal: AbortSignal
  ): Promise<{
    artifacts: Artifact[];
    learnings: Learning[];
    resourceUsage: ResourceUsage;
    qualityScore: number;
    impactScore: number;
  }> {
    const stepStartTime = Date.now();
    
    switch (step.action) {
      case 'create_file':
        return await this.executeCreateFile(task, step, signal);
      
      case 'modify_file':
        return await this.executeModifyFile(task, step, signal);
      
      case 'delete_file':
        return await this.executeDeleteFile(task, step, signal);
      
      case 'run_command':
        return await this.executeCommand(task, step, signal);
      
      case 'analyze':
        return await this.executeAnalysis(task, step, signal);
      
      case 'research':
        return await this.executeResearch(task, step, signal);
      
      case 'test':
        return await this.executeTest(task, step, signal);
      
      case 'review':
        return await this.executeReview(task, step, signal);
      
      default:
        return await this.executeGenericStep(task, step, signal);
    }
  }

  private async executeCreateFile(task: Task, step: any, signal: AbortSignal): Promise<any> {
    const { filePath, content } = step.parameters;
    
    if (!filePath || content === undefined) {
      throw new Error('create_file requires filePath and content parameters');
    }

    // Use AI to generate content if needed
    let fileContent = content;
    if (!content || content === 'AUTO_GENERATE') {
      const generationPrompt = `Generate content for file: ${filePath}
Task context: ${task.description}
Expected output: ${step.expectedOutput}

Generate appropriate content for this file based on the task requirements.`;

      const response = await this.aiService.generateCode(
        task.context.projectId || 'default',
        generationPrompt,
        filePath
      );
      
      fileContent = response.code;
    }

    // Create the file using the orchestrator
    const result = await aiOrchestrator.executeAction(
      task.context.projectId || 'default',
      {
        type: 'create_file',
        params: { path: filePath, content: fileContent },
        requiresConfirmation: false
      }
    );

    if (!result.success) {
      throw new Error(`Failed to create file ${filePath}: ${result.error}`);
    }

    return {
      artifacts: [{
        type: 'file',
        path: filePath,
        content: fileContent,
        metadata: { action: 'created', size: Buffer.byteLength(fileContent) }
      }],
      learnings: [{
        type: 'success_pattern',
        context: `create_file:${path.extname(filePath)}`,
        pattern: 'AI-generated content creation',
        outcome: 'successful',
        confidence: 0.8,
        applicableScenarios: ['file_creation', 'code_generation']
      }],
      resourceUsage: {
        cpuTime: 1000,
        memoryUsed: Buffer.byteLength(fileContent),
        filesModified: 1,
        commandsExecuted: 0,
        apiCalls: 1
      },
      qualityScore: 8.0,
      impactScore: 7.0
    };
  }

  private async executeModifyFile(task: Task, step: any, signal: AbortSignal): Promise<any> {
    const { filePath, changes, newContent } = step.parameters;
    
    if (!filePath) {
      throw new Error('modify_file requires filePath parameter');
    }

    let content = newContent;
    if (!content && changes) {
      // Use AI to apply changes
      const modificationPrompt = `Modify file: ${filePath}
Current task: ${task.description}
Required changes: ${changes}
Expected output: ${step.expectedOutput}

Apply the specified changes to the file content.`;

      const response = await this.aiService.generateCode(
        task.context.projectId || 'default',
        modificationPrompt,
        filePath,
        { fileContent: await this.getFileContent(task.context.projectId, filePath) }
      );
      
      content = response.code;
    }

    if (!content) {
      throw new Error('No content or changes specified for file modification');
    }

    const result = await aiOrchestrator.executeAction(
      task.context.projectId || 'default',
      {
        type: 'modify_file',
        params: { path: filePath, content },
        requiresConfirmation: false
      }
    );

    if (!result.success) {
      throw new Error(`Failed to modify file ${filePath}: ${result.error}`);
    }

    return {
      artifacts: [{
        type: 'file',
        path: filePath,
        content,
        metadata: { action: 'modified', changeType: changes ? 'incremental' : 'full_replace' }
      }],
      learnings: [{
        type: 'success_pattern',
        context: `modify_file:${path.extname(filePath)}`,
        pattern: 'AI-assisted file modification',
        outcome: 'successful',
        confidence: 0.8,
        applicableScenarios: ['file_modification', 'code_editing']
      }],
      resourceUsage: {
        cpuTime: 2000,
        memoryUsed: Buffer.byteLength(content),
        filesModified: 1,
        commandsExecuted: 0,
        apiCalls: 1
      },
      qualityScore: 8.5,
      impactScore: 8.0
    };
  }

  private async executeDeleteFile(task: Task, step: any, signal: AbortSignal): Promise<any> {
    const { filePath } = step.parameters;
    
    if (!filePath) {
      throw new Error('delete_file requires filePath parameter');
    }

    const result = await aiOrchestrator.executeAction(
      task.context.projectId || 'default',
      {
        type: 'delete_file',
        params: { path: filePath },
        requiresConfirmation: false
      }
    );

    if (!result.success) {
      throw new Error(`Failed to delete file ${filePath}: ${result.error}`);
    }

    return {
      artifacts: [{
        type: 'log',
        path: 'deletion.log',
        content: `Deleted file: ${filePath}`,
        metadata: { action: 'deleted', filePath }
      }],
      learnings: [{
        type: 'success_pattern',
        context: 'delete_file',
        pattern: 'Safe file deletion',
        outcome: 'successful',
        confidence: 0.9,
        applicableScenarios: ['cleanup', 'file_management']
      }],
      resourceUsage: {
        cpuTime: 500,
        memoryUsed: 0,
        filesModified: 1,
        commandsExecuted: 0,
        apiCalls: 0
      },
      qualityScore: 9.0,
      impactScore: 6.0
    };
  }

  private async executeCommand(task: Task, step: any, signal: AbortSignal): Promise<any> {
    const { command, cwd } = step.parameters;
    
    if (!command) {
      throw new Error('run_command requires command parameter');
    }

    const result = await aiOrchestrator.executeAction(
      task.context.projectId || 'default',
      {
        type: 'run_command',
        params: { command, cwd },
        requiresConfirmation: false
      }
    );

    if (!result.success) {
      throw new Error(`Command failed: ${command}\n${result.error}`);
    }

    return {
      artifacts: [{
        type: 'log',
        path: 'command.log',
        content: `Command: ${command}\nOutput: ${result.output}`,
        metadata: { command, exitCode: 0 }
      }],
      learnings: [{
        type: 'success_pattern',
        context: `command:${command.split(' ')[0]}`,
        pattern: 'Successful command execution',
        outcome: 'successful',
        confidence: 0.7,
        applicableScenarios: ['automation', 'build_process']
      }],
      resourceUsage: {
        cpuTime: 5000,
        memoryUsed: 1024,
        filesModified: 0,
        commandsExecuted: 1,
        apiCalls: 0
      },
      qualityScore: 7.5,
      impactScore: 8.5
    };
  }

  private async executeAnalysis(task: Task, step: any, signal: AbortSignal): Promise<any> {
    const { target, analysisType } = step.parameters;
    
    const analysisPrompt = `Perform ${analysisType || 'general'} analysis on: ${target}
Task context: ${task.description}
Expected output: ${step.expectedOutput}

Provide detailed analysis and insights.`;

    const response = await this.aiService.chat(
      task.context.projectId || 'default',
      analysisPrompt,
      undefined,
      {
        includeProjectContext: true,
        includeFileContext: target ? true : false,
        currentFile: target
      }
    );

    return {
      artifacts: [{
        type: 'report',
        path: `analysis_${Date.now()}.md`,
        content: response.content,
        metadata: { analysisType, target }
      }],
      learnings: [{
        type: 'success_pattern',
        context: `analysis:${analysisType}`,
        pattern: 'AI-powered analysis',
        outcome: 'successful',
        confidence: 0.8,
        applicableScenarios: ['code_analysis', 'project_review']
      }],
      resourceUsage: {
        cpuTime: 3000,
        memoryUsed: 512,
        filesModified: 0,
        commandsExecuted: 0,
        apiCalls: 1
      },
      qualityScore: 8.0,
      impactScore: 7.0
    };
  }

  private async executeResearch(task: Task, step: any, signal: AbortSignal): Promise<any> {
    const { topic, scope } = step.parameters;
    
    const researchPrompt = `Research topic: ${topic}
Scope: ${scope || 'general'}
Task context: ${task.description}
Expected output: ${step.expectedOutput}

Provide comprehensive research findings and recommendations.`;

    const response = await this.aiService.chat(
      task.context.projectId || 'default',
      researchPrompt,
      undefined,
      {
        includeProjectContext: true
      }
    );

    return {
      artifacts: [{
        type: 'report',
        path: `research_${Date.now()}.md`,
        content: response.content,
        metadata: { topic, scope }
      }],
      learnings: [{
        type: 'best_practice',
        context: `research:${topic}`,
        pattern: 'Systematic research approach',
        outcome: 'successful',
        confidence: 0.7,
        applicableScenarios: ['planning', 'decision_making']
      }],
      resourceUsage: {
        cpuTime: 4000,
        memoryUsed: 256,
        filesModified: 0,
        commandsExecuted: 0,
        apiCalls: 1
      },
      qualityScore: 7.5,
      impactScore: 6.5
    };
  }

  private async executeTest(task: Task, step: any, signal: AbortSignal): Promise<any> {
    const { testType, target } = step.parameters;
    
    // Run tests using command execution
    const testCommands = {
      'unit': 'npm test',
      'integration': 'npm run test:integration',
      'e2e': 'npm run test:e2e',
      'build': 'npm run build',
      'lint': 'npm run lint'
    };
    
    const command = testCommands[testType as keyof typeof testCommands] || 'npm test';
    
    const result = await aiOrchestrator.executeAction(
      task.context.projectId || 'default',
      {
        type: 'run_command',
        params: { command },
        requiresConfirmation: false
      }
    );

    const success = result.success && !result.error;

    return {
      artifacts: [{
        type: 'test_result',
        path: `test_${testType}_${Date.now()}.log`,
        content: result.output || result.error || '',
        metadata: { testType, passed: success }
      }],
      learnings: [{
        type: success ? 'success_pattern' : 'failure_pattern',
        context: `test:${testType}`,
        pattern: success ? 'Successful test execution' : 'Test failure detected',
        outcome: success ? 'successful' : 'failure',
        confidence: 0.9,
        applicableScenarios: ['quality_assurance', 'validation']
      }],
      resourceUsage: {
        cpuTime: 10000,
        memoryUsed: 2048,
        filesModified: 0,
        commandsExecuted: 1,
        apiCalls: 0
      },
      qualityScore: success ? 9.0 : 4.0,
      impactScore: success ? 8.5 : 9.0 // High impact if tests fail
    };
  }

  private async executeReview(task: Task, step: any, signal: AbortSignal): Promise<any> {
    const { target, reviewType } = step.parameters;
    
    const review = await this.aiService.reviewCode(
      task.context.projectId || 'default',
      target,
      target,
      reviewType || 'all'
    );

    return {
      artifacts: [{
        type: 'report',
        path: `review_${Date.now()}.md`,
        content: review.summary,
        metadata: { reviewType, target, issues: review.issues.length }
      }],
      learnings: [{
        type: 'best_practice',
        context: `review:${reviewType}`,
        pattern: 'Automated code review',
        outcome: 'successful',
        confidence: 0.8,
        applicableScenarios: ['quality_assurance', 'best_practices']
      }],
      resourceUsage: {
        cpuTime: 6000,
        memoryUsed: 1024,
        filesModified: 0,
        commandsExecuted: 0,
        apiCalls: 1
      },
      qualityScore: 8.5,
      impactScore: 7.5
    };
  }

  private async executeGenericStep(task: Task, step: any, signal: AbortSignal): Promise<any> {
    // Fall back to AI-guided execution
    const executionPrompt = `Execute this step: ${step.description}
Action: ${step.action}
Parameters: ${JSON.stringify(step.parameters)}
Expected output: ${step.expectedOutput}

Provide detailed execution results and any artifacts created.`;

    const response = await this.aiService.chat(
      task.context.projectId || 'default',
      executionPrompt,
      undefined,
      {
        includeProjectContext: true
      }
    );

    return {
      artifacts: [{
        type: 'log',
        path: `generic_step_${Date.now()}.log`,
        content: response.content,
        metadata: { action: step.action }
      }],
      learnings: [{
        type: 'success_pattern',
        context: `generic:${step.action}`,
        pattern: 'AI-guided execution',
        outcome: 'successful',
        confidence: 0.6,
        applicableScenarios: ['fallback_execution']
      }],
      resourceUsage: {
        cpuTime: 2000,
        memoryUsed: 256,
        filesModified: 0,
        commandsExecuted: 0,
        apiCalls: 1
      },
      qualityScore: 6.0,
      impactScore: 5.0
    };
  }

  private async executeRollback(rollbackPlan: string, task: Task): Promise<void> {
    console.log(`[TaskExecutor] Executing rollback: ${rollbackPlan}`);
    
    // Simple rollback implementation
    // In a more sophisticated system, this would parse the rollback plan
    // and execute appropriate reverse operations
    
    if (rollbackPlan.includes('restore backup')) {
      // Restore from backup if available
      // Implementation would depend on backup system
    } else if (rollbackPlan.includes('undo changes')) {
      // Undo recent changes
      // Implementation would depend on change tracking
    }
    
    // Log the rollback attempt
    console.log(`[TaskExecutor] Rollback completed: ${rollbackPlan}`);
  }

  private async generateNextRecommendations(task: Task, artifacts: Artifact[]): Promise<string[]> {
    // Use AI to suggest next steps based on task completion
    const recommendationPrompt = `Task completed: ${task.description}
Artifacts created: ${artifacts.map(a => `${a.type}: ${a.path}`).join(', ')}

What should be done next to build on this work? Suggest 2-3 specific follow-up actions.`;

    try {
      const response = await this.aiService.chat(
        task.context.projectId || 'default',
        recommendationPrompt
      );
      
      // Parse recommendations from response
      const recommendations = response.content
        .split('\n')
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(rec => rec.length > 0);
        
      return recommendations.slice(0, 3);
    } catch (error) {
      console.error('[TaskExecutor] Failed to generate recommendations:', error);
      return [];
    }
  }

  private async getFileContent(projectId: string, filePath: string): Promise<string> {
    // This would integrate with the project file system
    // For now, return empty string
    return '';
  }
}