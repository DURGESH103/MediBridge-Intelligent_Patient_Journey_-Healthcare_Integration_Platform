import { Request, Response } from 'express';
import { departmentService } from './department.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';

export const departmentController = {
  listDepartments: asyncHandler(async (_req: Request, res: Response) => {
    const departments = await departmentService.listDepartments();
    sendSuccess(res, 200, 'Departments retrieved successfully', departments);
  }),

  createDepartment: asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentService.createDepartment(req.body);
    sendSuccess(res, 201, 'Department created successfully', department);
  }),
};
