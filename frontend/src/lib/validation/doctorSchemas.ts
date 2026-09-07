import { z } from 'zod';

export const registerDoctorSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  departmentId: z.string().min(1, 'Select a department'),
  fullName: z.string().trim().min(2, 'Full name is required'),
  specialization: z.string().trim().min(2, 'Specialization is required'),
  qualification: z.string().max(255).optional(),
  phone: z
    .string()
    .max(20)
    .optional()
    .refine((v) => !v || /^[0-9+\-\s()]{7,20}$/.test(v), 'Enter a valid phone number'),
  consultationFee: z.string().optional(),
  averageConsultationMinutes: z.string().min(1, 'Required'),
});

export type RegisterDoctorFormValues = z.infer<typeof registerDoctorSchema>;
