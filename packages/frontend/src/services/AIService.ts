export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async startConversation(projectId: string): Promise<string> {
    return `conv_${projectId}_${Date.now()}`;
  }

  async getProviderInfo() {
    return {
      currentProvider: 'SwiStack AI',
      capabilities: ['code_generation', 'file_operations', 'command_execution']
    };
  }
}