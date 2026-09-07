import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const phoneRegex = /^[0-9+\-\s()]{7,20}$/;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().regex(phoneRegex, 'Enter a valid phone number'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((value) => new Date(value) <= new Date(), 'Date of birth cannot be in the future'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Select a gender' }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
