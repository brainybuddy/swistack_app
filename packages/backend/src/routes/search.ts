import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { promises as fs } from 'fs';
import path from 'path';

const router = express.Router();

interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  preview: string;
  match: string;
}

interface FileResult {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

// Search in file content
async function searchInFile(filePath: string, query: string, isRegex: boolean = false): Promise<SearchResult[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const results: SearchResult[] = [];

    const searchPattern = isRegex ? new RegExp(query, 'gi') : query.toLowerCase();

    lines.forEach((line, lineIndex) => {
      const lineContent = line.toLowerCase();
      let matches: RegExpMatchArray[] = [];

      if (isRegex && searchPattern instanceof RegExp) {
        const match = line.match(searchPattern);
        if (match) {
          matches = [match];
        }
      } else {
        const index = lineContent.indexOf(searchPattern as string);
        if (index !== -1) {
          matches = [{
            0: line.substring(index, index + (searchPattern as string).length),
            index,
            input: line,
            groups: undefined
          } as RegExpMatchArray];
        }
      }

      matches.forEach(match => {
        if (match.index !== undefined) {
          results.push({
            file: filePath,
            line: lineIndex + 1,
            column: match.index + 1,
            content: line,
            preview: line.trim(),
            match: match[0]
          });
        }
      });
    });

    return results;
  } catch (error) {
    console.error(`Error searching in file ${filePath}:`, error);
    return [];
  }
}

// Get all files in directory recursively
async function getAllFiles(dirPath: string, maxDepth: number = 10, currentDepth: number = 0): Promise<string[]> {
  if (currentDepth > maxDepth) return [];

  try {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip hidden files and common ignore patterns
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist' || 
          entry.name === 'build') {
        continue;
      }

      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, maxDepth, currentDepth + 1);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

// Search across project files
router.post('/projects/:projectId/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { query, options = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const {
      caseSensitive = false,
      regex = false,
      wholeWord = false,
      includeExtensions = [],
      excludeExtensions = ['.log', '.tmp', '.cache'],
      maxResults = 100
    } = options;

    // Use current working directory as the project directory
    const projectDir = process.cwd();
    
    let searchQuery = query;
    if (!caseSensitive && !regex) {
      searchQuery = query.toLowerCase();
    }

    if (wholeWord && !regex) {
      searchQuery = new RegExp(`\\b${query}\\b`, caseSensitive ? 'g' : 'gi');
    }

    const allFiles = await getAllFiles(projectDir);
    const results: SearchResult[] = [];

    // Filter files by extension
    const filteredFiles = allFiles.filter(file => {
      const ext = path.extname(file);
      
      if (includeExtensions.length > 0 && !includeExtensions.includes(ext)) {
        return false;
      }
      
      if (excludeExtensions.includes(ext)) {
        return false;
      }
      
      return true;
    });

    // Search in each file
    for (const file of filteredFiles) {
      if (results.length >= maxResults) break;
      
      const fileResults = await searchInFile(file, searchQuery, regex || wholeWord);
      results.push(...fileResults.slice(0, maxResults - results.length));
    }

    res.json({
      success: true,
      data: {
        results,
        query,
        totalFiles: filteredFiles.length,
        matchingFiles: new Set(results.map(r => r.file)).size,
        totalMatches: results.length,
        truncated: results.length >= maxResults
      }
    });
  } catch (error) {
    console.error('Error searching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search project'
    });
  }
});

// Search for files by name
router.post('/projects/:projectId/find-files', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { query, options = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'File name query is required'
      });
    }

    const {
      caseSensitive = false,
      regex = false,
      maxResults = 50
    } = options;

    // Use current working directory as the project directory
    const projectDir = process.cwd();
    
    const allFiles = await getAllFiles(projectDir);
    const results: FileResult[] = [];

    const searchPattern = regex 
      ? new RegExp(query, caseSensitive ? 'g' : 'gi')
      : caseSensitive ? query : query.toLowerCase();

    for (const filePath of allFiles) {
      if (results.length >= maxResults) break;
      
      const fileName = path.basename(filePath);
      const searchTarget = caseSensitive ? fileName : fileName.toLowerCase();
      
      let isMatch = false;
      
      if (regex && searchPattern instanceof RegExp) {
        isMatch = searchPattern.test(fileName);
      } else {
        isMatch = searchTarget.includes(searchPattern as string);
      }
      
      if (isMatch) {
        try {
          const stats = await fs.stat(filePath);
          results.push({
            path: filePath,
            name: fileName,
            type: 'file',
            size: stats.size,
            modified: stats.mtime
          });
        } catch (error) {
          // Skip files that can't be accessed
          continue;
        }
      }
    }

    res.json({
      success: true,
      data: {
        results,
        query,
        totalFound: results.length,
        truncated: results.length >= maxResults
      }
    });
  } catch (error) {
    console.error('Error finding files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find files'
    });
  }
});

