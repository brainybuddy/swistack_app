export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    context?: string[];
    codeBlocks?: CodeBlock[];
    suggestions?: CodeSuggestion[];
  };
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  filePath?: string;
  startLine?: number;
  endLine?: number;
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'fix' | 'refactor' | 'optimization';
  title: string;
  description: string;
  code: string;
  filePath: string;
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  confidence: number;
}

export interface ProjectContext {
  projectId: string;
  name: string;
  description: string;
  framework: string;
  language: string;
  dependencies: Record<string, string>;
  fileStructure: FileNode[];
  activeFiles: string[];
  recentChanges: CodeChange[];
  gitBranch?: string;
  environment?: 'development' | 'staging' | 'production';
}

export interface FileContext {
  filePath: string;
  content: string;
  language: string;
  imports: string[];
  exports: string[];
  symbols: CodeSymbol[];
  dependencies: string[];
  lastModified: Date;
}

export interface CodeContext {
  file: FileContext;
  project: ProjectContext;
  selection?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
    text: string;
  };
  cursor?: { line: number; character: number };
  diagnostics: Diagnostic[];
}

export interface CodeChange {
  id: string;
  filePath: string;
  type: 'create' | 'modify' | 'delete' | 'rename';
  oldContent?: string;
  newContent?: string;
  timestamp: Date;
  author: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  lastModified?: Date;
}

export interface CodeSymbol {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'constant';
  line: number;
  column: number;
  scope: 'public' | 'private' | 'protected' | 'local';
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source: string;
  line: number;
  column: number;
  code?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  tokens: number;
  metadata: {
    reasoning?: string;
    confidence: number;
    suggestions: CodeSuggestion[];
    actions: AIAction[];
  };
}

export interface AIAction {
  type: 'create_file' | 'modify_file' | 'delete_file' | 'run_command' | 'install_package';
  description: string;
  params: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface CodeGeneration {
  code: string;
  language: string;
  filePath: string;
  explanation: string;
  suggestions: CodeSuggestion[];
  dependencies?: string[];
}

export interface CodeExplanation {
  summary: string;
  details: string;
  keyPoints: string[];
  relatedFiles: string[];
  suggestedImprovements: CodeSuggestion[];
}

export interface CodeFix {
  description: string;
  changes: CodeChange[];
  explanation: string;
  confidence: number;
}

export interface ProjectAnalysis {
  summary: string;
  architecture: {
    patterns: string[];
    technologies: string[];
    structure: string;
  };
  codeQuality: {
    score: number;
    issues: Diagnostic[];
    suggestions: CodeSuggestion[];
  };
  security: {
    vulnerabilities: SecurityIssue[];
    recommendations: string[];
  };
  performance: {
    bottlenecks: PerformanceIssue[];
    optimizations: CodeSuggestion[];
  };
}

export interface SecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  filePath: string;
  line: number;
  fix?: CodeSuggestion;
}

export interface PerformanceIssue {
  type: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  filePath: string;
  line: number;
  suggestion: CodeSuggestion;
}

export interface AIProvider {
  name: string;
  models: string[];
  capabilities: AICapability[];
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface AICapability {
  type: 'chat' | 'code_generation' | 'code_analysis' | 'explanation' | 'debugging';
  supported: boolean;
  quality: 'basic' | 'good' | 'excellent';
}

export interface AIConfiguration {
  primaryProvider: string;
  fallbackProviders: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  codeOptimizations: boolean;
  securityAnalysis: boolean;
  performanceAnalysis: boolean;
}

export interface ConversationContext {
  projectId: string;
  conversationId: string;
  messages: AIMessage[];
  context: ProjectContext;
  userPreferences: UserAIPreferences;
}

export interface UserAIPreferences {
  preferredModel: string;
  codeStyle: 'concise' | 'detailed' | 'educational';
  autoSuggestions: boolean;
  autoFix: boolean;
  securityChecks: boolean;
  performanceOptimizations: boolean;
  explanationLevel: 'basic' | 'intermediate' | 'advanced';
}