import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name is required').max(150),
  description: z.string().max(500).optional(),
});

export type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>;
