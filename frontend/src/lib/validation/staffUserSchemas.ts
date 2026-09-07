import { z } from 'zod';

export const createStaffUserSchema = z.object({
  fullName: z.string().trim().max(150).optional(),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'LAB_STAFF', 'BILLING_STAFF'], { message: 'Select a role' }),
});

export type CreateStaffUserFormValues = z.infer<typeof createStaffUserSchema>;
