import { Request, Response } from 'express';
import { appointmentService } from './appointment.service';
import { patientsService } from '../patients/patients.service';
import { doctorService } from '../doctors/doctor.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/roles';
import { Appointment } from './appointment.types';

async function assertCanAccessAppointment(req: Request, appointment: Appointment): Promise<void> {
  if (req.user?.role === UserRole.PATIENT) {
    const patient = await patientsService.getPatientByUserId(req.user.userId);
    if (appointment.patientId !== patient.id) {
      throw ApiError.forbidden('You can only access your own appointments');
    }
  } else if (req.user?.role === UserRole.DOCTOR) {
    const doctor = await doctorService.getDoctorByUserId(req.user.userId);
    if (appointment.doctorId !== doctor.id) {
      throw ApiError.forbidden('You can only access your own appointments');
    }
  }
}

export const appointmentController = {
  createAppointment: asyncHandler(async (req: Request, res: Response) => {
    let patientId = req.body.patientId as number | undefined;

    if (req.user!.role === UserRole.PATIENT) {
      const patient = await patientsService.getPatientByUserId(req.user!.userId);
      patientId = patient.id;
    } else if (!patientId) {
      throw ApiError.badRequest('patientId is required');
    }

    const appointment = await appointmentService.createAppointment({ ...req.body, patientId });
    sendSuccess(res, 201, 'Appointment created successfully', appointment);
  }),

  getAvailableSlots: asyncHandler(async (req: Request, res: Response) => {
    const { doctorId, date } = req.query as unknown as { doctorId: number; date: string };
    const slots = await appointmentService.getAvailableSlots(doctorId, date);
    sendSuccess(res, 200, 'Available slots retrieved successfully', slots);
  }),

  listAppointments: asyncHandler(async (req: Request, res: Response) => {
    const filters = { ...req.query } as Record<string, unknown>;

    if (req.user!.role === UserRole.PATIENT) {
      const patient = await patientsService.getPatientByUserId(req.user!.userId);
      filters.patientId = patient.id;
    } else if (req.user!.role === UserRole.DOCTOR) {
      const doctor = await doctorService.getDoctorByUserId(req.user!.userId);
      filters.doctorId = doctor.id;
    }

    const appointments = await appointmentService.listAppointments(filters);
    sendSuccess(res, 200, 'Appointments retrieved successfully', appointments);
  }),

  getAppointmentById: asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentService.getAppointmentById(Number(req.params.id));
    await assertCanAccessAppointment(req, appointment);
    sendSuccess(res, 200, 'Appointment retrieved successfully', appointment);
  }),

  confirmAppointment: asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentService.confirmAppointment(Number(req.params.id));
    sendSuccess(res, 200, 'Appointment confirmed successfully', appointment);
  }),

  cancelAppointment: asyncHandler(async (req: Request, res: Response) => {
    const existing = await appointmentService.getAppointmentById(Number(req.params.id));
    await assertCanAccessAppointment(req, existing);
    const appointment = await appointmentService.cancelAppointment(Number(req.params.id));
    sendSuccess(res, 200, 'Appointment cancelled successfully', appointment);
  }),

  markNoShow: asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentService.markNoShow(Number(req.params.id));
    sendSuccess(res, 200, 'Appointment marked as no-show', appointment);
  }),

  rescheduleAppointment: asyncHandler(async (req: Request, res: Response) => {
    const existing = await appointmentService.getAppointmentById(Number(req.params.id));
    await assertCanAccessAppointment(req, existing);
    const appointment = await appointmentService.rescheduleAppointment(
      Number(req.params.id),
      req.body.scheduledAt
    );
    sendSuccess(res, 200, 'Appointment rescheduled successfully', appointment);
  }),
};
