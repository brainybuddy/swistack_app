import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ProjectFileModel } from '../models/ProjectFile';
import path from 'path';

const router = express.Router();

interface SearchResult {
  file: string;
  path: string;
  line: number;
  column: number;
  content: string;
  preview: string;
  match: string;
  fileId: string;
}

interface FileResult {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  mimeType?: string;
}

// Search in database file content
async function searchInFileContent(fileContent: string, filePath: string, fileId: string, query: string, isRegex: boolean = false): Promise<SearchResult[]> {
  try {
    if (!fileContent) return [];
    
    const lines = fileContent.split('\n');
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
            path: filePath,
            fileId: fileId,
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
    console.error(`Error searching in file content ${filePath}:`, error);
    return [];
  }
}

// Helper function to determine search type based on query
function determineSearchType(query: string): 'exact' | 'name' | 'content' | 'unified' {
  // If query looks like a filename with extension, prefer exact search
  if (query.includes('.') && query.split('.').length === 2 && !query.includes(' ')) {
    return 'exact';
  }
  
  // If query has spaces or special characters, likely content search
  if (query.includes(' ') || /[{}()\[\]"']/.test(query)) {
    return 'content';
  }
  
  // Default to unified search
  return 'unified';
}

// Search across project files using database RAG
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
      maxResults = 100,
      searchType // auto-detect if not specified
    } = options;

    let dbFiles: any[] = [];
    
    // Auto-detect search type if not specified
    const detectedSearchType = searchType || determineSearchType(query);
    
    // Choose search strategy based on detected type
    if (detectedSearchType === 'exact') {
      // Exact filename search (e.g., "package.json")
      dbFiles = await ProjectFileModel.searchByExactName(projectId, query, maxResults);
    } else if (detectedSearchType === 'name') {
      // Filename/path search
      dbFiles = await ProjectFileModel.searchByName(projectId, query, maxResults);
    } else if (detectedSearchType === 'content') {
      // Content-only search
      dbFiles = await ProjectFileModel.searchByContent(projectId, query, maxResults);
    } else {
      // Unified search (name, path, and content)
      dbFiles = await ProjectFileModel.searchFiles(projectId, query, maxResults);
    }

    // Filter by extensions if specified
    if (includeExtensions.length > 0 || excludeExtensions.length > 0) {
      dbFiles = dbFiles.filter(file => {
        const ext = path.extname(file.name);
        
        if (includeExtensions.length > 0 && !includeExtensions.includes(ext)) {
          return false;
        }
        
        if (excludeExtensions.includes(ext)) {
          return false;
        }
        
        return true;
      });
    }

    const results: SearchResult[] = [];
    
    // Process each file to find specific line matches
    for (const file of dbFiles.slice(0, maxResults)) {
      if (!file.content) continue;
      
      let searchQuery = query;
      if (wholeWord && !regex) {
        searchQuery = `\\b${query}\\b`;
        regex = true;
      }
      
      const fileResults = await searchInFileContent(
        file.content, 
        file.path, 
        file.id,
        searchQuery, 
        regex
      );
      
      results.push(...fileResults);
      
      // If no content matches but filename/path matched, add file reference
      if (fileResults.length === 0 && (file.name.toLowerCase().includes(query.toLowerCase()) || file.path.toLowerCase().includes(query.toLowerCase()))) {
        results.push({
          file: file.path,
          path: file.path,
          fileId: file.id,
          line: 1,
          column: 1,
          content: file.content?.split('\n')[0] || '',
          preview: `File: ${file.name}`,
          match: query
        });
      }
    }

    res.json({
      success: true,
      data: {
        results: results.slice(0, maxResults),
        query,
        totalFiles: dbFiles.length,
        matchingFiles: new Set(results.map(r => r.fileId)).size,
        totalMatches: results.length,
        truncated: results.length >= maxResults,
        searchType: detectedSearchType
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

// Search for files by name using database RAG
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
      maxResults = 50,
      exactMatch = false
    } = options;

    let dbFiles: any[] = [];
    
    if (exactMatch) {
      // Exact filename match
      dbFiles = await ProjectFileModel.searchByExactName(projectId, query, maxResults);
    } else {
      // Fuzzy name/path search
      dbFiles = await ProjectFileModel.searchByName(projectId, query, maxResults);
    }

    // Convert database files to FileResult format
    const results: FileResult[] = dbFiles.map(file => ({
      id: file.id,
      path: file.path,
      name: file.name,
      type: file.type as 'file' | 'directory',
      size: file.size,
      modified: new Date(file.updatedAt),
      mimeType: file.mimeType
    }));

    res.json({
      success: true,
      data: {
        results,
        query,
        totalFound: results.length,
        truncated: results.length >= maxResults,
        exactMatch
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

// Get file navigation info (symbols, functions, classes) from database
router.get('/projects/:projectId/files/:filePath/symbols', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId, filePath } = req.params;
    
    // Get file from database
    const file = await ProjectFileModel.findByPath(projectId, filePath);
    if (!file || !file.content) {
      return res.status(404).json({
        success: false,
        error: 'File not found or has no content'
      });
    }
    
    const content = file.content;
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

// Quick search across multiple types using database RAG
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

    // Determine search strategy based on query
    const isExactFile = query.includes('.') && query.split('.').length === 2;
    
    // Search for files by name (prioritize exact matches)
    const fileResults = isExactFile
      ? await ProjectFileModel.searchByExactName(projectId, query, 10)
      : await ProjectFileModel.searchByName(projectId, query, 10);

    const formattedFileResults = fileResults.map(file => ({
      type: 'file',
      id: file.id,
      name: file.name,
      path: file.path,
      preview: `File: ${file.name}`,
      mimeType: file.mimeType,
      size: file.size
    }));

    // Search in content (limited for performance)
    const contentFiles = await ProjectFileModel.searchByContent(projectId, query, 20);
    const contentResults: any[] = [];
    
    for (const file of contentFiles.slice(0, 10)) {
      if (!file.content) continue;
      
      const matches = await searchInFileContent(file.content, file.path, file.id, query);
      matches.slice(0, 2).forEach(match => {
        contentResults.push({
          type: 'content',
          id: file.id,
          name: `${file.name}:${match.line}`,
          path: file.path,
          preview: match.preview,
          line: match.line,
          column: match.column
        });
      });
    }

    // Recent files as additional context
    const recentFiles = await ProjectFileModel.getRecentFiles(projectId, 5);
    const recentResults = recentFiles
      .filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase()) ||
        (file.content && file.content.toLowerCase().includes(query.toLowerCase()))
      )
      .map(file => ({
        type: 'recent',
        id: file.id,
        name: file.name,
        path: file.path,
        preview: `Recent: ${file.name}`,
        modified: file.updatedAt
      }));

    res.json({
      success: true,
      data: {
        files: formattedFileResults,
        content: contentResults,
        recent: recentResults,
        query,
        totalResults: formattedFileResults.length + contentResults.length + recentResults.length,
        searchStrategy: isExactFile ? 'exact' : 'fuzzy'
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