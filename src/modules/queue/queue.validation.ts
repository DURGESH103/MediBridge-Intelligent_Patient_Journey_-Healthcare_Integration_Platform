import { z } from 'zod';

export const checkInSchema = z.object({
  body: z.object({
    appointmentId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const doctorIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    doctorId: z.coerce.number().int().positive(),
  }),
});

export const queueEntryIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const appointmentIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    appointmentId: z.coerce.number().int().positive(),
  }),
});
