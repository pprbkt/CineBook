import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.message,
    });
    return;
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      message: 'Duplicate entry',
    });
    return;
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: (err as any).errors,
    });
    return;
  }

  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
