'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Code2,
  Save,
  FolderOpen,
  Settings,
  Palette,
  Zap,
  GitBranch,
  Terminal,
  Play,
  Square,
  RotateCcw,
  Copy,
  Scissors,
  FileSearch,
  Replace,
  ArrowRight,
  Keyboard,
  Command as CommandIcon
} from 'lucide-react';
import { Command, CommandPaletteItem } from '@swistack/shared';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: Command) => void;
  projectId?: string;
  activeFile?: string;
  className?: string;
}

// Define all available commands
const BUILT_IN_COMMANDS: Command[] = [
  // File operations
  {
    id: 'file.new',
    title: 'New File',
    category: 'File',
    keybinding: 'Ctrl+N',
    icon: 'FileText'
  },
  {
    id: 'file.open',
    title: 'Open File',
    category: 'File',
    keybinding: 'Ctrl+O',
    icon: 'FolderOpen'
  },
  {
    id: 'file.save',
    title: 'Save File',
    category: 'File',
    keybinding: 'Ctrl+S',
    icon: 'Save'
  },
  {
    id: 'file.save-all',
    title: 'Save All Files',
    category: 'File',
    keybinding: 'Ctrl+K Ctrl+S',
    icon: 'Save'
  },
  {
    id: 'file.close',
    title: 'Close File',
    category: 'File',
    keybinding: 'Ctrl+W',
    icon: 'FileText'
  },

  // Edit operations
  {
    id: 'edit.copy',
    title: 'Copy',
    category: 'Edit',
    keybinding: 'Ctrl+C',
    icon: 'Copy'
  },
  {
    id: 'edit.cut',
    title: 'Cut',
    category: 'Edit',
    keybinding: 'Ctrl+X',
    icon: 'Scissors'
  },
  {
    id: 'edit.paste',
    title: 'Paste',
    category: 'Edit',
    keybinding: 'Ctrl+V',
    icon: 'FileText'
  },
  {
    id: 'edit.undo',
    title: 'Undo',
    category: 'Edit',
    keybinding: 'Ctrl+Z',
    icon: 'RotateCcw'
  },
  {
    id: 'edit.redo',
    title: 'Redo',
    category: 'Edit',
    keybinding: 'Ctrl+Y',
    icon: 'ArrowRight'
  },

  // Search operations
  {
    id: 'search.find',
    title: 'Find in File',
    category: 'Search',
    keybinding: 'Ctrl+F',
    icon: 'Search'
  },
  {
    id: 'search.find-replace',
    title: 'Find and Replace',
    category: 'Search',
    keybinding: 'Ctrl+H',
    icon: 'Replace'
  },
  {
    id: 'search.find-in-files',
    title: 'Find in Files',
    category: 'Search',
    keybinding: 'Ctrl+Shift+F',
    icon: 'FileSearch'
  },
  {
    id: 'search.goto-line',
    title: 'Go to Line',
    category: 'Search',
    keybinding: 'Ctrl+G',
    icon: 'ArrowRight'
  },

  // Code operations
  {
    id: 'code.format',
    title: 'Format Document',
    category: 'Code',
    keybinding: 'Shift+Alt+F',
    icon: 'Code2'
  },
  {
    id: 'code.format-selection',
    title: 'Format Selection',
    category: 'Code',
    keybinding: 'Ctrl+K Ctrl+F',
    icon: 'Code2'
  },
  {
    id: 'code.comment-line',
    title: 'Toggle Line Comment',
    category: 'Code',
    keybinding: 'Ctrl+/',
    icon: 'Code2'
  },
  {
    id: 'code.comment-block',
    title: 'Toggle Block Comment',
    category: 'Code',
    keybinding: 'Shift+Alt+A',
    icon: 'Code2'
  },

  // View operations
  {
    id: 'view.command-palette',
    title: 'Show Command Palette',
    category: 'View',
    keybinding: 'Ctrl+Shift+P',
    icon: 'CommandIcon'
  },
  {
    id: 'view.explorer',
    title: 'Toggle Explorer',
    category: 'View',
    keybinding: 'Ctrl+Shift+E',
    icon: 'FolderOpen'
  },
  {
    id: 'view.terminal',
    title: 'Toggle Terminal',
    category: 'View',
    keybinding: 'Ctrl+`',
    icon: 'Terminal'
  },
  {
    id: 'view.split-editor',
    title: 'Split Editor',
    category: 'View',
    keybinding: 'Ctrl+\\',
    icon: 'Code2'
  },

  // Git operations
  {
    id: 'git.commit',
    title: 'Git: Commit',
    category: 'Git',
    keybinding: 'Ctrl+Shift+G',
    icon: 'GitBranch'
  },
  {
    id: 'git.push',
    title: 'Git: Push',
    category: 'Git',
    icon: 'GitBranch'
  },
  {
    id: 'git.pull',
    title: 'Git: Pull',
    category: 'Git',
    icon: 'GitBranch'
  },
  {
    id: 'git.branch',
    title: 'Git: Create Branch',
    category: 'Git',
    icon: 'GitBranch'
  },

  // Project operations
  {
    id: 'project.run',
    title: 'Run Project',
    category: 'Project',
    keybinding: 'F5',
    icon: 'Play'
  },
  {
    id: 'project.stop',
    title: 'Stop Project',
    category: 'Project',
    keybinding: 'Shift+F5',
    icon: 'Square'
  },
  {
    id: 'project.settings',
    title: 'Project Settings',
    category: 'Project',
    icon: 'Settings'
  },

  // Settings
  {
    id: 'settings.open',
    title: 'Open Settings',
    category: 'Settings',
    keybinding: 'Ctrl+,',
    icon: 'Settings'
  },
  {
    id: 'settings.keyboard',
    title: 'Keyboard Shortcuts',
    category: 'Settings',
    keybinding: 'Ctrl+K Ctrl+S',
    icon: 'Keyboard'
  },
  {
    id: 'settings.theme',
    title: 'Color Theme',
    category: 'Settings',
    icon: 'Palette'
  }
];

