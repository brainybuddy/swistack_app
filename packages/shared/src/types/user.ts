import { BaseEntity } from './common';

export interface User extends BaseEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface UserProfile extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  projectsCount: number;
  lastActiveAt: Date;
}