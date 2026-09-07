import { z } from 'zod';

export const labRequestIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const completeTestSchema = z.object({
  body: z.object({
    resultSummary: z.string().trim().min(1).max(4000),
    reportFileUrl: z.string().url().max(500).optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const patientIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    patientId: z.coerce.number().int().positive(),
  }),
});
