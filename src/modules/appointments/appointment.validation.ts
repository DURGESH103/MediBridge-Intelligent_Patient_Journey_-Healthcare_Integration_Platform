import { z } from 'zod';
import { AppointmentStatus } from './appointment.types';

const isoDateTime = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'A valid ISO date/time is required');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.coerce.number().int().positive().optional(),
    doctorId: z.coerce.number().int().positive(),
    scheduledAt: isoDateTime,
    reason: z.string().max(500).optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const availableSlotsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    doctorId: z.coerce.number().int().positive(),
    date: isoDate,
  }),
  params: z.object({}).optional(),
});

export const listAppointmentsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    patientId: z.coerce.number().int().positive().optional(),
    doctorId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    fromDate: isoDate.optional(),
    toDate: isoDate.optional(),
  }),
  params: z.object({}).optional(),
});

export const appointmentIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const rescheduleAppointmentSchema = z.object({
  body: z.object({
    scheduledAt: isoDateTime,
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
