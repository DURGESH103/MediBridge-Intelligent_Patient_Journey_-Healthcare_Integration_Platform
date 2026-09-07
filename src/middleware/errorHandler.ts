import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { sendError } from '../utils/ApiResponse';
import { logger } from '../config/logger';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
    }
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }

  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
  sendError(res, 500, 'An unexpected error occurred. Please try again later.');
}
