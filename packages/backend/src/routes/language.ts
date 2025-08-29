import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Language definitions and configurations
const LANGUAGE_CONFIGS = {
  javascript: {
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    keywords: ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'export'],
    patterns: {
      comment: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,
      number: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
      function: /\b(\w+)\s*(?=\()/g,
      keyword: new RegExp('\\b(' + ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'export'].join('|') + ')\\b', 'g')
    }
  },
  typescript: {
    extensions: ['.ts', '.tsx'],
    keywords: ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum', 'namespace', 'if', 'else', 'for', 'while', 'return', 'import', 'export'],
    patterns: {
      comment: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,
      number: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
      function: /\b(\w+)\s*(?=\()/g,
      keyword: new RegExp('\\b(' + ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum', 'namespace', 'if', 'else', 'for', 'while', 'return', 'import', 'export'].join('|') + ')\\b', 'g'),
      type: /\b[A-Z]\w*\b/g
    }
  },
  python: {
    extensions: ['.py', '.pyx', '.pyw', '.pyi'],
    keywords: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with'],
    patterns: {
      comment: /#.*$/gm,
      string: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
      number: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
      function: /\bdef\s+(\w+)/g,
      keyword: new RegExp('\\b(' + ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with'].join('|') + ')\\b', 'g')
    }
  },
  html: {
    extensions: ['.html', '.htm'],
    keywords: [],
    patterns: {
      tag: /<\/?[\w\s="/.':;#-\/\?]+>/gi,
      attribute: /\w+(?==)/g,
      string: /"[^"]*"|'[^']*'/g,
      comment: /<!--[\s\S]*?-->/g
    }
  },
  css: {
    extensions: ['.css', '.scss', '.sass', '.less'],
    keywords: [],
    patterns: {
      selector: /[.#]?[\w-]+(?=\s*\{)/g,
      property: /[\w-]+(?=\s*:)/g,
      value: /:\s*[^;]+/g,
      comment: /\/\*[\s\S]*?\*\//g
    }
  },
  json: {
    extensions: ['.json'],
    keywords: [],
    patterns: {
      string: /"(?:[^"\\]|\\.)*"/g,
      number: /\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
      boolean: /\b(?:true|false)\b/g,
      null: /\bnull\b/g
    }
  }
};

// Get supported languages
router.get('/languages', authenticateToken, (req: Request, res: Response) => {
  try {
    const languages = Object.keys(LANGUAGE_CONFIGS).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      extensions: LANGUAGE_CONFIGS[key as keyof typeof LANGUAGE_CONFIGS].extensions
    }));

    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported languages'
    });
  }
});

// Detect language from file extension
router.post('/detect-language', authenticateToken, (req: Request, res: Response) => {
  try {
    const { filename, content } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    let detectedLanguage = 'plaintext';

    // Check each language for matching extension
    for (const [language, config] of Object.entries(LANGUAGE_CONFIGS)) {
      if (config.extensions.includes(ext)) {
        detectedLanguage = language;
        break;
      }
    }

    // If no extension match, try to detect from content
    if (detectedLanguage === 'plaintext' && content) {
      if (content.includes('function') && content.includes('{')) {
        detectedLanguage = 'javascript';
      } else if (content.includes('def ') && content.includes(':')) {
        detectedLanguage = 'python';
      } else if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
        detectedLanguage = 'html';
      } else if (content.includes('{') && content.includes('}') && content.includes(':')) {
        detectedLanguage = 'css';
      }
    }

    res.json({
      success: true,
      data: {
        language: detectedLanguage,
        confidence: detectedLanguage === 'plaintext' ? 0.5 : 0.9
      }
    });
  } catch (error) {
    console.error('Error detecting language:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect language'
    });
  }
});

// Get syntax highlighting tokens
router.post('/highlight', authenticateToken, (req: Request, res: Response) => {
  try {
    const { content, language } = req.body;

    if (!content || !language) {
      return res.status(400).json({
        success: false,
        error: 'Content and language are required'
      });
    }

    const config = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];
    if (!config) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}`
      });
    }

    const tokens: Array<{
      type: string;
      value: string;
      start: number;
      end: number;
    }> = [];

    // Process each pattern type
    Object.entries(config.patterns).forEach(([type, pattern]) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        tokens.push({
          type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length
        });

        // Prevent infinite loop for global regexes
        if (!regex.global) break;
      }
    });

    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);

    res.json({
      success: true,
      data: {
        tokens,
        language,
        lineCount: content.split('\n').length
      }
    });
  } catch (error) {
    console.error('Error highlighting syntax:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to highlight syntax'
    });
  }
});

// Get language-specific completions
router.post('/completions', authenticateToken, (req: Request, res: Response) => {
  try {
    const { content, language, position } = req.body;

    if (!content || !language || position === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Content, language, and position are required'
      });
    }

    const config = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];
    if (!config) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}`
      });
    }

    const completions = [];

    // Get word at cursor position
    const beforeCursor = content.substring(0, position);
    const wordMatch = beforeCursor.match(/\w+$/);
    const prefix = wordMatch ? wordMatch[0] : '';

    // Add keyword completions
    for (const keyword of config.keywords) {
      if (keyword.startsWith(prefix.toLowerCase())) {
        completions.push({
          label: keyword,
          kind: 'keyword',
          insertText: keyword,
          documentation: `${language} keyword: ${keyword}`
        });
      }
    }

    // Add common snippets based on language
    if (language === 'javascript' || language === 'typescript') {
      if ('function'.startsWith(prefix.toLowerCase())) {
        completions.push({
          label: 'function',
          kind: 'snippet',
          insertText: 'function ${1:name}(${2:params}) {\n\t${3:// TODO}\n}',
          documentation: 'Function declaration'
        });
      }
      if ('console'.startsWith(prefix.toLowerCase())) {
        completions.push({
          label: 'console.log',
          kind: 'method',
          insertText: 'console.log(${1:value})',
          documentation: 'Log to console'
        });
      }
    } else if (language === 'python') {
      if ('def'.startsWith(prefix.toLowerCase())) {
        completions.push({
          label: 'def',
          kind: 'snippet',
          insertText: 'def ${1:function_name}(${2:params}):\n\t${3:pass}',
          documentation: 'Function definition'
        });
      }
    }

    res.json({
      success: true,
      data: {
        completions,
        prefix
      }
    });
  } catch (error) {
    console.error('Error getting completions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get completions'
    });
  }
});

export default router;