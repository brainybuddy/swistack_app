import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const authenticateSocket = (socket: Socket, next: (err?: any) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (socket as any).userId = decoded.userId || decoded.sub;
    (socket as any).user = decoded;
    
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};