import { Request, Response } from 'express';
import { doctorService } from './doctor.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/roles';
import { Doctor } from './doctor.types';

function assertCanManageAvailability(req: Request, doctor: Doctor): void {
  if (req.user?.role === UserRole.DOCTOR && doctor.userId !== req.user.userId) {
    throw ApiError.forbidden('You can only manage your own availability');
  }
}

function assertCanUpdateDoctor(req: Request, doctor: Doctor): void {
  if (req.user?.role !== UserRole.DOCTOR) {
    return;
  }
  if (doctor.userId !== req.user.userId) {
    throw ApiError.forbidden('You can only update your own profile');
  }
  if (req.body.departmentId !== undefined) {
    throw ApiError.forbidden('Only an administrator can change your department');
  }
}

export const doctorController = {
  registerDoctor: asyncHandler(async (req: Request, res: Response) => {
    const result = await doctorService.registerDoctor(req.body);
    sendSuccess(res, 201, 'Doctor registered successfully', result);
  }),

  listDoctors: asyncHandler(async (req: Request, res: Response) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    const doctors = await doctorService.listDoctors(departmentId);
    sendSuccess(res, 200, 'Doctors retrieved successfully', doctors);
  }),

  getDoctorById: asyncHandler(async (req: Request, res: Response) => {
    const doctor = await doctorService.getDoctorById(Number(req.params.id));
    sendSuccess(res, 200, 'Doctor retrieved successfully', doctor);
  }),

  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const doctor = await doctorService.getDoctorByUserId(req.user!.userId);
    sendSuccess(res, 200, 'Doctor profile retrieved successfully', doctor);
  }),

  updateDoctor: asyncHandler(async (req: Request, res: Response) => {
    const doctorId = Number(req.params.id);
    const existing = await doctorService.getDoctorById(doctorId);
    assertCanUpdateDoctor(req, existing);
    const doctor = await doctorService.updateDoctor(doctorId, req.body);
    sendSuccess(res, 200, 'Doctor updated successfully', doctor);
  }),

  getAvailability: asyncHandler(async (req: Request, res: Response) => {
    const availability = await doctorService.getAvailability(Number(req.params.id));
    sendSuccess(res, 200, 'Doctor availability retrieved successfully', availability);
  }),

  setAvailability: asyncHandler(async (req: Request, res: Response) => {
    const doctorId = Number(req.params.id);
    const doctor = await doctorService.getDoctorById(doctorId);
    assertCanManageAvailability(req, doctor);
    const availability = await doctorService.setAvailability(doctorId, req.body.slots);
    sendSuccess(res, 200, 'Doctor availability updated successfully', availability);
  }),
};
