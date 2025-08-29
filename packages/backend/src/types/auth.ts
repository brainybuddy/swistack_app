import { Request } from 'express';
import { DatabaseUser } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: DatabaseUser;
}