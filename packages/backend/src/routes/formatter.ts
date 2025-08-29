import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Basic formatting rules for different languages
const FORMATTING_RULES = {
  javascript: {
    indentSize: 2,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    insertSpaces: true,
    bracketSpacing: true,
    semiColons: true
  },
  typescript: {
    indentSize: 2,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    insertSpaces: true,
    bracketSpacing: true,
    semiColons: true
  },
  python: {
    indentSize: 4,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    insertSpaces: true,
    maxLineLength: 88
  },
  html: {
    indentSize: 2,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    insertSpaces: true,
    wrapAttributes: 'auto'
  },
  css: {
    indentSize: 2,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    insertSpaces: true,
    bracketSpacing: true
  },
  json: {
    indentSize: 2,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    insertSpaces: true
  }
};

// Basic linting rules
const LINTING_RULES = {
  javascript: [
    { id: 'no-console', message: 'Unexpected console statement', severity: 'warning' },
    { id: 'no-unused-vars', message: 'Variable is defined but never used', severity: 'warning' },
    { id: 'no-undef', message: 'Variable is not defined', severity: 'error' },
    { id: 'semi', message: 'Missing semicolon', severity: 'error' }
  ],
  typescript: [
    { id: 'no-console', message: 'Unexpected console statement', severity: 'warning' },
    { id: 'no-unused-vars', message: 'Variable is defined but never used', severity: 'warning' },
    { id: 'no-undef', message: 'Variable is not defined', severity: 'error' },
    { id: 'semi', message: 'Missing semicolon', severity: 'error' },
    { id: 'no-any', message: 'Avoid using any type', severity: 'warning' }
  ],
  python: [
    { id: 'line-too-long', message: 'Line too long', severity: 'warning' },
    { id: 'unused-import', message: 'Imported module is not used', severity: 'warning' },
    { id: 'undefined-variable', message: 'Undefined variable', severity: 'error' }
  ]
};

// Format code based on language
function formatCode(content: string, language: string): string {
  const rules = FORMATTING_RULES[language as keyof typeof FORMATTING_RULES];
  if (!rules) return content;

  let formatted = content;

  // Trim trailing whitespace
  if (rules.trimTrailingWhitespace) {
    formatted = formatted.replace(/[ \t]+$/gm, '');
  }

  // Insert final newline
  if (rules.insertFinalNewline && !formatted.endsWith('\n')) {
    formatted += '\n';
  }

  // Basic indentation fixing
  if (rules.insertSpaces && rules.indentSize) {
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentStr = ' '.repeat(rules.indentSize);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Decrease indent for closing brackets
      if (/^[}\])]/.test(line)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Apply indentation
      lines[i] = indentStr.repeat(indentLevel) + line;

      // Increase indent for opening brackets
      if (/[{\[(]$/.test(line) || (language === 'python' && line.endsWith(':'))) {
        indentLevel++;
      }
    }

    formatted = lines.join('\n');
  }

  // Language-specific formatting
  if (language === 'json') {
    try {
      const parsed = JSON.parse(formatted);
      formatted = JSON.stringify(parsed, null, rules.indentSize);
    } catch (e) {
      // Keep original if not valid JSON
    }
  }

  return formatted;
}

// Basic linting function
function lintCode(content: string, language: string) {
  const rules = LINTING_RULES[language as keyof typeof LINTING_RULES] || [];
  const issues = [];
  const lines = content.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNumber = lineIndex + 1;

    // Check for console statements
    if ((language === 'javascript' || language === 'typescript') && line.includes('console.')) {
      issues.push({
        line: lineNumber,
        column: line.indexOf('console.') + 1,
        message: 'Unexpected console statement',
        severity: 'warning',
        ruleId: 'no-console'
      });
    }

    // Check for missing semicolons in JS/TS
    if ((language === 'javascript' || language === 'typescript')) {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') && 
          !trimmed.startsWith('//') && 
          !trimmed.startsWith('/*') && 
          !trimmed.includes('if ') && 
          !trimmed.includes('for ') && 
          !trimmed.includes('while ') &&
          !trimmed.includes('else') &&
          /^(const|let|var|return|throw)\s/.test(trimmed)) {
        issues.push({
          line: lineNumber,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'error',
          ruleId: 'semi'
        });
      }
    }

    // Check line length for Python
    if (language === 'python' && line.length > 88) {
      issues.push({
        line: lineNumber,
        column: 89,
        message: 'Line too long (88 characters)',
        severity: 'warning',
        ruleId: 'line-too-long'
      });
    }

    // Check for 'any' type in TypeScript
    if (language === 'typescript' && line.includes(': any')) {
      issues.push({
        line: lineNumber,
        column: line.indexOf(': any') + 1,
        message: 'Avoid using any type',
        severity: 'warning',
        ruleId: 'no-any'
      });
    }
  }

  return issues;
}

// Format code endpoint
router.post('/format', authenticateToken, (req: Request, res: Response) => {
  try {
    const { content, language, options = {} } = req.body;

    if (!content || !language) {
      return res.status(400).json({
        success: false,
        error: 'Content and language are required'
      });
    }

    const formattedContent = formatCode(content, language);

    res.json({
      success: true,
      data: {
        formatted: formattedContent,
        language,
        changes: content !== formattedContent
      }
    });
  } catch (error) {
    console.error('Error formatting code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to format code'
    });
  }
});

// Lint code endpoint
router.post('/lint', authenticateToken, (req: Request, res: Response) => {
  try {
    const { content, language, options = {} } = req.body;

    if (!content || !language) {
      return res.status(400).json({
        success: false,
        error: 'Content and language are required'
      });
    }

    const issues = lintCode(content, language);

    res.json({
      success: true,
      data: {
        issues,
        language,
        summary: {
          errors: issues.filter(i => i.severity === 'error').length,
          warnings: issues.filter(i => i.severity === 'warning').length,
          total: issues.length
        }
      }
    });
  } catch (error) {
    console.error('Error linting code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lint code'
    });
  }
});

// Get formatting options for a language
router.get('/format-options/:language', authenticateToken, (req: Request, res: Response) => {
  try {
    const { language } = req.params;
    const options = FORMATTING_RULES[language as keyof typeof FORMATTING_RULES];

    if (!options) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}`
      });
    }

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error getting format options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get format options'
    });
  }
});

// Get linting rules for a language
router.get('/lint-rules/:language', authenticateToken, (req: Request, res: Response) => {
  try {
    const { language } = req.params;
    const rules = LINTING_RULES[language as keyof typeof LINTING_RULES];

    if (!rules) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}`
      });
    }

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error getting lint rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lint rules'
    });
  }
});

export default router;