import { EventEmitter } from 'events';
import {
  AgentMemory,
  Pattern,
  Experience,
  Learning,
  KnowledgeItem,
  ProjectKnowledge,
  Convention,
  CodebaseHealth
} from '@swistack/shared';
import * as fs from 'fs/promises';
import * as path from 'path';

interface MemoryStorage {
  patterns: Pattern[];
  experiences: Experience[];
  knowledge: KnowledgeItem[];
  projectSpecifics: ProjectKnowledge[];
  lastUpdated: Date;
}

export class AgentMemoryManager extends EventEmitter {
  private memory: AgentMemory;
  private memoryFile: string;
  private saveTimeout?: NodeJS.Timeout;
  private similarityThreshold = 0.7;

  constructor(memoryPath?: string) {
    super();
    
    this.memoryFile = memoryPath || path.join(process.cwd(), 'data', 'agent_memory.json');
    this.memory = {
      patterns: [],
      experiences: [],
      knowledge: [],
      projectSpecifics: []
    };

    this.initializeMemory();
  }

  private async initializeMemory(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.memoryFile), { recursive: true });
      
      // Try to load existing memory
      try {
        const memoryData = await fs.readFile(this.memoryFile, 'utf-8');
        const stored: MemoryStorage = JSON.parse(memoryData);
        
        this.memory.patterns = stored.patterns || [];
        this.memory.experiences = stored.experiences || [];
        this.memory.knowledge = stored.knowledge || [];
        this.memory.projectSpecifics = stored.projectSpecifics || [];
        
        console.log(`[AgentMemory] Loaded ${this.memory.patterns.length} patterns, ${this.memory.experiences.length} experiences`);
      } catch (error) {
        console.log('[AgentMemory] No existing memory found, starting fresh');
        await this.saveMemory();
      }
    } catch (error) {
      console.error('[AgentMemory] Failed to initialize memory:', error);
    }
  }

  /**
   * Record a learning from task execution
   */
  async recordLearning(learning: Learning): Promise<void> {
    console.log(`[AgentMemory] Recording learning: ${learning.type} - ${learning.pattern}`);

    // Check if we already have a similar pattern
    const existingPattern = this.findSimilarPattern(learning);
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.usageCount++;
      existingPattern.lastUsed = new Date();
      
      // Adjust success rate based on new outcome
      if (learning.outcome === 'successful') {
        existingPattern.successRate = (existingPattern.successRate * 0.9) + (100 * 0.1);
      } else {
        existingPattern.successRate = (existingPattern.successRate * 0.9) + (0 * 0.1);
      }
      
      existingPattern.successRate = Math.max(0, Math.min(100, existingPattern.successRate));
      
    } else {
      // Create new pattern
      const pattern: Pattern = {
        id: this.generateId(),
        type: this.mapLearningTypeToPatternType(learning.type),
        name: this.generatePatternName(learning),
        description: learning.pattern,
        template: this.extractTemplate(learning),
        context: learning.applicableScenarios,
        successRate: learning.outcome === 'successful' ? 90 : 10,
        usageCount: 1,
        lastUsed: new Date(),
        embedding: await this.generateEmbedding(learning.pattern)
      };
      
      this.memory.patterns.push(pattern);
      this.emit('pattern_learned', pattern);
    }

    this.scheduleSave();
  }

  /**
   * Record an experience from task execution
   */
  async recordExperience(experience: Experience): Promise<void> {
    console.log(`[AgentMemory] Recording experience: ${experience.outcome}`);
    
    this.memory.experiences.push(experience);
    
    // Keep only recent experiences (last 1000)
    if (this.memory.experiences.length > 1000) {
      this.memory.experiences = this.memory.experiences
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 1000);
    }
    
    this.scheduleSave();
  }

  /**
   * Store knowledge about a topic
   */
  async storeKnowledge(topic: string, content: string, sources: string[] = []): Promise<void> {
    const existingKnowledge = this.memory.knowledge.find(k => k.topic === topic);
    
    if (existingKnowledge) {
      // Update existing knowledge
      existingKnowledge.content = content;
      existingKnowledge.sources = Array.from(new Set([...existingKnowledge.sources, ...sources]));
      existingKnowledge.lastUpdated = new Date();
      existingKnowledge.embedding = await this.generateEmbedding(content);
    } else {
      // Create new knowledge item
      const knowledgeItem: KnowledgeItem = {
        id: this.generateId(),
        topic,
        content,
        sources,
        confidence: 0.8,
        lastUpdated: new Date(),
        tags: this.extractTags(content),
        embedding: await this.generateEmbedding(content)
      };
      
      this.memory.knowledge.push(knowledgeItem);
    }
    
    this.scheduleSave();
  }

  /**
   * Update project-specific knowledge
   */
  async updateProjectKnowledge(projectId: string, updates: Partial<ProjectKnowledge>): Promise<void> {
    let projectKnowledge = this.memory.projectSpecifics.find(p => p.projectId === projectId);
    
    if (!projectKnowledge) {
      projectKnowledge = {
        projectId,
        architecture: '',
        techStack: [],
        conventions: [],
        commonPatterns: [],
        teamPreferences: {},
        codebaseHealth: {
          qualityScore: 0,
          testCoverage: 0,
          technicalDebt: 0,
          maintainabilityIndex: 0,
          securityScore: 0,
          performanceScore: 0,
          lastAssessment: new Date()
        },
        lastAnalyzed: new Date()
      };
      this.memory.projectSpecifics.push(projectKnowledge);
    }
    
    // Apply updates
    Object.assign(projectKnowledge, updates);
    projectKnowledge.lastAnalyzed = new Date();
    
    this.scheduleSave();
  }

  /**
   * Find patterns relevant to a context
   */
  findRelevantPatterns(context: string, limit: number = 5): Pattern[] {
    const contextWords = context.toLowerCase().split(/\s+/);
    
    return this.memory.patterns
      .map(pattern => ({
        pattern,
        relevance: this.calculateRelevance(pattern, contextWords)
      }))
      .filter(item => item.relevance > 0.3)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(item => item.pattern);
  }

  /**
   * Get experiences similar to current context
   */
  getSimilarExperiences(context: string, outcome?: 'success' | 'failure' | 'partial'): Experience[] {
    const contextWords = context.toLowerCase().split(/\s+/);
    
    return this.memory.experiences
      .filter(exp => outcome ? exp.outcome === outcome : true)
      .map(exp => ({
        experience: exp,
        similarity: this.calculateContextSimilarity(exp.context, contextWords)
      }))
      .filter(item => item.similarity > 0.4)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map(item => item.experience);
  }

  /**
   * Query knowledge base
   */
  queryKnowledge(query: string, limit: number = 5): KnowledgeItem[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    return this.memory.knowledge
      .map(item => ({
        item,
        relevance: this.calculateTextRelevance(item.content, queryWords)
      }))
      .filter(result => result.relevance > 0.3)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(result => result.item);
  }

  /**
   * Get project-specific knowledge
   */
  getProjectKnowledge(projectId: string): ProjectKnowledge | null {
    return this.memory.projectSpecifics.find(p => p.projectId === projectId) || null;
  }

  /**
   * Analyze learning patterns to suggest improvements
   */
  analyzeLearningTrends(): {
    successfulPatterns: Pattern[];
    failingPatterns: Pattern[];
    recommendations: string[];
  } {
    const recentPatterns = this.memory.patterns
      .filter(p => p.lastUsed.getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .filter(p => p.usageCount >= 3); // Used at least 3 times
    
    const successfulPatterns = recentPatterns
      .filter(p => p.successRate > 80)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
    
    const failingPatterns = recentPatterns
      .filter(p => p.successRate < 50)
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 5);
    
    const recommendations = this.generateLearningRecommendations(successfulPatterns, failingPatterns);
    
    return {
      successfulPatterns,
      failingPatterns,
      recommendations
    };
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    patterns: number;
    experiences: number;
    knowledge: number;
    projects: number;
    successRate: number;
    learningVelocity: number;
  } {
    const recentExperiences = this.memory.experiences
      .filter(exp => exp.createdAt.getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)); // Last 7 days
    
    const successfulExperiences = recentExperiences.filter(exp => exp.outcome === 'success');
    const successRate = recentExperiences.length > 0 
      ? (successfulExperiences.length / recentExperiences.length) * 100 
      : 0;
    
    const learningVelocity = recentExperiences.length; // Experiences per week
    
    return {
      patterns: this.memory.patterns.length,
      experiences: this.memory.experiences.length,
      knowledge: this.memory.knowledge.length,
      projects: this.memory.projectSpecifics.length,
      successRate,
      learningVelocity
    };
  }

  // Private helper methods
  private findSimilarPattern(learning: Learning): Pattern | null {
    return this.memory.patterns.find(pattern => 
      this.calculateTextSimilarity(pattern.description, learning.pattern) > this.similarityThreshold
    );
  }

  private mapLearningTypeToPatternType(learningType: string): Pattern['type'] {
    switch (learningType) {
      case 'success_pattern':
      case 'failure_pattern':
        return 'problem_solution';
      case 'optimization':
        return 'workflow_pattern';
      case 'best_practice':
        return 'code_pattern';
      default:
        return 'problem_solution';
    }
  }

  private generatePatternName(learning: Learning): string {
    const words = learning.pattern.split(' ').slice(0, 4);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private extractTemplate(learning: Learning): string {
    // Extract a reusable template from the learning
    // This is a simplified implementation
    return learning.pattern
      .replace(/\b\d+\b/g, '{number}')
      .replace(/\b[a-zA-Z]+\.(js|ts|tsx|jsx|py|java)\b/g, '{filename}')
      .replace(/\b[A-Z][a-zA-Z]*Component\b/g, '{ComponentName}');
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simplified embedding generation
    // In production, this would use a proper embedding model
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(100).fill(0);
    
    for (let i = 0; i < words.length && i < embedding.length; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      embedding[i % embedding.length] += hash % 1000;
    }
    
    return embedding;
  }

  private calculateRelevance(pattern: Pattern, contextWords: string[]): number {
    const patternWords = pattern.description.toLowerCase().split(/\s+/);
    const intersection = contextWords.filter(word => patternWords.includes(word));
    const union = [...new Set([...contextWords, ...patternWords])];
    
    const jaccardSimilarity = intersection.length / union.length;
    const successWeight = pattern.successRate / 100;
    const usageWeight = Math.min(pattern.usageCount / 10, 1);
    
    return jaccardSimilarity * successWeight * usageWeight;
  }

  private calculateContextSimilarity(context: string, contextWords: string[]): number {
    const expWords = context.toLowerCase().split(/\s+/);
    const intersection = contextWords.filter(word => expWords.includes(word));
    return intersection.length / Math.max(contextWords.length, expWords.length);
  }

  private calculateTextRelevance(text: string, queryWords: string[]): number {
    const textWords = text.toLowerCase().split(/\s+/);
    const intersection = queryWords.filter(word => textWords.includes(word));
    return intersection.length / queryWords.length;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract programming language mentions
    const languages = ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'express'];
    for (const lang of languages) {
      if (content.toLowerCase().includes(lang)) {
        tags.push(lang);
      }
    }
    
    // Extract action words
    const actions = ['create', 'modify', 'delete', 'analyze', 'test', 'deploy', 'debug'];
    for (const action of actions) {
      if (content.toLowerCase().includes(action)) {
        tags.push(action);
      }
    }
    
    return [...new Set(tags)];
  }

  private generateLearningRecommendations(successful: Pattern[], failing: Pattern[]): string[] {
    const recommendations: string[] = [];
    
    if (successful.length > 0) {
      recommendations.push(`Continue using successful patterns like "${successful[0].name}"`);
    }
    
    if (failing.length > 0) {
      recommendations.push(`Review and improve failing patterns like "${failing[0].name}"`);
    }
    
    if (this.memory.patterns.length < 10) {
      recommendations.push('Build more experience by working on diverse tasks');
    }
    
    const recentExperiences = this.memory.experiences
      .filter(exp => exp.createdAt.getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000));
    
    if (recentExperiences.length < 5) {
      recommendations.push('Increase task execution frequency to accelerate learning');
    }
    
    return recommendations;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Debounce saves
    this.saveTimeout = setTimeout(() => {
      this.saveMemory();
    }, 5000);
  }

  private async saveMemory(): Promise<void> {
    try {
      const memoryData: MemoryStorage = {
        patterns: this.memory.patterns,
        experiences: this.memory.experiences,
        knowledge: this.memory.knowledge,
        projectSpecifics: this.memory.projectSpecifics,
        lastUpdated: new Date()
      };
      
      await fs.writeFile(this.memoryFile, JSON.stringify(memoryData, null, 2));
      console.log('[AgentMemory] Memory saved successfully');
    } catch (error) {
      console.error('[AgentMemory] Failed to save memory:', error);
    }
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  public getMemory(): AgentMemory {
    return { ...this.memory };
  }

  public async clearMemory(): Promise<void> {
    this.memory = {
      patterns: [],
      experiences: [],
      knowledge: [],
      projectSpecifics: []
    };
    await this.saveMemory();
  }

  public async exportMemory(): Promise<string> {
    return JSON.stringify(this.memory, null, 2);
  }

  public async importMemory(memoryJson: string): Promise<void> {
    try {
      const imported = JSON.parse(memoryJson) as AgentMemory;
      this.memory = imported;
      await this.saveMemory();
      console.log('[AgentMemory] Memory imported successfully');
    } catch (error) {
      console.error('[AgentMemory] Failed to import memory:', error);
      throw error;
    }
  }
}