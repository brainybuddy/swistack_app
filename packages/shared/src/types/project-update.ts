export interface ProjectUpdate {
  id: string;
  projectId: string;
  userId: string;
  type: 'file_created' | 'file_updated' | 'file_deleted' | 'file_renamed' | 'member_added' | 'member_removed' | 'project_updated' | 'collaboration_joined' | 'collaboration_left';
  data: {
    fileName?: string;
    filePath?: string;
    oldPath?: string;
    newPath?: string;
    memberEmail?: string;
    memberRole?: string;
    projectName?: string;
    changes?: Record<string, any>;
  };
  timestamp: Date;
  userInfo: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface ProjectUpdatesResponse {
  success: boolean;
  data?: {
    updates: ProjectUpdate[];
  };
  error?: string;
}

export const PROJECT_UPDATE_TYPES = {
  FILE_CREATED: 'file_created',
  FILE_UPDATED: 'file_updated',
  FILE_DELETED: 'file_deleted',
  FILE_RENAMED: 'file_renamed',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  PROJECT_UPDATED: 'project_updated',
  COLLABORATION_JOINED: 'collaboration_joined',
  COLLABORATION_LEFT: 'collaboration_left'
} as const;

export type ProjectUpdateType = typeof PROJECT_UPDATE_TYPES[keyof typeof PROJECT_UPDATE_TYPES];

export interface RealtimeProjectUpdate {
  projectId: string;
  userId: string;
  type: ProjectUpdateType;
  data: ProjectUpdate['data'];
}

export interface UserProjectActivity {
  userId: string;
  timestamp: Date;
  action: 'joined' | 'left';
}