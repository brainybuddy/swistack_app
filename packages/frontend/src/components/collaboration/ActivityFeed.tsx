'use client';

import React, { useState } from 'react';
import { ActivityFeedItem, CollaborativeUser } from '../../types/shared';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  activeUsers: CollaborativeUser[];
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  activeUsers,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'file-edit':
        return '✏️';
      case 'file-create':
        return '📄';
      case 'file-delete':
        return '🗑️';
      case 'user-join':
        return '👋';
      case 'user-leave':
        return '👋';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'file-edit':
        return 'text-blue-600';
      case 'file-create':
        return 'text-green-600';
      case 'file-delete':
        return 'text-red-600';
      case 'user-join':
        return 'text-purple-600';
      case 'user-leave':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900">Activity Feed</h3>
          {activities.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {activities.length}
            </span>
          )}
        </div>
        
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Activity List */}
      {isExpanded && (
        <div className="max-h-80 overflow-y-auto">
          {displayedActivities.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No recent activity
            </div>
          ) : (
            <>
              {displayedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <div className="text-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                      {activity.username}
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      {activity.message}
                    </div>
                    {activity.fileName && (
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        {activity.fileName}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
              
              {activities.length > 5 && (
                <div className="p-3 border-t bg-gray-50">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showAll ? 'Show less' : `Show all ${activities.length} activities`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Active Users */}
      {isExpanded && activeUsers.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <div className="text-xs font-medium text-gray-700 mb-2">
            Currently online ({activeUsers.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center space-x-2 bg-white rounded-full px-3 py-1 text-xs border"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;