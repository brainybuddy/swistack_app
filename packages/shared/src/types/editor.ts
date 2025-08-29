// Editor and IDE related types
export interface EditorConfiguration {
  theme: 'vs-dark' | 'light' | 'vs' | 'swistack-dark';
  fontSize: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  autoSave: boolean;
  autoSaveDelay: number;
  bracketPairColorization: boolean;
  indentGuides: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
}

export interface EditorTab {
  id: string;
  name: string;
  type: 'file' | 'chat' | 'preview';
  content?: string;
  language?: string;
  filePath?: string;
  hasUnsavedChanges?: boolean;
  icon: string;
  isClosable?: boolean;
  isActive?: boolean;
}

export interface EditorState {
  activeTabId: string | null;
  tabs: EditorTab[];
  splitView: boolean;
  leftPaneWidth: number;
  rightPaneWidth: number;
  bottomPaneHeight: number;
  showLeftPane: boolean;
  showRightPane: boolean;
  showBottomPane: boolean;
}

// Language service types
export interface LanguageInfo {
  id: string;
  name: string;
  extensions: string[];
  mimeType?: string;
  aliases?: string[];
}

export interface SyntaxToken {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'variable' | 'type' | 'operator';
  value: string;
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export interface SyntaxHighlightResult {
  tokens: SyntaxToken[];
  language: string;
  lineCount: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  alternatives?: Array<{ language: string; confidence: number }>;
}

// Code completion types
export interface CompletionItem {
  label: string;
  kind: 'keyword' | 'function' | 'variable' | 'class' | 'interface' | 'method' | 'property' | 'snippet' | 'text';
  insertText: string;
  documentation?: string;
  detail?: string;
  sortText?: string;
  filterText?: string;
  range?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface CompletionRequest {
  content: string;
  language: string;
  position: number;
  triggerCharacter?: string;
  context?: {
    triggerKind: 'invoked' | 'triggerCharacter' | 'contentChange';
    triggerCharacter?: string;
  };
}

export interface CompletionResult {
  completions: CompletionItem[];
  prefix: string;
  isIncomplete?: boolean;
}

// Formatting types
export interface FormattingOptions {
  indentSize: number;
  insertFinalNewline: boolean;
  trimTrailingWhitespace: boolean;
  insertSpaces: boolean;
  bracketSpacing?: boolean;
  semiColons?: boolean;
  maxLineLength?: number;
  wrapAttributes?: 'auto' | 'force' | 'force-aligned' | 'force-expand-multiline' | 'aligned-multiple' | 'preserve';
}

export interface FormattingResult {
  formatted: string;
  language: string;
  changes: boolean;
  edits?: Array<{
    range: { start: number; end: number };
    newText: string;
  }>;
}

export interface LintIssue {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  ruleId: string;
  source?: string;
  fixable?: boolean;
  fix?: {
    range: { start: number; end: number };
    text: string;
  };
}

export interface LintResult {
  issues: LintIssue[];
  language: string;
  summary: {
    errors: number;
    warnings: number;
    total: number;
  };
}

// Search types
export interface SearchOptions {
  caseSensitive?: boolean;
  regex?: boolean;
  wholeWord?: boolean;
  includeExtensions?: string[];
  excludeExtensions?: string[];
  maxResults?: number;
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  preview: string;
  match: string;
}

export interface FileSearchResult {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalFiles: number;
  matchingFiles: number;
  totalMatches: number;
  truncated: boolean;
}

export interface FileSearchResponse {
  results: FileSearchResult[];
  query: string;
  totalFound: number;
  truncated: boolean;
}

// Symbol navigation types
export interface Symbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'method' | 'property' | 'namespace' | 'enum';
  line: number;
  column: number;
  scope: 'global' | 'local' | 'class' | 'namespace';
  detail?: string;
  containerName?: string;
}

export interface SymbolsResult {
  symbols: Symbol[];
  file: string;
  language: string;
}

// Quick search types
export interface QuickSearchResult {
  type: 'file' | 'content' | 'symbol';
  name: string;
  path: string;
  preview: string;
  line?: number;
  kind?: Symbol['kind'];
}

export interface QuickSearchResponse {
  files: QuickSearchResult[];
  content: QuickSearchResult[];
  symbols?: QuickSearchResult[];
  query: string;
  hasMore: boolean;
}

// Auto-save types
export interface AutoSaveOptions {
  enabled: boolean;
  delay: number;
  conflictResolution: 'manual' | 'overwrite' | 'merge';
}

export interface FileConflict {
  file: string;
  localVersion: string;
  remoteVersion: string;
  timestamp: Date;
  resolution?: 'local' | 'remote' | 'merged';
}

export interface AutoSaveResult {
  success: boolean;
  file: string;
  timestamp: Date;
  conflicts?: FileConflict[];
  error?: string;
}

// Command palette types
export interface Command {
  id: string;
  title: string;
  category: string;
  keybinding?: string;
  icon?: string;
  when?: string;
  arguments?: any[];
}

export interface CommandPaletteItem {
  command: Command;
  score: number;
  matches: number[];
}

// Keyboard shortcut types
export interface KeyBinding {
  key: string;
  command: string;
  when?: string;
  args?: any;
}

export interface KeyMap {
  [key: string]: KeyBinding;
}

// Editor features
export interface FindReplaceOptions {
  query: string;
  replace?: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  preserveCase: boolean;
}

export interface FindResult {
  matches: Array<{
    line: number;
    column: number;
    length: number;
    text: string;
  }>;
  currentMatch: number;
  totalMatches: number;
}

export interface GoToDefinitionResult {
  file: string;
  line: number;
  column: number;
  symbol: string;
  preview?: string;
}

// File operations
export interface FileOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'rename' | 'move';
  source: string;
  target?: string;
  content?: string;
  timestamp: Date;
}

export interface FileWatcher {
  path: string;
  recursive: boolean;
  events: ('create' | 'update' | 'delete' | 'rename')[];
  callback: (event: FileOperation) => void;
}

// Editor plugin types
export interface EditorPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  config?: Record<string, any>;
  commands?: Command[];
  keyBindings?: KeyBinding[];
  languages?: string[];
  contributes?: {
    themes?: any[];
    snippets?: any[];
    grammars?: any[];
  };
}

// Chat message interface
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Collaboration types have been moved to collaboration.ts

// Error types
export interface EditorError {
  code: string;
  message: string;
  details?: any;
  file?: string;
  line?: number;
  column?: number;
}

// API Response types
export interface LanguageServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface FormatterResponse extends LanguageServiceResponse<FormattingResult> {}
export interface LinterResponse extends LanguageServiceResponse<LintResult> {}
export interface CompletionResponse extends LanguageServiceResponse<CompletionResult> {}
export interface SearchResultResponse extends LanguageServiceResponse<SearchResponse> {}
export interface SymbolResponse extends LanguageServiceResponse<SymbolsResult> {}
export interface QuickSearchResponseType extends LanguageServiceResponse<QuickSearchResponse> {}
export interface LanguageDetectionResponse extends LanguageServiceResponse<LanguageDetectionResult> {}
export interface SyntaxHighlightResponse extends LanguageServiceResponse<SyntaxHighlightResult> {}