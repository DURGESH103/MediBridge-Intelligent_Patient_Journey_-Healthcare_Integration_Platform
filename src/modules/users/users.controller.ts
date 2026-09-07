import { Request, Response } from 'express';
import { usersService } from './users.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { UserRole } from '../../types/roles';

export const usersController = {
  createStaffUser: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, role, fullName } = req.body;
    const user = await usersService.createStaffUser(email, password, role, fullName);
    sendSuccess(res, 201, 'Staff user created successfully', user);
  }),

  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const role = req.query.role as UserRole | undefined;
    const users = await usersService.listUsers(role);
    sendSuccess(res, 200, 'Users retrieved successfully', users);
  }),

  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.getUserById(Number(req.params.id));
    sendSuccess(res, 200, 'User retrieved successfully', user);
  }),

  setUserActive: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.setUserActive(Number(req.params.id), req.body.isActive);
    sendSuccess(res, 200, 'User status updated successfully', user);
  }),
};
