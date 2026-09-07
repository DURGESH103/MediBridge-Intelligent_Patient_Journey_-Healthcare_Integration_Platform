import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../types/roles';
import { ApiError } from '../utils/ApiError';

/**
 * Restricts a route to the given roles. Must run after `authenticate`.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden('Your role does not have access to this resource'));
      return;
    }
    next();
  };
}
