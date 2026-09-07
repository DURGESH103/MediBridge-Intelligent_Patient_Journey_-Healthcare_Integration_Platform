import { z } from 'zod';

export const startConsultationSchema = z.object({
  body: z.object({
    appointmentId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const consultationIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const updateNotesSchema = z.object({
  body: z.object({
    diagnosis: z.string().max(2000).optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const addPrescriptionSchema = z.object({
  body: z.object({
    medicineName: z.string().trim().min(1).max(200),
    dosage: z.string().trim().min(1).max(100),
    frequency: z.string().max(100).optional().nullable(),
    duration: z.string().max(100).optional().nullable(),
    instructions: z.string().max(500).optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const requestLabTestSchema = z.object({
  body: z.object({
    testName: z.string().trim().min(2).max(200),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
