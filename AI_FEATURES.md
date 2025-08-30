# 🤖 AI Features in SwiStack

SwiStack includes a comprehensive AI coding assistant powered by state-of-the-art language models. This document outlines all AI capabilities and how to use them.

## 🚀 Quick Start

1. **Setup API Keys**: Copy `.env.local.example` to `.env.local` and add your AI API keys:
   ```bash
   # Recommended: Anthropic Claude (best for coding)
   ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
   
   # Alternative: OpenAI (fallback option)
   OPENAI_API_KEY="sk-your-openai-key-here"
   ```

2. **Start the Application**: The AI features will be automatically available in the editor.

## 🎯 Core AI Features

### 1. **Intelligent Chat Assistant**
- **Location**: AI Assistant tab in the editor
- **Capabilities**:
  - Project-aware conversations
  - Code-specific help and explanations
  - Architecture guidance and best practices
  - Debugging assistance with error context
  - Framework-specific knowledge (React, Node.js, Python, etc.)

**Example Usage**:
```
User: "Help me create a React component for user authentication"
AI: "I'll help you create a comprehensive authentication component..."
```

### 2. **AI Project Creation**
- **Location**: Workspace → Create with AI
- **Capabilities**:
  - Natural language project description to full application
  - Intelligent framework selection
  - Complete project scaffolding with best practices
  - Automatic dependency management

**Example Usage**:
1. Enter: "Create a todo app with React and TypeScript that stores data in localStorage"
2. AI generates complete project structure with components, hooks, and styling

### 3. **Smart Code Completion**
- **Location**: Monaco Editor (automatic)
- **Capabilities**:
  - Context-aware code suggestions
  - Multi-line completions
  - Framework-specific patterns
  - Import statement generation

### 4. **Code Actions & Refactoring**
- **Location**: Right-click in editor or AI Actions panel
- **Capabilities**:
  - **Code Generation**: Functions, components, APIs, tests
  - **Code Optimization**: Performance improvements and best practices
  - **Bug Fixing**: Automated error detection and resolution
  - **Refactoring**: Code structure improvements
  - **Documentation**: Automatic comment generation
  - **Security Review**: Vulnerability detection and fixes

### 5. **Intelligent Code Explanation**
- **Location**: Select code → AI Actions → Explain
- **Capabilities**:
  - Line-by-line explanations
  - Architecture overview
  - Algorithm explanations
  - Performance analysis

### 6. **Real-time Error Fixing**
- **Location**: Automatic when errors are detected
- **Capabilities**:
  - Syntax error corrections
  - Logic error suggestions
  - Import/dependency fixes
  - TypeScript error resolutions

## 🔧 Advanced Features

### Multi-Provider Support
- **Primary**: Anthropic Claude (optimized for coding tasks)
- **Fallback**: OpenAI GPT-4/o1 (alternative provider)
- **Auto-switching**: Automatic failover if primary provider is unavailable

### Context-Aware Intelligence
The AI has deep understanding of your project:
- **File Structure**: Knows your project organization
- **Dependencies**: Understands your tech stack
- **Conventions**: Learns your coding patterns
- **History**: Remembers previous conversations

### Code Quality Analysis
- **Security Scanning**: Identifies potential vulnerabilities
- **Performance Analysis**: Suggests optimization opportunities  
- **Best Practices**: Enforces coding standards
- **Test Generation**: Creates comprehensive unit tests

## 🎮 Usage Examples

### 1. Building a Feature
```
User: "I need to add user authentication to my React app"

AI Response:
1. Creates AuthContext for state management
2. Generates login/register components  
3. Adds protected route wrapper
4. Implements JWT token handling
5. Creates authentication hooks
```

### 2. Debugging Issues
```
User: "I'm getting a 'Cannot read property of undefined' error"

AI Response:
1. Analyzes the error context
2. Identifies the problematic code
3. Suggests multiple fix options
4. Explains why the error occurred
5. Provides prevention strategies
```

### 3. Code Review & Optimization
```
User: Selects a function → AI Actions → Optimize

AI Response:
1. Analyzes performance bottlenecks
2. Suggests algorithmic improvements
3. Optimizes memory usage
4. Improves readability
5. Adds proper error handling
```

## ⚙️ Configuration

### AI Provider Settings
Configure AI providers in your environment:

```bash
# Primary provider (recommended)
ANTHROPIC_API_KEY="your-claude-key"

# Fallback provider
OPENAI_API_KEY="your-openai-key"

# Optional: Custom model selection
AI_MODEL_PREFERENCE="claude-3-5-sonnet-20241022"
```

