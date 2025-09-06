import { ProjectFileModel } from '../../models/ProjectFile';

interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  shouldUseRAG: boolean;
}

interface RAGResponse {
  type: 'count_files' | 'list_tree' | 'search_files' | 'read_file';
  result: any;
  query: string;
}

export class QueryRouter {
  /**
   * Determines if a query should be handled by RAG system
   */
  static shouldUseRAG(message: string): boolean {
    // Extract actual user query from context wrapper
    let actualMessage = message;
    const contextMatch = message.match(/\[\[CONTEXT\]\].*?\[\[\/CONTEXT\]\]\s*\n*(.*)/s);
    if (contextMatch && contextMatch[1]) {
      actualMessage = contextMatch[1].trim();
    }
    
    const lower = actualMessage.toLowerCase().trim();
    
    // Definitive RAG patterns - only trigger for explicit file operations
    const ragPatterns = [
      /\b(search|find)\s+(for\s+)?[\w\.-]+\.(js|jsx|ts|tsx|json|md|css|html|py|java)/i,
      /\b(search|find)\s+(for\s+)?file/i,
      /\b(how many|count)\s+(files?|items?)/i,
      
      // Comprehensive file listing patterns
      /^(ls|dir)(\s+-\w+)?$/, // Unix/DOS commands
      /\b(list|show|display|enumerate|get|provide|give me|present|print|retrieve|pull|fetch|generate|produce|compile|output|gimme)\b.*(files?|file list|file listing|directory|contents?|structure|hierarchy|tree|manifest|inventory|index|rundown|breakdown|objects?)\b/i,
      /\b(what('s|s)?|can you|will you|could you|do we have|i need|i'd like|let's see|hit me|what's the deal)\b.*(files?|file list|file listing|directory|contents?|structure|hierarchy|inventory)\b/i,
      /\b(files?|file list),?\s+(please|stat!?)\b/i, // "Files, please" or "File list, STAT!"
      /\b(show me what you('ve| have) got|run the file list|pull up the file list|scan.*for files)\b/i,
      /\b(what files are|what's in|what are the files)\b/i,
      /\b(can i see|can you show me|can you list)\b.*(files?|directory)\b/i,
      
      /\b(read|open|show)\s+[\w\.-]+\.(js|jsx|ts|tsx|json|md|css|html|py|java)/i,
      /\b(find|search for|show me)\s+[\w\.-]+\.json/i, // More specific for JSON files
      /\.(js|jsx|ts|tsx|json|md|css|html)$/i
    ];

    return ragPatterns.some(pattern => pattern.test(lower));
  }

  /**
   * Routes query to appropriate RAG function
   */
  static async routeRAGQuery(message: string, projectId: string): Promise<QueryResult> {
    // Extract actual user query from context wrapper
    let actualMessage = message;
    const contextMatch = message.match(/\[\[CONTEXT\]\].*?\[\[\/CONTEXT\]\]\s*\n*(.*)/s);
    if (contextMatch && contextMatch[1]) {
      actualMessage = contextMatch[1].trim();
    }
    
    const lower = actualMessage.toLowerCase().trim();

    try {
      // Count files
      if (/\b(how many files|file count|count files)\b/.test(lower)) {
        const files = await ProjectFileModel.getProjectTree(projectId);
        const count = files.filter(f => f.type === 'file').length;
        return {
          success: true,
          shouldUseRAG: true,
          data: {
            type: 'count_files',
            result: { count, message: `Found ${count} files in the project` },
            query: actualMessage
          }
        };
      }

      // List files/tree - comprehensive pattern matching
      const fileListPatterns = [
        /^(ls|dir)(\s+-\w+)?$/, // Unix/DOS commands
        /\b(list|show|display|enumerate|get|provide|give me|present|print|retrieve|pull|fetch|generate|produce|compile|output|gimme)\b.*(files?|file list|file listing|directory|contents?|structure|hierarchy|tree|manifest|inventory|index|rundown|breakdown|objects?)\b/i,
        /\b(what('s|s)?|can you|will you|could you|do we have|i need|i'd like|let's see|hit me|what's the deal)\b.*(files?|file list|file listing|directory|contents?|structure|hierarchy|inventory)\b/i,
        /\b(files?|file list),?\s+(please|stat!?)\b/i,
        /\b(show me what you('ve| have) got|run the file list|pull up the file list|scan.*for files)\b/i,
        /\b(what files are|what's in|what are the files)\b/i,
        /\b(can i see|can you show me|can you list)\b.*(files?|directory)\b/i
      ];
      
      if (fileListPatterns.some(pattern => pattern.test(lower))) {
        const files = await ProjectFileModel.getProjectTree(projectId);
        return {
          success: true,
          shouldUseRAG: true,
          data: {
            type: 'list_tree',
            result: files.map(f => ({ path: f.path, type: f.type, name: f.name })),
            query: message
          }
        };
      }

      // Search files
      if (/\b(search|find)\b/.test(lower)) {
        const queryMatch = actualMessage.match(/(?:search|find)(?:\s+for)?\s+(.+)/i);
        const searchQuery = queryMatch ? queryMatch[1].trim().replace(/[.?!]$/, '') : '';
        
        if (searchQuery) {
          // Try exact filename first
          let matches = await ProjectFileModel.searchByExactName(projectId, searchQuery, 50);
          
          if (!matches || matches.length === 0) {
            // Try partial filename/path match
            matches = await ProjectFileModel.searchByName(projectId, searchQuery, 50);
          }
          
          if (!matches || matches.length === 0) {
            // Try content search
            matches = await ProjectFileModel.searchByContent(projectId, searchQuery, 50);
          }

          const results = matches ? matches.map(m => ({ 
            path: m.path, 
            name: m.name, 
            content: m.content ? m.content.substring(0, 200) + '...' : '',
            type: m.type
          })) : [];

          return {
            success: true,
            shouldUseRAG: true,
            data: {
              type: 'search_files',
              result: results,
              query: actualMessage,
              searchQuery,
              totalFound: results.length
            }
          };
        }
      }

      // Read file
      if (/\b(read|open|show)\b/i.test(actualMessage)) {
        const fileMatch = actualMessage.match(/[\w\.-]+\.(?:js|jsx|ts|tsx|json|md|css|html|py|java|txt)/i);
        if (fileMatch) {
          const filename = fileMatch[0];
          let file = await ProjectFileModel.findByPath(projectId, filename);
          
          if (!file) {
            // Try finding by filename only
            const files = await ProjectFileModel.searchByExactName(projectId, filename, 1);
            file = files && files.length > 0 ? files[0] : null;
          }

          if (file) {
            return {
              success: true,
              shouldUseRAG: true,
              data: {
                type: 'read_file',
                result: {
                  path: file.path,
                  name: file.name,
                  content: file.content || 'File content not available',
                  size: file.size,
                  type: file.type
                },
                query: message
              }
            };
          }
        }
      }

      // If no RAG pattern matched, indicate it should use LLM
      return {
        success: false,
        shouldUseRAG: false,
        error: 'No RAG pattern matched'
      };

    } catch (error) {
      console.error('[QueryRouter] RAG query failed:', error);
      return {
        success: false,
        shouldUseRAG: true, // It was a RAG query, but failed
        error: error instanceof Error ? error.message : 'RAG query failed'
      };
    }
  }

  /**
   * Formats RAG response for WebSocket emission
   */
  static formatRAGResponse(ragResult: any): string {
    const { type, result, query, searchQuery, totalFound } = ragResult;

    switch (type) {
      case 'count_files':
        return `I found ${result.count} files in your project.`;

      case 'list_tree':
        const fileList = result.slice(0, 20).map((f: any) => `- ${f.path}`).join('\n');
        const remaining = result.length > 20 ? `\n... and ${result.length - 20} more files` : '';
        return `Here are the files in your project:\n\n${fileList}${remaining}`;

      case 'search_files':
        if (result.length === 0) {
          return `I couldn't find any files matching "${searchQuery}".`;
        }
        const searchResults = result.slice(0, 10).map((f: any) => {
          const preview = f.content ? `\nPreview: ${f.content}` : '';
          return `**${f.path}**${preview}`;
        }).join('\n\n');
        const moreResults = result.length > 10 ? `\n\n... and ${result.length - 10} more matches` : '';
        return `I found ${totalFound} file(s) matching "${searchQuery}":\n\n${searchResults}${moreResults}`;

      case 'read_file':
        return `Here's the content of **${result.path}**:\n\n\`\`\`\n${result.content}\n\`\`\``;

      default:
        return 'Query completed successfully.';
    }
  }
}