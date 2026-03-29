// auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/app.config';
import { RedisClient } from '../../config/redis.config';
import { AppError } from './error.middleware';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const blacklisted = await RedisClient.exists(`blacklist:${token}`);
    if (blacklisted) throw new AppError('Token has been revoked', 401);

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    (req as any).user = decoded;
    (req as any).token = token;

    next();
  } catch (error: any) {
    if (error instanceof AppError) return next(error);
    if (error.name === 'TokenExpiredError') return next(new AppError('Token expired', 401));
    if (error.name === 'JsonWebTokenError') return next(new AppError('Invalid token', 401));
    next(new AppError('Authentication failed', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

export const hasPermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) return next(new AppError('Authentication required', 401));

    const userPermissions = user.permissions || [];
    const hasAll = permissions.every(p => userPermissions.includes(p) || user.role === 'super_admin');

    if (!hasAll) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};
