import { ApiResponse } from './api';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type Environment = 'development' | 'staging' | 'production';

export interface Config {
  env: Environment;
  port: number;
  cors: {
    origin: string[];
  };
}