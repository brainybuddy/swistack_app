import {
  Task,
  AutonomyLevel,
  Risk,
  RiskAssessment
} from '@swistack/shared';

interface SafetyCheck {
  approved: boolean;
  requiresApproval: boolean;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  restrictions: string[];
  recommendations: string[];
}

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'block' | 'warn' | 'approve';
}

export class SafetySystem {
  private securityRules: SecurityRule[];
  private dangerousPatterns: RegExp[];
  private approvalQueue: Map<string, Task> = new Map();

  constructor() {
    this.initializeSecurityRules();
    this.dangerousPatterns = [
      /rm\s+-rf\s+/i,
      /sudo\s+/i,
      /chmod\s+777/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /shell_exec\s*\(/i,
      /\$\{.*\}/i, // Template injection
      /process\.env\./i,
      /require\s*\(\s*['"]\.\./i, // Path traversal
    ];
  }

  /**
   * Validate if a task is safe to execute
   */
  async validateTask(task: Task, autonomyLevel: AutonomyLevel): Promise<SafetyCheck> {
    const checks: SafetyCheck[] = [];

    // Check task type permissions
    checks.push(await this.checkTaskPermissions(task, autonomyLevel));
    
    // Check for dangerous operations
    checks.push(await this.checkDangerousOperations(task));
    
    // Check file safety
    checks.push(await this.checkFileSafety(task));
    
    // Check command safety
    checks.push(await this.checkCommandSafety(task));
    
    // Check resource usage
    checks.push(await this.checkResourceUsage(task, autonomyLevel));

    // Aggregate results
    return this.aggregateChecks(checks);
  }

  /**
   * Validate file operations for safety
   */
  async validateFileOperation(
    operation: 'create' | 'modify' | 'delete',
    filePath: string,
    content?: string,
    autonomyLevel?: AutonomyLevel
  ): Promise<SafetyCheck> {
    const restrictions: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let requiresApproval = false;

    // Check file path safety
    if (this.isSystemPath(filePath)) {
      return {
        approved: false,
        requiresApproval: true,
        reason: 'Cannot modify system files',
        riskLevel: 'critical',
        restrictions: ['System file modification blocked'],
        recommendations: ['Use project-specific paths only']
      };
    }

    // Check for dangerous file extensions
    if (this.isDangerousFileType(filePath)) {
      riskLevel = 'high';
      requiresApproval = true;
      restrictions.push('Executable file modification requires approval');
    }

    // Check content safety
    if (content && operation !== 'delete') {
      const contentCheck = await this.checkContentSafety(content);
      if (contentCheck.riskLevel === 'critical') {
        return contentCheck;
      }
      
      if (contentCheck.riskLevel === 'high') {
        riskLevel = 'high';
        requiresApproval = true;
        restrictions.push(...contentCheck.restrictions);
        recommendations.push(...contentCheck.recommendations);
      }
    }

    // Check operation-specific rules
    switch (operation) {
      case 'delete':
        if (this.isCriticalFile(filePath)) {
          riskLevel = 'high';
          requiresApproval = true;
          restrictions.push('Critical file deletion requires approval');
          recommendations.push('Create backup before deletion');
        }
        break;
        
      case 'modify':
        if (this.isConfigurationFile(filePath)) {
          riskLevel = 'medium';
          recommendations.push('Validate configuration after modification');
        }
        break;
    }

    return {
      approved: !requiresApproval || (autonomyLevel?.level === 'fully_autonomous' && riskLevel !== 'critical'),
      requiresApproval,
      reason: requiresApproval ? 'High-risk file operation' : 'File operation approved',
      riskLevel,
      restrictions,
      recommendations
    };
  }

  /**
   * Validate command execution for safety
   */
  async validateCommand(command: string, autonomyLevel?: AutonomyLevel): Promise<SafetyCheck> {
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const restrictions: string[] = [];
    const recommendations: string[] = [];
    let requiresApproval = false;

    // Check against dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(command)) {
        riskLevel = 'critical';
        requiresApproval = true;
        restrictions.push(`Dangerous command pattern detected: ${pattern.source}`);
        recommendations.push('Use safer alternatives or request manual approval');
        break;
      }
    }

    // Check for network operations
    if (this.isNetworkCommand(command)) {
      riskLevel = 'medium';
      if (autonomyLevel?.level === 'supervised') {
        requiresApproval = true;
      }
      recommendations.push('Monitor network activity');
    }

    // Check for system modifications
    if (this.isSystemModificationCommand(command)) {
      riskLevel = 'high';
      requiresApproval = true;
      restrictions.push('System modification command');
      recommendations.push('Create system backup before execution');
    }

    // Check for package management
    if (this.isPackageManagementCommand(command)) {
      riskLevel = 'medium';
      if (autonomyLevel?.level === 'supervised') {
        requiresApproval = true;
      }
      recommendations.push('Verify package security before installation');
    }

    return {
      approved: !requiresApproval || (autonomyLevel?.level === 'fully_autonomous' && riskLevel !== 'critical'),
      requiresApproval,
      reason: requiresApproval ? 'High-risk command execution' : 'Command execution approved',
      riskLevel,
      restrictions,
      recommendations
    };
  }

  /**
   * Create safety checkpoint for rollback
   */
  async createCheckpoint(projectId: string): Promise<string> {
    const checkpointId = `checkpoint_${Date.now()}`;
    
    // In a real implementation, this would create a snapshot of the current state
    console.log(`[SafetySystem] Created checkpoint ${checkpointId} for project ${projectId}`);
    
    return checkpointId;
  }

  /**
   * Rollback to a safety checkpoint
   */
  async rollbackToCheckpoint(checkpointId: string, projectId: string): Promise<boolean> {
    try {
      // In a real implementation, this would restore the snapshot
      console.log(`[SafetySystem] Rolling back to checkpoint ${checkpointId} for project ${projectId}`);
      return true;
    } catch (error) {
      console.error('[SafetySystem] Rollback failed:', error);
      return false;
    }
  }

  // Private helper methods
  private initializeSecurityRules(): void {
    this.securityRules = [
      {
        id: 'no_arbitrary_code_execution',
        name: 'Prevent Arbitrary Code Execution',
        description: 'Block eval, exec, and similar dangerous functions',
        pattern: /(eval|exec|system|shell_exec)\s*\(/i,
        severity: 'critical',
        action: 'block'
      },
      {
        id: 'no_path_traversal',
        name: 'Prevent Path Traversal',
        description: 'Block attempts to access parent directories',
        pattern: /\.\.\//,
        severity: 'high',
        action: 'block'
      },
      {
        id: 'no_environment_exposure',
        name: 'Prevent Environment Variable Exposure',
        description: 'Warn when accessing environment variables',
        pattern: /process\.env\./i,
        severity: 'medium',
        action: 'warn'
      },
      {
        id: 'no_dangerous_file_operations',
        name: 'Prevent Dangerous File Operations',
        description: 'Block operations on system files',
        pattern: /(\/etc\/|\/usr\/|\/var\/|\/boot\/|\/sys\/)/i,
        severity: 'critical',
        action: 'block'
      }
    ];
  }

  private async checkTaskPermissions(task: Task, autonomyLevel: AutonomyLevel): Promise<SafetyCheck> {
    const taskAction = task.plan?.steps[0]?.action || task.type;
    
    // Check if the task type is permitted
    const permission = autonomyLevel.permissions.find(p => 
      p.action === taskAction || p.action === 'all'
    );
    
    if (!permission) {
      return {
        approved: false,
        requiresApproval: true,
        reason: `Task type '${taskAction}' not permitted`,
        riskLevel: 'high',
        restrictions: [`Task type '${taskAction}' blocked by autonomy level`],
        recommendations: ['Adjust autonomy level or request approval']
      };
    }

    // Check scope restrictions
    const taskScope = this.determineTaskScope(task);
    if (permission.scope.length > 0 && !permission.scope.includes(taskScope)) {
      return {
        approved: false,
        requiresApproval: true,
        reason: `Task scope '${taskScope}' not permitted`,
        riskLevel: 'medium',
        restrictions: [`Task scope '${taskScope}' blocked by permissions`],
        recommendations: ['Adjust task scope or permissions']
      };
    }

    return {
      approved: true,
      requiresApproval: false,
      reason: 'Task permissions validated',
      riskLevel: 'low',
      restrictions: [],
      recommendations: []
    };
  }

  private async checkDangerousOperations(task: Task): Promise<SafetyCheck> {
    const restrictions: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (task.plan) {
      for (const step of task.plan.steps) {
        // Check for dangerous actions
        if (step.action === 'delete_file' || step.action === 'run_command') {
          riskLevel = 'medium';
          recommendations.push(`Verify ${step.action} is necessary`);
        }

        // Check parameters for dangerous patterns
        const paramString = JSON.stringify(step.parameters);
        for (const rule of this.securityRules) {
          if (rule.pattern.test(paramString)) {
            if (rule.severity === 'critical') {
              riskLevel = 'critical';
              restrictions.push(`Blocked by rule: ${rule.name}`);
            } else {
              riskLevel = rule.severity as any;
              recommendations.push(`Warning: ${rule.description}`);
            }
          }
        }
      }
    }

    return {
      approved: riskLevel !== 'critical',
      requiresApproval: riskLevel === 'high' || riskLevel === 'critical',
      reason: riskLevel === 'critical' ? 'Dangerous operation detected' : 'Operation safety validated',
      riskLevel,
      restrictions,
      recommendations
    };
  }

  private async checkFileSafety(task: Task): Promise<SafetyCheck> {
    const restrictions: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (task.plan) {
      for (const step of task.plan.steps) {
        if (step.parameters?.filePath || step.parameters?.path) {
          const filePath = step.parameters.filePath || step.parameters.path;
          
          if (this.isSystemPath(filePath)) {
            riskLevel = 'critical';
            restrictions.push(`System path access blocked: ${filePath}`);
          } else if (this.isDangerousFileType(filePath)) {
            riskLevel = 'high';
            recommendations.push(`Executable file operation: ${filePath}`);
          }
        }
      }
    }

    return {
      approved: riskLevel !== 'critical',
      requiresApproval: riskLevel === 'high' || riskLevel === 'critical',
      reason: riskLevel === 'critical' ? 'Unsafe file operation' : 'File operations validated',
      riskLevel,
      restrictions,
      recommendations
    };
  }

  private async checkCommandSafety(task: Task): Promise<SafetyCheck> {
    const restrictions: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (task.plan) {
      for (const step of task.plan.steps) {
        if (step.action === 'run_command' && step.parameters?.command) {
          const commandCheck = await this.validateCommand(step.parameters.command);
          
          if (commandCheck.riskLevel === 'critical') {
            riskLevel = 'critical';
            restrictions.push(...commandCheck.restrictions);
          } else if (commandCheck.riskLevel === 'high') {
            riskLevel = 'high';
            recommendations.push(...commandCheck.recommendations);
          }
        }
      }
    }

    return {
      approved: riskLevel !== 'critical',
      requiresApproval: riskLevel === 'high' || riskLevel === 'critical',
      reason: riskLevel === 'critical' ? 'Unsafe command execution' : 'Command safety validated',
      riskLevel,
      restrictions,
      recommendations
    };
  }

  private async checkResourceUsage(task: Task, autonomyLevel: AutonomyLevel): Promise<SafetyCheck> {
    // Check if task might consume too many resources
    const estimatedDuration = task.plan?.estimatedDuration || 0;
    const maxDuration = 30 * 60 * 1000; // 30 minutes

    if (estimatedDuration > maxDuration) {
      return {
        approved: false,
        requiresApproval: true,
        reason: 'Task estimated duration exceeds limit',
        riskLevel: 'medium',
        restrictions: ['Long-running task requires approval'],
        recommendations: ['Break task into smaller parts']
      };
    }

    return {
      approved: true,
      requiresApproval: false,
      reason: 'Resource usage within limits',
      riskLevel: 'low',
      restrictions: [],
      recommendations: []
    };
  }

  private async checkContentSafety(content: string): Promise<SafetyCheck> {
    const restrictions: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for dangerous patterns in content
    for (const rule of this.securityRules) {
      if (rule.pattern.test(content)) {
        if (rule.severity === 'critical') {
          riskLevel = 'critical';
          restrictions.push(`Blocked by rule: ${rule.name}`);
        } else {
          riskLevel = rule.severity as any;
          recommendations.push(`Warning: ${rule.description}`);
        }
      }
    }

    // Check for secrets/credentials
    if (this.containsSecrets(content)) {
      riskLevel = 'high';
      restrictions.push('Content contains potential secrets');
      recommendations.push('Remove hardcoded credentials');
    }

    return {
      approved: riskLevel !== 'critical',
      requiresApproval: riskLevel === 'high' || riskLevel === 'critical',
      reason: riskLevel === 'critical' ? 'Unsafe content detected' : 'Content safety validated',
      riskLevel,
      restrictions,
      recommendations
    };
  }

  private aggregateChecks(checks: SafetyCheck[]): SafetyCheck {
    let approved = true;
    let requiresApproval = false;
    let highestRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const allRestrictions: string[] = [];
    const allRecommendations: string[] = [];
    const reasons: string[] = [];

    const riskLevels = ['low', 'medium', 'high', 'critical'];

    for (const check of checks) {
      if (!check.approved) {
        approved = false;
      }
      if (check.requiresApproval) {
        requiresApproval = true;
      }
      
      if (riskLevels.indexOf(check.riskLevel) > riskLevels.indexOf(highestRisk)) {
        highestRisk = check.riskLevel;
      }
      
      allRestrictions.push(...check.restrictions);
      allRecommendations.push(...check.recommendations);
      reasons.push(check.reason);
    }

    return {
      approved,
      requiresApproval,
      reason: reasons.filter(r => r !== 'Task permissions validated' && r !== 'Operation safety validated').join('; ') || 'All safety checks passed',
      riskLevel: highestRisk,
      restrictions: [...new Set(allRestrictions)],
      recommendations: [...new Set(allRecommendations)]
    };
  }

  private determineTaskScope(task: Task): string {
    // Determine the scope of a task based on its parameters
    if (task.plan?.steps.some(s => s.parameters?.filePath?.includes('package.json'))) {
      return 'dependencies';
    }
    if (task.plan?.steps.some(s => s.action === 'run_command')) {
      return 'system';
    }
    return 'project';
  }

  private isSystemPath(filePath: string): boolean {
    const systemPaths = ['/etc/', '/usr/', '/var/', '/boot/', '/sys/', '/proc/', '/dev/'];
    return systemPaths.some(path => filePath.startsWith(path));
  }

  private isDangerousFileType(filePath: string): boolean {
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.py', '.rb', '.php'];
    return dangerousExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  private isCriticalFile(filePath: string): boolean {
    const criticalFiles = ['package.json', 'tsconfig.json', '.env', 'docker-compose.yml', 'Dockerfile'];
    const fileName = filePath.split('/').pop() || '';
    return criticalFiles.includes(fileName);
  }

  private isConfigurationFile(filePath: string): boolean {
    const configExtensions = ['.json', '.yml', '.yaml', '.toml', '.ini', '.conf'];
    return configExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  private isNetworkCommand(command: string): boolean {
    const networkCommands = ['curl', 'wget', 'ssh', 'scp', 'ftp', 'ping', 'telnet'];
    return networkCommands.some(cmd => command.toLowerCase().includes(cmd));
  }

  private isSystemModificationCommand(command: string): boolean {
    const systemCommands = ['sudo', 'chmod', 'chown', 'mount', 'umount', 'systemctl'];
    return systemCommands.some(cmd => command.toLowerCase().includes(cmd));
  }

  private isPackageManagementCommand(command: string): boolean {
    const packageCommands = ['npm install', 'yarn add', 'pip install', 'apt install', 'yum install'];
    return packageCommands.some(cmd => command.toLowerCase().includes(cmd));
  }

  private containsSecrets(content: string): boolean {
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]+['"]/i,
      /[a-zA-Z0-9]{20,}/g, // Long alphanumeric strings that might be tokens
    ];
    
    return secretPatterns.some(pattern => pattern.test(content));
  }
}