### Feature Toggles
Control which AI features are enabled:

```bash
# Enable/disable specific features
AI_CODE_COMPLETION=true
AI_ERROR_FIXING=true
AI_SECURITY_ANALYSIS=true
AI_PERFORMANCE_OPTIMIZATION=true
```

## 🛡️ Security & Privacy

### Data Handling
- **Code Privacy**: Your code is sent to AI providers for processing
- **No Storage**: AI providers don't permanently store your code
- **Encryption**: All API communication is encrypted (HTTPS)
- **Local Processing**: Non-sensitive operations happen locally

### Best Practices
- Use environment variables for API keys
- Regularly rotate API keys
- Review AI-generated code before deployment
- Don't include sensitive data in AI prompts

## 🚀 Performance

### Response Times
- **Chat**: ~2-4 seconds
- **Code Completion**: ~500ms-1s  
- **Code Generation**: ~3-8 seconds
- **Analysis**: ~5-15 seconds

### Rate Limits
- **Claude**: 50 requests/minute, 40K tokens/minute
- **OpenAI**: 60 requests/minute, 50K tokens/minute
- **Auto-throttling**: Built-in request queuing

## 🔍 Troubleshooting

### Common Issues

#### 1. AI Not Responding
**Cause**: API key issues or network problems
**Solution**: 
1. Check API key in `.env.local`
2. Verify API key validity
3. Check console for error messages

#### 2. Poor Code Quality
**Cause**: Insufficient context or unclear prompts
**Solution**:
1. Provide more specific descriptions
2. Include relevant code context
3. Use the current file context feature

#### 3. Slow Response Times
**Cause**: Large context or complex requests
**Solution**:
1. Break down complex requests
2. Reduce context size
3. Use more specific prompts

### Health Check
Monitor AI service status:
- **Endpoint**: `/api/ai/health`
- **Status Page**: Available in development mode
- **Logs**: Check browser console and server logs

## 🔄 Updates & Roadmap

### Current Version: 1.0
- ✅ Multi-provider AI support
- ✅ Context-aware chat assistant
- ✅ Smart code completion
- ✅ Code generation and refactoring
- ✅ Error detection and fixing

### Upcoming Features
- 🔲 Voice-to-code functionality
- 🔲 AI-powered code reviews
- 🔲 Automated testing generation
- 🔲 Performance benchmarking
- 🔲 Custom AI model training

## 💡 Tips for Best Results

### 1. Be Specific
Instead of: "Help with my code"
Use: "Help me optimize this React component for better performance"

### 2. Provide Context  
Include relevant code, file structure, and error messages

### 3. Iterative Refinement
Start with basic requests, then refine based on AI responses

### 4. Review Generated Code
Always review and test AI-generated code before using in production

### 5. Use Selection Context
Select specific code sections for targeted assistance

## 📚 API Reference

### REST Endpoints

#### Chat with AI
```http
POST /api/ai/chat
Content-Type: application/json

{
  "projectId": "project-123",
  "message": "How do I add authentication?",
  "options": {
    "includeProjectContext": true,
    "currentFile": "src/App.tsx"
  }
}
```

#### Generate Code
```http
POST /api/ai/generate-code
Content-Type: application/json

{
  "projectId": "project-123",
  "prompt": "Create a login component",
  "filePath": "src/components/Login.tsx"
}
```

#### Code Analysis
```http
POST /api/ai/analyze-project
Content-Type: application/json

{
  "projectId": "project-123",
  "includeDetailedAnalysis": true
}
```

### Frontend Service

```typescript
import { AIService } from '@/services/AIService';

const aiService = AIService.getInstance();

// Chat with AI
const response = await aiService.chat(
  projectId, 
  message, 
  conversationId,
  options
);

// Generate code
const generation = await aiService.generateCode(
  projectId,
  prompt,
  filePath,
  options
);
```

## 🤝 Contributing

Want to improve the AI features? See our [Contributing Guide](CONTRIBUTING.md) for:
- Adding new AI providers
- Improving context management
- Enhancing code analysis
- Building new AI-powered features

## 📞 Support

Need help with AI features?
- 📖 [Documentation](https://docs.swistack.com)
- 💬 [Discord Community](https://discord.gg/swistack)  
- 🐛 [GitHub Issues](https://github.com/swistack/swistack/issues)
- 📧 [Email Support](mailto:support@swistack.com)

---

**Powered by Claude 3.5 Sonnet and GPT-4** 🚀