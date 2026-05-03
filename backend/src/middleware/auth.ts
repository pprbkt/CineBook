import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser } from '../models/User';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid token'));
    }
  }
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Silently continue without auth
  }
  next();
};
