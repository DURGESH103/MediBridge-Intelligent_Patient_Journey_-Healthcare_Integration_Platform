import { z } from 'zod';
import { UserRole } from '../../types/roles';

export const createStaffUserSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'A valid role is required' }) }),
    fullName: z.string().trim().min(2).max(150).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listUsersSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    role: z.nativeEnum(UserRole).optional(),
  }),
  params: z.object({}).optional(),
});

export const userIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const setUserActiveSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
