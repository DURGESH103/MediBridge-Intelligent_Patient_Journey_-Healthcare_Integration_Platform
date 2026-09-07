import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    description: z.string().max(500).optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
