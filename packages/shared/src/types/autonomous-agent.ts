// Autonomous Agent Types
export interface Goal {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  constraints?: string[];
  expectedOutcome?: string;
  deadline?: Date;
  createdAt: Date;
}

export interface Task {
  id: string;
  goalId: string;
  description: string;
  type: 'file_operation' | 'analysis' | 'testing' | 'command' | 'research';
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  retryCount: number;
  maxRetries: number;
  context: Record<string, any>;
  plan?: TaskPlan;
  result?: TaskResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TaskPlan {
  id: string;
  taskId: string;
  steps: PlanStep[];
  estimatedDuration: number;
  riskAssessment: RiskAssessment;
  fallbackPlan?: TaskPlan;
  createdAt: Date;
}

export interface PlanStep {
  id: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  expectedOutput: string;
  validationCriteria: string[];
  rollbackPlan?: string;
}

export interface TaskResult {
  success: boolean;
  output: any;
  metrics: ExecutionMetrics;
  artifacts: Artifact[];
  learnings: Learning[];
  nextRecommendations?: string[];
}

export interface ExecutionMetrics {
  duration: number;
  resourceUsage: ResourceUsage;
  qualityScore: number;
  impactScore: number;
}

export interface ResourceUsage {
  cpuTime: number;
  memoryUsed: number;
  filesModified: number;
  commandsExecuted: number;
  apiCalls: number;
}

export interface Artifact {
  type: 'file' | 'log' | 'report' | 'test_result' | 'metrics';
  path: string;
  content?: string;
  metadata: Record<string, any>;
}

export interface Learning {
  type: 'success_pattern' | 'failure_pattern' | 'optimization' | 'best_practice';
  context: string;
  pattern: string;
  outcome: string;
  confidence: number;
  applicableScenarios: string[];
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
  mitigations: Mitigation[];
}

export interface Risk {
  type: 'data_loss' | 'breaking_change' | 'security' | 'performance' | 'compatibility';
  description: string;
  probability: number;
  impact: number;
  severity: number;
}

export interface Mitigation {
  riskType: string;
  strategy: string;
  implementation: string;
  cost: number;
}

// Agent Memory and Learning
export interface AgentMemory {
  patterns: Pattern[];
  experiences: Experience[];
  knowledge: KnowledgeItem[];
  projectSpecifics: ProjectKnowledge[];
}

export interface Pattern {
  id: string;
  type: 'code_pattern' | 'problem_solution' | 'architecture_pattern' | 'workflow_pattern';
  name: string;
  description: string;
  template: string;
  context: string[];
  successRate: number;
  usageCount: number;
  lastUsed: Date;
  embedding?: number[];
}

export interface Experience {
  id: string;
  taskId: string;
  goalId: string;
  context: string;
  actions: string[];
  outcome: 'success' | 'failure' | 'partial';
  metrics: ExecutionMetrics;
  lessons: string[];
  createdAt: Date;
}

export interface KnowledgeItem {
  id: string;
  topic: string;
  content: string;
  sources: string[];
  confidence: number;
  lastUpdated: Date;
  tags: string[];
  embedding?: number[];
}

export interface ProjectKnowledge {
  projectId: string;
  architecture: string;
  techStack: string[];
  conventions: Convention[];
  commonPatterns: string[];
  teamPreferences: Record<string, any>;
  codebaseHealth: CodebaseHealth;
  lastAnalyzed: Date;
}

export interface Convention {
  type: 'naming' | 'structure' | 'style' | 'testing' | 'documentation';
  rule: string;
  examples: string[];
  confidence: number;
}

export interface CodebaseHealth {
  qualityScore: number;
  testCoverage: number;
  technicalDebt: number;
  maintainabilityIndex: number;
  securityScore: number;
  performanceScore: number;
  lastAssessment: Date;
}

// Agent Status and Control
export interface AutonomousAgentStatus {
  isActive: boolean;
  currentMode: 'idle' | 'planning' | 'executing' | 'learning' | 'monitoring';
  autonomyLevel: AutonomyLevel;
  currentGoals: Goal[];
  activeTasks: Task[];
  queuedTasks: Task[];
  recentActivity: ActivityLog[];
  performance: PerformanceMetrics;
  health: AgentHealth;
  lastActivity: Date;
}

export interface AutonomyLevel {
  level: 'supervised' | 'semi_autonomous' | 'autonomous' | 'fully_autonomous';
  permissions: Permission[];
  restrictions: Restriction[];
  approvalRequired: boolean;
  workingHours?: { start: string; end: string };
  maxConcurrentTasks: number;
}

export interface Permission {
  action: string;
  scope: string[];
  conditions: string[];
}

export interface Restriction {
  action: string;
  reason: string;
  conditions: string[];
}

export interface ActivityLog {
  timestamp: Date;
  action: string;
  target: string;
  outcome: 'success' | 'failure' | 'partial';
  details: string;
  metrics?: Record<string, number>;
}

export interface PerformanceMetrics {
  tasksCompleted: number;
  successRate: number;
  averageTaskDuration: number;
  qualityScore: number;
  learningRate: number;
  efficiencyTrend: number[];
  period: string;
}

export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'error' | 'offline';
  issues: HealthIssue[];
  resourceUtilization: ResourceUsage;
  lastHealthCheck: Date;
}

export interface HealthIssue {
  type: 'performance' | 'memory' | 'error_rate' | 'connectivity' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  detectedAt: Date;
}

// Events and Notifications
export interface AgentEvent {
  id: string;
  type: 'goal_created' | 'task_started' | 'task_completed' | 'error_occurred' | 'learning_update' | 'health_change';
  data: Record<string, any>;
  timestamp: Date;
  projectId?: string;
}

export interface AgentNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actions?: NotificationAction[];
  createdAt: Date;
  read: boolean;
}

export interface NotificationAction {
  label: string;
  action: string;
  parameters: Record<string, any>;
}