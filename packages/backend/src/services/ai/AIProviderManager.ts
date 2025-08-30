import { ClaudeProvider } from './providers/ClaudeProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { IAIService } from '@swistack/shared';
import {
  AIConfiguration,
  AIProvider,
  AICapability
} from '@swistack/shared';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local (go up from packages/backend to project root)
const envPath = path.join(__dirname, '../../../../..', '.env.local');
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.warn('Could not load .env.local file:', envResult.error.message);
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  models: string[];
  capabilities: AICapability[];
  priority: number;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export class AIProviderManager {
  private providers: Map<string, IAIService> = new Map();
  private providerConfigs: Map<string, ProviderConfig> = new Map();
  private currentProvider: string = '';
  private fallbackProviders: string[] = [];
  private defaultConfig: AIConfiguration;

  constructor() {
    this.defaultConfig = {
      primaryProvider: 'claude',
      fallbackProviders: ['openai'],
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.1,
      maxTokens: 4000,
      contextWindow: 200000,
      codeOptimizations: true,
      securityAnalysis: true,
      performanceAnalysis: true,
    };

    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Claude provider configuration
    const claudeApiKey = process.env.ANTHROPIC_API_KEY;
    if (claudeApiKey) {
      const claudeConfig: ProviderConfig = {
        name: 'claude',
        apiKey: claudeApiKey,
        models: [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229'
        ],
        capabilities: [
          { type: 'chat', supported: true, quality: 'excellent' },
          { type: 'code_generation', supported: true, quality: 'excellent' },
          { type: 'code_analysis', supported: true, quality: 'excellent' },
          { type: 'explanation', supported: true, quality: 'excellent' },
          { type: 'debugging', supported: true, quality: 'excellent' },
        ],
        priority: 1,
        rateLimits: {
          requestsPerMinute: 50,
          tokensPerMinute: 40000,
        },
      };

      this.providerConfigs.set('claude', claudeConfig);
      
      const claudeProvider = new ClaudeProvider(this.defaultConfig, claudeApiKey);
      this.providers.set('claude', claudeProvider);
      
      console.log('✅ Claude provider initialized');
    } else {
      console.warn('⚠️ ANTHROPIC_API_KEY not found in environment variables');
    }

    // OpenAI provider configuration
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      const openaiConfig: ProviderConfig = {
        name: 'openai',
        apiKey: openaiApiKey,
        models: [
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4-turbo',
          'o1-preview',
          'o1-mini'
        ],
        capabilities: [
          { type: 'chat', supported: true, quality: 'excellent' },
          { type: 'code_generation', supported: true, quality: 'good' },
          { type: 'code_analysis', supported: true, quality: 'good' },
          { type: 'explanation', supported: true, quality: 'good' },
          { type: 'debugging', supported: true, quality: 'good' },
        ],
        priority: 2,
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerMinute: 50000,
        },
      };

      this.providerConfigs.set('openai', openaiConfig);
      
      const openaiProvider = new OpenAIProvider(this.defaultConfig, openaiApiKey);
      this.providers.set('openai', openaiProvider);
      
      console.log('✅ OpenAI provider initialized');
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
    }

    // Set primary and fallback providers
    this.currentProvider = this.selectPrimaryProvider();
    this.fallbackProviders = this.selectFallbackProviders();

    console.log(`🤖 AI Provider Manager initialized:
    - Primary: ${this.currentProvider}
    - Fallbacks: ${this.fallbackProviders.join(', ')}
    - Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  private selectPrimaryProvider(): string {
    // Select provider based on priority and availability
    const availableProviders = Array.from(this.providerConfigs.values())
      .filter(config => this.providers.has(config.name))
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available. Please check your API keys in .env.local');
    }

    return availableProviders[0].name;
  }

  private selectFallbackProviders(): string[] {
    return Array.from(this.providerConfigs.values())
      .filter(config => 
        this.providers.has(config.name) && 
        config.name !== this.currentProvider
      )
      .sort((a, b) => a.priority - b.priority)
      .map(config => config.name);
  }

  public getProvider(providerName?: string): IAIService {
    const targetProvider = providerName || this.currentProvider;
    const provider = this.providers.get(targetProvider);
    
    if (!provider) {
      throw new Error(`Provider ${targetProvider} not available`);
    }
    
    return provider;
  }

  public async getProviderWithFallback(): Promise<IAIService> {
    try {
      return this.getProvider(this.currentProvider);
    } catch (error) {
      console.warn(`Primary provider ${this.currentProvider} failed, trying fallbacks...`);
      
      for (const fallbackProvider of this.fallbackProviders) {
        try {
          console.log(`Trying fallback provider: ${fallbackProvider}`);
          return this.getProvider(fallbackProvider);
        } catch (fallbackError) {
          console.warn(`Fallback provider ${fallbackProvider} also failed`);
          continue;
        }
      }
      
      throw new Error('All AI providers are currently unavailable');
    }
  }

  public async switchProvider(providerId: string): Promise<boolean> {
    if (!this.providers.has(providerId)) {
      console.error(`Provider ${providerId} is not available`);
      return false;
    }

    this.currentProvider = providerId;
    console.log(`Switched to AI provider: ${providerId}`);
    return true;
  }

  public getAvailableProviders(): AIProvider[] {
    return Array.from(this.providerConfigs.values()).map(config => ({
      name: config.name,
      models: config.models,
      capabilities: config.capabilities,
      rateLimits: config.rateLimits,
    }));
  }

  public async getProviderStatus(): Promise<{ provider: string; status: 'online' | 'offline' | 'limited' }[]> {
    const statusPromises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        // Test provider with a simple request
        await this.testProvider(provider);
        return { provider: name, status: 'online' as const };
      } catch (error) {
        console.warn(`Provider ${name} status check failed:`, error instanceof Error ? error.message : String(error));
        return { provider: name, status: 'offline' as const };
      }
    });

    return Promise.all(statusPromises);
  }

  private async testProvider(provider: IAIService): Promise<void> {
    // Simple test to check if provider is responsive
    const testMessages = [{
      id: 'test',
      role: 'user' as const,
      content: 'Hello',
      timestamp: new Date(),
    }];

    const testContext = {
      projectId: 'test',
      name: 'Test Project',
      description: 'Test',
      framework: 'javascript',
      language: 'javascript',
      dependencies: {},
      fileStructure: [],
      activeFiles: [],
      recentChanges: [],
    };

    // This should be a lightweight test - maybe with a shorter timeout
    await provider.chat(testMessages, testContext, { maxTokens: 10 });
  }

  public getProviderConfig(providerId: string): ProviderConfig | null {
    return this.providerConfigs.get(providerId) || null;
  }

  public updateConfiguration(config: Partial<AIConfiguration>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    
    // Update all providers with new config
    for (const [name, provider] of this.providers.entries()) {
      if (provider instanceof ClaudeProvider || provider instanceof OpenAIProvider) {
        // Update provider config if needed
        console.log(`Updated configuration for provider: ${name}`);
      }
    }
  }

  public getCurrentProvider(): string {
    return this.currentProvider;
  }

  public getFallbackProviders(): string[] {
    return this.fallbackProviders;
  }

  public getConfiguration(): AIConfiguration {
    return { ...this.defaultConfig };
  }

  // Model management
  public getAvailableModels(providerId?: string): string[] {
    const targetProvider = providerId || this.currentProvider;
    const config = this.providerConfigs.get(targetProvider);
    return config ? config.models : [];
  }

  public getBestModelForTask(
    task: 'chat' | 'code_generation' | 'code_analysis' | 'explanation' | 'debugging',
    providerId?: string
  ): string {
    const targetProvider = providerId || this.currentProvider;
    const config = this.providerConfigs.get(targetProvider);
    
    if (!config) {
      return this.defaultConfig.model;
    }

    // Task-specific model selection logic
    switch (task) {
      case 'code_generation':
      case 'code_analysis':
        // Use most capable models for coding tasks
        if (targetProvider === 'claude') {
          return 'claude-3-5-sonnet-20241022';
        } else if (targetProvider === 'openai') {
          return 'gpt-4o';
        }
        break;
      
      case 'chat':
      case 'explanation':
        // Use balanced models for conversational tasks
        if (targetProvider === 'claude') {
          return 'claude-3-5-sonnet-20241022';
        } else if (targetProvider === 'openai') {
          return 'gpt-4o';
        }
        break;
      
      case 'debugging':
        // Use reasoning-optimized models for debugging
        if (targetProvider === 'claude') {
          return 'claude-3-5-sonnet-20241022';
        } else if (targetProvider === 'openai') {
          return 'o1-preview';
        }
        break;
    }

    return config.models[0] || this.defaultConfig.model;
  }

  // Rate limiting and usage tracking
  public async checkRateLimit(providerId: string): Promise<boolean> {
    const config = this.providerConfigs.get(providerId);
    if (!config) return false;

    // Implement rate limiting logic here
    // This would typically involve checking against a Redis cache or database
    // For now, return true (no rate limiting)
    return true;
  }

  public async recordUsage(
    providerId: string, 
    tokens: number, 
    requestType: string
  ): Promise<void> {
    // Record usage for billing and analytics
    console.log(`Usage recorded: ${providerId} - ${tokens} tokens for ${requestType}`);
    
    // This would typically be stored in a database for:
    // - User billing
    // - Rate limiting
    // - Analytics
    // - Cost tracking
  }

  // Error handling and recovery
  public async handleProviderError(
    providerId: string,
    error: Error
  ): Promise<IAIService | null> {
    console.error(`Provider ${providerId} error:`, error.message);

    // Log error for monitoring
    this.logProviderError(providerId, error);

    // Try fallback providers
    for (const fallbackId of this.fallbackProviders) {
      if (fallbackId !== providerId) {
        try {
          const fallbackProvider = this.getProvider(fallbackId);
          console.log(`Switching to fallback provider: ${fallbackId}`);
          return fallbackProvider;
        } catch (fallbackError) {
          console.warn(`Fallback provider ${fallbackId} also failed`);
        }
      }
    }

    return null;
  }

  private logProviderError(providerId: string, error: Error): void {
    // This would typically integrate with monitoring systems like Sentry
    console.error(`[AI Provider Error] ${providerId}: ${error.message}`);
    
    // In production, you'd want to:
    // - Send to error monitoring service
    // - Track error rates
    // - Alert on provider failures
    // - Update provider health metrics
  }
}