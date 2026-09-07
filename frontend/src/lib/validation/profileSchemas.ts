import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(150),
});
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const updateDoctorProfileSchema = z.object({
  specialization: z.string().trim().min(2, 'Specialization is required'),
  qualification: z.string().max(255).optional(),
  phone: z
    .string()
    .max(20)
    .optional()
    .refine((v) => !v || /^[0-9+\-\s()]{7,20}$/.test(v), 'Enter a valid phone number'),
  consultationFee: z.string().optional(),
});
export type UpdateDoctorProfileFormValues = z.infer<typeof updateDoctorProfileSchema>;
