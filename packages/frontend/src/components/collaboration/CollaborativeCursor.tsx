'use client';

import React, { useEffect, useState } from 'react';
import { CollaborativeUser } from '../../types/shared';

interface CollaborativeCursorProps {
  user: CollaborativeUser;
  line: number;
  column: number;
  editorElement: HTMLElement | null;
}

const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  user,
  line,
  column,
  editorElement
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const getUserColor = (userId: string) => {
    const colors = [
      'rgb(239, 68, 68)',   // red
      'rgb(59, 130, 246)',  // blue
      'rgb(34, 197, 94)',   // green
      'rgb(234, 179, 8)',   // yellow
      'rgb(168, 85, 247)',  // purple
      'rgb(236, 72, 153)',  // pink
      'rgb(99, 102, 241)',  // indigo
      'rgb(20, 184, 166)',  // teal
      'rgb(249, 115, 22)',  // orange
      'rgb(6, 182, 212)'    // cyan
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    if (!editorElement) return;

    // Try to find Monaco editor instance
    const monacoEditor = (editorElement as any)?._monacoEditor;
    if (monacoEditor) {
      try {
        // Convert line/column to position in Monaco
        const position = monacoEditor.getScrolledVisiblePosition({
          lineNumber: line + 1, // Monaco is 1-based
          column: column + 1
        });

        if (position) {
          const editorRect = editorElement.getBoundingClientRect();
          setPosition({
            top: position.top + editorRect.top,
            left: position.left + editorRect.left
          });
        }
      } catch (error) {
        console.warn('Could not get cursor position from Monaco editor:', error);
      }
    } else {
      // Fallback for non-Monaco editors
      // This is a simple approximation
      const lineHeight = 20; // Approximate line height
      const charWidth = 8; // Approximate character width
      
      const editorRect = editorElement.getBoundingClientRect();
      setPosition({
        top: editorRect.top + (line * lineHeight),
        left: editorRect.left + (column * charWidth)
      });
    }
  }, [editorElement, line, column]);

  if (!position || !editorElement) {
    return null;
  }

  const userColor = getUserColor(user.id);

  return (
    <>
      {/* Cursor line */}
      <div
        className="absolute pointer-events-none z-50"
        style={{
          top: position.top,
          left: position.left,
          backgroundColor: userColor,
          width: '2px',
          height: '20px',
          animation: 'cursor-blink 1s infinite'
        }}
      />
      
      {/* User label */}
      <div
        className="absolute pointer-events-none z-50 text-xs text-white px-2 py-1 rounded whitespace-nowrap"
        style={{
          top: position.top - 25,
          left: position.left,
          backgroundColor: userColor,
          fontSize: '11px'
        }}
      >
        {user.username}
      </div>

      <style jsx>{`
        @keyframes cursor-blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0.3;
          }
        }
      `}</style>
    </>
  );
};

export default CollaborativeCursor;