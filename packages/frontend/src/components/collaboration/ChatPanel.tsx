'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Reply,
  Edit3,
  Trash2,
  Copy,
  Pin,
  Clock,
  Check,
  CheckCheck,
  X,
  Hash,
  AtSign,
  Image,
  File,
  Code,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'code' | 'file' | 'system';
  timestamp: Date;
  edited?: Date;
  replyTo?: string;
  reactions?: Record<string, string[]>; // emoji -> userIds
  isPinned?: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'general' | 'project' | 'direct';
  participants: string[];
  unreadCount: number;
}

interface ChatPanelProps {
  projectId: string;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀'];

export default function ChatPanel({ 
  projectId, 
  className = '',
  isMinimized = false,
  onToggleMinimize 
}: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [channels] = useState<ChatChannel[]>([
    { id: 'general', name: 'General', type: 'general', participants: [], unreadCount: 0 },
    { id: 'project', name: 'Project Discussion', type: 'project', participants: [], unreadCount: 2 },
  ]);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock messages
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: 'user-2',
        senderName: 'Sarah Chen',
        content: 'Hey everyone! Just pushed the latest changes to the authentication system.',
        type: 'text',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: 'read',
        reactions: { '👍': ['user-3', 'user-1'], '🚀': ['user-1'] }
      },
      {
        id: '2',
        senderId: 'user-3',
        senderName: 'Alex Rodriguez',
        content: 'Great work! I noticed there\'s a small issue with the login validation.',
        type: 'text',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        status: 'read'
      },
      {
        id: '3',
        senderId: user?.id || 'current-user',
        senderName: `${user?.firstName || 'You'} ${user?.lastName || ''}`,
        content: 'function validateLogin(credentials) {\n  if (!credentials.email || !credentials.password) {\n    return { isValid: false, error: "Missing credentials" };\n  }\n  return { isValid: true };\n}',
        type: 'code',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        status: 'read'
      },
      {
        id: '4',
        senderId: 'user-2',
        senderName: 'Sarah Chen',
        content: 'Perfect! That looks much cleaner. Should we also add email format validation?',
        type: 'text',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        replyTo: '3',
        status: 'read'
      },
      {
        id: '5',
        senderId: 'system',
        senderName: 'System',
        content: 'Emma Thompson joined the project',
        type: 'system',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        status: 'delivered'
      }
    ];

    setMessages(mockMessages);
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderAvatar: user.avatar,
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date(),
      status: 'sending',
      replyTo: replyingTo?.id
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setReplyingTo(null);

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, status: 'delivered' } : m
      ));
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!user) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        if (reactions[emoji]) {
          if (reactions[emoji].includes(user.id)) {
            reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            reactions[emoji].push(user.id);
          }
        } else {
          reactions[emoji] = [user.id];
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
    setShowEmojiPicker(null);
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  };

  const getUserAvatar = (senderId: string, senderName: string, avatar?: string) => {
    if (avatar) {
      return <img src={avatar} alt={senderName} className="w-8 h-8 rounded-full" />;
    }

    const initials = senderName.split(' ').map(n => n[0]).join('').substring(0, 2);
    return (
      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
        {initials}
      </div>
    );
  };

  const getStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-gray-500" />;
      case 'sent': return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered': 
      case 'read': return <CheckCheck className="w-3 h-3 text-teal-400" />;
    }
  };

  const getRepliedMessage = (replyId: string) => {
    return messages.find(m => m.id === replyId);
  };

  if (isMinimized) {
    return (
      <div className={`bg-gray-900 border-t border-gray-700 ${className}`}>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Chat</span>
            {channels.some(c => c.unreadCount > 0) && (
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            )}
          </div>
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-gray-800 rounded text-gray-400"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border-t border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-teal-400" />
          <select
            value={activeChannel}
            onChange={(e) => setActiveChannel(e.target.value)}
            className="bg-transparent text-white text-sm font-medium focus:outline-none"
          >
            {channels.map(channel => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
                {channel.unreadCount > 0 && ` (${channel.unreadCount})`}
              </option>
            ))}
          </select>
        </div>
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map(message => {
          const isOwnMessage = message.senderId === user?.id;
          const repliedMessage = message.replyTo ? getRepliedMessage(message.replyTo) : null;

          return (
            <div
              key={message.id}
              className={`group ${isOwnMessage ? 'ml-8' : 'mr-8'}`}
            >
              {/* Reply context */}
              {repliedMessage && (
                <div className="mb-1 pl-4 border-l-2 border-gray-700">
                  <div className="text-xs text-gray-500">
                    Replying to {repliedMessage.senderName}:
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {repliedMessage.content}
                  </div>
                </div>
              )}

              <div className={`flex space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {message.type !== 'system' && (
                  <div className="flex-shrink-0">
                    {getUserAvatar(message.senderId, message.senderName, message.senderAvatar)}
                  </div>
                )}

                <div className={`flex-1 ${message.type === 'system' ? 'text-center' : ''}`}>
                  {message.type !== 'system' && (
                    <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                      <span className="text-sm font-medium text-white">
                        {message.senderName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {isOwnMessage && getStatusIcon(message.status)}
                    </div>
                  )}

                  <div className={`${
                    message.type === 'system' 
                      ? 'text-xs text-gray-500 italic'
                      : `p-3 rounded-lg max-w-full ${
                          isOwnMessage 
                            ? 'bg-teal-600 text-white ml-auto' 
                            : 'bg-gray-800 text-gray-100'
                        } ${message.type === 'code' ? 'font-mono text-sm' : ''}`
                  }`}>
                    {message.type === 'code' ? (
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        <code>{message.content}</code>
                      </pre>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>

                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(message.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(message.id, emoji)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                            userIds.includes(user?.id || '')
                              ? 'bg-teal-600/20 text-teal-400 border border-teal-600/30'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{userIds.length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Actions */}
                  {message.type !== 'system' && (
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity mt-1 ${
                      isOwnMessage ? 'text-right' : 'text-left'
                    }`}>
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                          className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded"
                          title="Add reaction"
                        >
                          <Smile className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded"
                          title="Reply"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                        {isOwnMessage && (
                          <>
                            <button
                              onClick={() => setEditingMessage(message.id)}
                              className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded"
                              title="Edit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Emoji Picker */}
                      {showEmojiPicker === message.id && (
                        <div className="absolute z-10 mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                          <div className="flex space-x-1">
                            {EMOJI_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className="p-1 hover:bg-gray-700 rounded text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {isTyping.length > 0 && (
        <div className="px-3 py-1 text-xs text-gray-500 italic">
          {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <div className="px-3 py-2 bg-gray-800/50 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Replying to {replyingTo.senderName}: {replyingTo.content.substring(0, 50)}...
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800 p-3">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
            />
          </div>
          <button
            onClick={() => console.log('Attach file')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Send message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowEmojiPicker(null)}
        />
      )}
    </div>
  );
}