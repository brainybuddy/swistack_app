// AI and Machine Learning types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    context?: string[];
    confidence?: number;
    model?: string;
    tokens?: number;
    reasoning?: string;
  };
}

export interface AIResponse {
  id: string;
  content: string;
  metadata: {
    model: string;
    tokens: number;
    confidence: number;
    processingTime: number;
    context: string[];
  };
  suggestions?: CodeSuggestion[];
  actions?: AIAction[];
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'refactor' | 'optimization' | 'fix' | 'enhancement';
  description: string;
  code: string;
  language: string;
  filePath?: string;
  lineRange?: { start: number; end: number };
  confidence: number;
  reasoning: string;
  alternatives?: CodeSuggestion[];
}

export interface AIAction {
  id: string;
  type: 'file_create' | 'file_update' | 'file_delete' | 'command_execute' | 'refactor' | 'test_create' | 'debug';
  description: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedDuration?: number;
  dependencies?: string[];
  rollbackPlan?: string;
}

export interface AIConversation {
  id: string;
  projectId?: string;
  userId: string;
  messages: AIMessage[];
  context: {
    currentFile?: string;
    selectedCode?: string;
    projectStructure?: string;
    recentFiles?: string[];
  };
  settings: {
    model: string;
    temperature: number;
    autoExecute: boolean;
    includeContext: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: ModelCapability[];
  contextLength: number;
  costPer1kTokens: number;
  maxOutputTokens: number;
  supportedLanguages: string[];
}

export interface ModelCapability {
  type: 'text_generation' | 'code_generation' | 'code_analysis' | 'code_completion' | 'debugging' | 'refactoring';
  quality: 'basic' | 'good' | 'excellent';
  speed: 'slow' | 'medium' | 'fast';
}

// Code analysis types
export interface CodeAnalysis {
  complexity: number;
  maintainability: number;
  testability: number;
  security: SecurityAnalysis;
  performance: PerformanceAnalysis;
  suggestions: CodeSuggestion[];
}

export interface SecurityAnalysis {
  score: number;
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
}

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: { file: string; line: number; column: number };
  fix?: string;
}

export interface PerformanceAnalysis {
  score: number;
  bottlenecks: PerformanceBottleneck[];
  optimizations: string[];
}

export interface PerformanceBottleneck {
  type: 'algorithm' | 'memory' | 'io' | 'network' | 'rendering';
  location: { file: string; line: number; column: number };
  impact: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

// File operations for AI
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  lastModified?: Date;
  children?: FileNode[];
  metadata?: {
    language?: string;
    encoding?: string;
    permissions?: string;
  };
}

// Code execution for AI
export interface CodeExecution {
  id: string;
  code: string;
  language: string;
  environment: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  duration: number;
  resourceUsage?: {
    memory: number;
    cpu: number;
  };
}