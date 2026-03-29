import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger.config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 422;
    message = err.message;
  } else if (err.message?.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.message?.includes('foreign key')) {
    statusCode = 400;
    message = 'Referenced resource not found';
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: (req as any).user?.id
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
