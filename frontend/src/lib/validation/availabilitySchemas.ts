import { z } from 'zod';

const dayRowSchema = z
  .object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    slotDurationMinutes: z.string(),
  })
  .refine((row) => !row.enabled || (row.startTime && row.endTime), {
    message: 'Set both a start and end time',
    path: ['startTime'],
  })
  .refine((row) => !row.enabled || row.startTime < row.endTime, {
    message: 'Start time must be before end time',
    path: ['startTime'],
  });

export const availabilityFormSchema = z.object({
  slots: z.array(dayRowSchema).length(7),
});

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;
