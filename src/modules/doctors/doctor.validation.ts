import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerDoctorSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required'),
    password: passwordSchema,
    departmentId: z.coerce.number().int().positive(),
    fullName: z.string().trim().min(2).max(150),
    specialization: z.string().trim().min(2).max(150),
    qualification: z.string().max(255).optional().nullable(),
    phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/).optional().nullable(),
    consultationFee: z.coerce.number().nonnegative().optional().nullable(),
    averageConsultationMinutes: z.coerce.number().int().min(5).max(180).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    departmentId: z.coerce.number().int().positive().optional(),
    fullName: z.string().trim().min(2).max(150).optional(),
    specialization: z.string().trim().min(2).max(150).optional(),
    qualification: z.string().max(255).optional().nullable(),
    phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/).optional().nullable(),
    consultationFee: z.coerce.number().nonnegative().optional().nullable(),
    averageConsultationMinutes: z.coerce.number().int().min(5).max(180).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const doctorIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const listDoctorsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    departmentId: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
});

const availabilitySlotSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'End time must be in HH:MM format'),
  slotDurationMinutes: z.coerce.number().int().min(5).max(120),
});

export const setAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(availabilitySlotSchema).min(1, 'At least one availability slot is required'),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
