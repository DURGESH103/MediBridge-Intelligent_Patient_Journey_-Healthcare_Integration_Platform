'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateConsultationNotes } from '@/lib/api/consultations';
import { getApiErrorMessage } from '@/lib/api/client';
import { consultationNotesSchema, type ConsultationNotesValues } from '@/lib/validation/consultationSchemas';
import type { Consultation } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ConsultationNotesForm({
  consultation,
  appointmentId,
  readOnly,
}: {
  consultation: Consultation;
  appointmentId: number;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ConsultationNotesValues>({
    resolver: zodResolver(consultationNotesSchema),
    defaultValues: { diagnosis: consultation.diagnosis ?? '', notes: consultation.notes ?? '' },
  });

  useEffect(() => {
    reset({ diagnosis: consultation.diagnosis ?? '', notes: consultation.notes ?? '' });
  }, [consultation.diagnosis, consultation.notes, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: ConsultationNotesValues) =>
      updateConsultationNotes(consultation.id, { diagnosis: values.diagnosis || null, notes: values.notes || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations', 'byAppointment', appointmentId] });
      setSuccessMessage('Notes saved.');
      setTimeout(() => setSuccessMessage(null), 2500);
    },
  });

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">Diagnosis &amp; Notes</h2>
      <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} className="mt-3 flex flex-col gap-3">
        <div>
          <label htmlFor="diagnosis" className="text-sm font-medium text-slate-700">
            Diagnosis
          </label>
          <textarea
            id="diagnosis"
            rows={2}
            disabled={readOnly}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            {...register('diagnosis')}
          />
          {errors.diagnosis && <p className="mt-1 text-sm text-red-600">{errors.diagnosis.message}</p>}
        </div>
        <div>
          <label htmlFor="notes" className="text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            disabled={readOnly}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            {...register('notes')}
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
        </div>
        {saveMutation.isError && <p className="text-sm text-red-600">{getApiErrorMessage(saveMutation.error)}</p>}
        {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
        {!readOnly && (
          <Button type="submit" size="sm" isLoading={saveMutation.isPending} disabled={!isDirty} className="self-start">
            Save Notes
          </Button>
        )}
      </form>
    </Card>
  );
}
