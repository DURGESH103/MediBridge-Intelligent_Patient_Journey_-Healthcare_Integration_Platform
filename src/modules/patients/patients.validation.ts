import { z } from 'zod';
import { Gender } from './patients.types';

const phoneRegex = /^[0-9+\-\s()]{7,20}$/;

const patientCoreFields = {
  fullName: z.string().trim().min(2, 'Full name is required').max(150),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine((value) => new Date(value) <= new Date(), 'Date of birth cannot be in the future'),
  gender: z.nativeEnum(Gender, { errorMap: () => ({ message: 'A valid gender is required' }) }),
  phone: z.string().regex(phoneRegex, 'A valid phone number is required'),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergencyContactName: z.string().max(150).optional().nullable(),
  emergencyContactPhone: z.string().regex(phoneRegex).optional().nullable(),
};

export const createPatientSchema = z.object({
  body: z.object(patientCoreFields),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updatePatientSchema = z.object({
  body: z.object(patientCoreFields).partial(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const patientIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const searchPatientsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    q: z.string().trim().min(1, 'A search term is required'),
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
  params: z.object({}).optional(),
});
