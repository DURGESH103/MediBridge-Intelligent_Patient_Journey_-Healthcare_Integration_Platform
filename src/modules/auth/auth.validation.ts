import { z } from 'zod';
import { Gender } from '../patients/patients.types';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required'),
    password: passwordSchema,
    fullName: z.string().trim().min(2, 'Full name is required').max(150),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
      .refine((value) => new Date(value) <= new Date(), 'Date of birth cannot be in the future'),
    gender: z.nativeEnum(Gender, { errorMap: () => ({ message: 'A valid gender is required' }) }),
    phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, 'A valid phone number is required'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
