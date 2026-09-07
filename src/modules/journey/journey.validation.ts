import { z } from 'zod';

export const appointmentIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    appointmentId: z.coerce.number().int().positive(),
  }),
});

export const patientIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    patientId: z.coerce.number().int().positive(),
  }),
});
