import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { DatabaseUser } from '../models/User';
import rateLimit from 'express-rate-limit';
import { authConfig } from '../config/auth';

declare global {
  namespace Express {
    interface Request {
      user?: DatabaseUser;
    }
    interface User extends DatabaseUser {}
  }
}

export const authRateLimit = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: authConfig.rateLimit.max,
  message: {
    error: authConfig.rateLimit.message,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      res.status(401).json({ error: 'Access token is required' });
      return;
    }

    const user = await AuthService.verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    res.status(401).json({ error: message });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      const user = await AuthService.verifyAccessToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
};

export const requireActiveUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isActive) {
    res.status(403).json({ error: 'Account is deactivated' });
    return;
  }

  next();
};

// Alias for backward compatibility
export const authMiddleware = authenticateToken;