const ICON_MAP: Record<string, any> = {
  FileText,
  FolderOpen,
  Save,
  Code2,
  Search,
  Replace,
  FileSearch,
  Copy,
  Scissors,
  RotateCcw,
  ArrowRight,
  CommandIcon,
  Terminal,
  GitBranch,
  Play,
  Square,
  Settings,
  Keyboard,
  Palette,
  Zap
};

export default function CommandPalette({
  isOpen,
  onClose,
  onExecuteCommand,
  projectId,
  activeFile,
  className = ''
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<CommandPaletteItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and score commands based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredCommands(
        BUILT_IN_COMMANDS.slice(0, 10).map(cmd => ({
          command: cmd,
          score: 0,
          matches: []
        }))
      );
      return;
    }

    const results: CommandPaletteItem[] = [];
    const searchQuery = query.toLowerCase();

    BUILT_IN_COMMANDS.forEach(command => {
      const titleLower = command.title.toLowerCase();
      const categoryLower = command.category.toLowerCase();
      
      // Calculate score based on matches
      let score = 0;
      const matches: number[] = [];

      // Exact match bonus
      if (titleLower === searchQuery) {
        score += 100;
      } else if (titleLower.includes(searchQuery)) {
        score += 50;
        // Find match positions
        let index = titleLower.indexOf(searchQuery);
        while (index !== -1) {
          for (let i = 0; i < searchQuery.length; i++) {
            matches.push(index + i);
          }
          index = titleLower.indexOf(searchQuery, index + 1);
        }
      }

      // Category match
      if (categoryLower.includes(searchQuery)) {
        score += 20;
      }

      // Fuzzy match scoring
      let fuzzyScore = 0;
      let queryIndex = 0;
      for (let i = 0; i < titleLower.length && queryIndex < searchQuery.length; i++) {
        if (titleLower[i] === searchQuery[queryIndex]) {
          fuzzyScore += 10;
          matches.push(i);
          queryIndex++;
        }
      }
      
      if (queryIndex === searchQuery.length) {
        score += fuzzyScore;
      }

      // Only include commands with some relevance
      if (score > 0) {
        results.push({
          command,
          score,
          matches: [...new Set(matches)].sort((a, b) => a - b)
        });
      }
    });

    // Sort by score (highest first) and limit results
    results.sort((a, b) => b.score - a.score);
    setFilteredCommands(results.slice(0, 20));
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            Math.min(filteredCommands.length - 1, prev + 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleExecuteCommand(filteredCommands[selectedIndex].command);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleExecuteCommand = (command: Command) => {
    onExecuteCommand(command);
    onClose();
  };

  const highlightMatches = (text: string, matches: number[]) => {
    if (matches.length === 0) return text;

    const elements = [];
    let lastIndex = 0;

    matches.forEach((matchIndex, i) => {
      // Add text before match
      if (matchIndex > lastIndex) {
        elements.push(text.slice(lastIndex, matchIndex));
      }
      
      // Add matched character
      elements.push(
        <span key={i} className="bg-teal-500/30 text-teal-200">
          {text[matchIndex]}
        </span>
      );
      
      lastIndex = matchIndex + 1;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center pt-20 ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-700">
          <Search className="w-4 h-4 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm"
          />
          <div className="text-xs text-gray-500 ml-4">
            <span className="px-1.5 py-0.5 bg-gray-700 rounded">Esc</span> to close
          </div>
        </div>

        {/* Command List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {query ? 'No commands found' : 'Start typing to search commands...'}
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const IconComponent = ICON_MAP[item.command.icon || 'Code2'];
              
              return (
                <div
                  key={item.command.id}
                  onClick={() => handleExecuteCommand(item.command)}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-teal-600/20 border-l-2 border-teal-500' 
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center mr-3">
                    {IconComponent && <IconComponent className="w-4 h-4 text-gray-400" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">
                      {highlightMatches(item.command.title, item.matches)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.command.category}
                    </div>
                  </div>
                  
                  {item.command.keybinding && (
                    <div className="ml-4 text-xs text-gray-400">
                      {item.command.keybinding.split(' ').map((key, i) => (
                        <span key={i} className="inline-block">
                          {i > 0 && ' '}
                          <span className="px-1.5 py-0.5 bg-gray-700 rounded">
                            {key}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {filteredCommands.length > 0 && (
          <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
            <span>
              {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center space-x-4">
              <span>
                <span className="px-1.5 py-0.5 bg-gray-700 rounded">↑↓</span> navigate
              </span>
              <span>
                <span className="px-1.5 py-0.5 bg-gray-700 rounded">Enter</span> execute
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}