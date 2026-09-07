import { z } from 'zod';

export const billingIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const billingPatientIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    patientId: z.coerce.number().int().positive(),
  }),
});
