import { z } from 'zod';

export const consultationNotesSchema = z.object({
  diagnosis: z.string().max(2000).optional(),
  notes: z.string().max(4000).optional(),
});
export type ConsultationNotesValues = z.infer<typeof consultationNotesSchema>;

export const prescriptionFormSchema = z.object({
  medicineName: z.string().trim().min(1, 'Medicine name is required').max(200),
  dosage: z.string().trim().min(1, 'Dosage is required').max(100),
  frequency: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  instructions: z.string().max(500).optional(),
});
export type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

export const labTestRequestFormSchema = z.object({
  testName: z.string().trim().min(2, 'Test name must be at least 2 characters').max(200),
});
export type LabTestRequestFormValues = z.infer<typeof labTestRequestFormSchema>;

export const completeLabTestFormSchema = z.object({
  resultSummary: z.string().trim().min(1, 'A result summary is required').max(4000),
  reportFileUrl: z.string().trim().max(500).optional(),
});
export type CompleteLabTestFormValues = z.infer<typeof completeLabTestFormSchema>;
