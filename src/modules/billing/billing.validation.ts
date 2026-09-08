import { z } from 'zod';
import { PaymentMethod } from './billing.types';

export const billingIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const markBillingPaidSchema = z.object({
  body: z.object({
    paymentMethod: z.nativeEnum(PaymentMethod, { errorMap: () => ({ message: 'A valid payment method is required' }) }),
    paymentReference: z.string().trim().max(255).optional(),
  }),
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