// Get file navigation info (symbols, functions, classes)
router.get('/projects/:projectId/files/:filePath/symbols', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId, filePath } = req.params;
    
    // Use current working directory and join with the requested file path
    const actualFilePath = path.join(process.cwd(), filePath);
    
    const content = await fs.readFile(actualFilePath, 'utf-8');
    const lines = content.split('\n');
    const symbols: Array<{name: string, kind: string, line: number, column?: number, scope?: string}> = [];

    // Simple symbol extraction for JavaScript/TypeScript
    const fileExt = path.extname(filePath);
    
    if (['.js', '.jsx', '.ts', '.tsx'].includes(fileExt)) {
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Functions
        const funcMatch = trimmed.match(/^(export\s+)?(async\s+)?function\s+(\w+)/);
        if (funcMatch) {
          symbols.push({
            name: funcMatch[3],
            kind: 'function',
            line: index + 1,
            column: line.indexOf(funcMatch[3]) + 1,
            scope: 'global'
          });
        }
        
        // Arrow functions
        const arrowMatch = trimmed.match(/^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*\(/);
        if (arrowMatch) {
          symbols.push({
            name: arrowMatch[3],
            kind: 'function',
            line: index + 1,
            column: line.indexOf(arrowMatch[3]) + 1,
            scope: 'global'
          });
        }
        
        // Classes
        const classMatch = trimmed.match(/^(export\s+)?(abstract\s+)?class\s+(\w+)/);
        if (classMatch) {
          symbols.push({
            name: classMatch[3],
            kind: 'class',
            line: index + 1,
            column: line.indexOf(classMatch[3]) + 1,
            scope: 'global'
          });
        }
        
        // Interfaces (TypeScript)
        const interfaceMatch = trimmed.match(/^(export\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
          symbols.push({
            name: interfaceMatch[2],
            kind: 'interface',
            line: index + 1,
            column: line.indexOf(interfaceMatch[2]) + 1,
            scope: 'global'
          });
        }
        
        // Types (TypeScript)
        const typeMatch = trimmed.match(/^(export\s+)?type\s+(\w+)/);
        if (typeMatch) {
          symbols.push({
            name: typeMatch[2],
            kind: 'type',
            line: index + 1,
            column: line.indexOf(typeMatch[2]) + 1,
            scope: 'global'
          });
        }
      });
    } else if (fileExt === '.py') {
      // Python symbols
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Functions
        const funcMatch = trimmed.match(/^def\s+(\w+)/);
        if (funcMatch) {
          symbols.push({
            name: funcMatch[1],
            kind: 'function',
            line: index + 1,
            column: line.indexOf('def') + 1,
            scope: 'global'
          });
        }
        
        // Classes
        const classMatch = trimmed.match(/^class\s+(\w+)/);
        if (classMatch) {
          symbols.push({
            name: classMatch[1],
            kind: 'class',
            line: index + 1,
            column: line.indexOf('class') + 1,
            scope: 'global'
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        symbols,
        file: filePath,
        language: fileExt.substring(1)
      }
    });
  } catch (error) {
    console.error('Error getting file symbols:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file symbols'
    });
  }
});

// Quick search across multiple types
router.post('/projects/:projectId/quick-search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const projectDir = process.cwd();
    
    // Search for files
    const allFiles = await getAllFiles(projectDir);
    const fileResults = allFiles
      .filter(file => path.basename(file).toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
      .map(file => ({
        type: 'file',
        name: path.basename(file),
        path: file,
        preview: `File: ${path.basename(file)}`
      }));

    // Search in content (limited)
    const contentResults: any[] = [];
    const searchFiles = allFiles.slice(0, 20); // Limit files to search for performance
    
    for (const file of searchFiles) {
      if (contentResults.length >= 10) break;
      
      const matches = await searchInFile(file, query);
      matches.slice(0, 2).forEach(match => {
        contentResults.push({
          type: 'content',
          name: `${path.basename(match.file)}:${match.line}`,
          path: match.file,
          preview: match.preview,
          line: match.line
        });
      });
    }

    res.json({
      success: true,
      data: {
        files: fileResults,
        content: contentResults,
        query,
        hasMore: allFiles.length > 20
      }
    });
  } catch (error) {
    console.error('Error in quick search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform quick search'
    });
  }
});

export default router;