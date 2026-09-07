import { Request, Response } from 'express';
import { queueService } from './queue.service';
import { appointmentService } from '../appointments/appointment.service';
import { patientsService } from '../patients/patients.service';
import { doctorService } from '../doctors/doctor.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/roles';
import { QueueEntry } from './queue.types';

async function assertCanAccessQueueEntry(req: Request, entry: QueueEntry): Promise<void> {
  if (req.user?.role === UserRole.PATIENT) {
    const patient = await patientsService.getPatientByUserId(req.user.userId);
    if (entry.patientId !== patient.id) {
      throw ApiError.forbidden('You can only access your own queue entry');
    }
  } else if (req.user?.role === UserRole.DOCTOR) {
    const doctor = await doctorService.getDoctorByUserId(req.user.userId);
    if (entry.doctorId !== doctor.id) {
      throw ApiError.forbidden('You can only access your own queue');
    }
  }
}

async function assertCanAccessDoctorQueue(req: Request, doctorId: number): Promise<void> {
  if (req.user?.role === UserRole.DOCTOR) {
    const doctor = await doctorService.getDoctorByUserId(req.user.userId);
    if (doctor.id !== doctorId) {
      throw ApiError.forbidden('You can only access your own queue');
    }
  }
}

export const queueController = {
  checkIn: asyncHandler(async (req: Request, res: Response) => {
    const appointmentId = Number(req.body.appointmentId);

    if (req.user!.role === UserRole.PATIENT) {
      const [appointment, patient] = await Promise.all([
        appointmentService.getAppointmentById(appointmentId),
        patientsService.getPatientByUserId(req.user!.userId),
      ]);
      if (appointment.patientId !== patient.id) {
        throw ApiError.forbidden('You can only check in to your own appointment');
      }
    }

    const entry = await queueService.checkIn(appointmentId);
    sendSuccess(res, 201, 'Checked in successfully', entry);
  }),

  getDoctorQueue: asyncHandler(async (req: Request, res: Response) => {
    const doctorId = Number(req.params.doctorId);
    await assertCanAccessDoctorQueue(req, doctorId);
    const entries = await queueService.getQueueForDoctor(doctorId);
    sendSuccess(res, 200, 'Queue retrieved successfully', entries);
  }),

  getDoctorQueueSummary: asyncHandler(async (req: Request, res: Response) => {
    const doctorId = Number(req.params.doctorId);
    const summary = await queueService.getQueueSummary(doctorId);
    sendSuccess(res, 200, 'Queue summary retrieved successfully', summary);
  }),

  getEntryStatus: asyncHandler(async (req: Request, res: Response) => {
    const entryId = Number(req.params.id);
    const entry = await queueService.requireEntry(entryId);
    await assertCanAccessQueueEntry(req, entry);
    const status = await queueService.getStatusForQueueEntry(entryId);
    sendSuccess(res, 200, 'Queue status retrieved successfully', status);
  }),

  callNext: asyncHandler(async (req: Request, res: Response) => {
    const doctorId = Number(req.params.doctorId);
    await assertCanAccessDoctorQueue(req, doctorId);
    const entry = await queueService.callNext(doctorId);
    sendSuccess(res, 200, 'Next patient called', entry);
  }),

  completeEntry: asyncHandler(async (req: Request, res: Response) => {
    const entryId = Number(req.params.id);
    const entry = await queueService.requireEntry(entryId);
    await assertCanAccessQueueEntry(req, entry);
    const updated = await queueService.completeEntry(entryId);
    sendSuccess(res, 200, 'Queue entry marked completed', updated);
  }),

  skipEntry: asyncHandler(async (req: Request, res: Response) => {
    const entryId = Number(req.params.id);
    const entry = await queueService.requireEntry(entryId);
    await assertCanAccessQueueEntry(req, entry);
    const updated = await queueService.skipEntry(entryId);
    sendSuccess(res, 200, 'Queue entry skipped', updated);
  }),

  cancelEntry: asyncHandler(async (req: Request, res: Response) => {
    const entryId = Number(req.params.id);
    const entry = await queueService.requireEntry(entryId);
    await assertCanAccessQueueEntry(req, entry);
    const updated = await queueService.cancelEntry(entryId);
    sendSuccess(res, 200, 'Queue entry cancelled', updated);
  }),

  getEntryByAppointment: asyncHandler(async (req: Request, res: Response) => {
    const appointmentId = Number(req.params.appointmentId);

    if (req.user!.role === UserRole.PATIENT) {
      const [appointment, patient] = await Promise.all([
        appointmentService.getAppointmentById(appointmentId),
        patientsService.getPatientByUserId(req.user!.userId),
      ]);
      if (appointment.patientId !== patient.id) {
        throw ApiError.forbidden('You can only access your own queue entry');
      }
    }

    const entry = await queueService.getEntryByAppointmentId(appointmentId);
    sendSuccess(res, 200, 'Queue entry retrieved successfully', entry);
  }),
};
