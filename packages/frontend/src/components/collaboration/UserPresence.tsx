'use client';

import React from 'react';
import { CollaborativeUser } from '../../types/shared';

interface UserPresenceProps {
  users: CollaborativeUser[];
  maxVisible?: number;
  showNames?: boolean;
}

const UserPresence: React.FC<UserPresenceProps> = ({ 
  users, 
  maxVisible = 5,
  showNames = false 
}) => {
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = users.length - maxVisible;

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getUserColor = (userId: string) => {
    // Generate consistent color based on user ID
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-white text-white text-xs font-medium ${getUserColor(user.id)}`}
            title={`${user.username} (${user.email})`}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{getInitials(user.username)}</span>
            )}
            
            {/* Activity indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <div className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 ring-2 ring-white text-white text-xs font-medium">
            +{hiddenCount}
          </div>
        )}
      </div>
      
      {showNames && visibleUsers.length > 0 && (
        <div className="ml-2 text-sm text-gray-600">
          {visibleUsers.length === 1 ? (
            <span>{visibleUsers[0].username}</span>
          ) : (
            <span>
              {visibleUsers.map(u => u.username).join(', ')}
              {hiddenCount > 0 && ` and ${hiddenCount} more`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPresence;