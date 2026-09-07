import { z } from 'zod';

const phoneRegex = /^[0-9+\-\s()]{7,20}$/;

export const registerWalkInPatientSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((value) => new Date(value) <= new Date(), 'Date of birth cannot be in the future'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Select a gender' }),
  phone: z.string().regex(phoneRegex, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  emergencyContactName: z.string().max(150).optional(),
  emergencyContactPhone: z
    .string()
    .optional()
    .refine((v) => !v || phoneRegex.test(v), 'Enter a valid phone number'),
});

export type RegisterWalkInPatientFormValues = z.infer<typeof registerWalkInPatientSchema>;
