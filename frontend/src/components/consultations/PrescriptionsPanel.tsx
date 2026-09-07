'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addPrescription, getPrescriptions } from '@/lib/api/consultations';
import { getApiErrorMessage } from '@/lib/api/client';
import { prescriptionFormSchema, type PrescriptionFormValues } from '@/lib/validation/consultationSchemas';
import { formatDateTime } from '@/lib/formatDate';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export function PrescriptionsPanel({ consultationId, readOnly }: { consultationId: number; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const prescriptionsQuery = useQuery({
    queryKey: ['consultations', consultationId, 'prescriptions'],
    queryFn: () => getPrescriptions(consultationId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrescriptionFormValues>({ resolver: zodResolver(prescriptionFormSchema) });

  const addMutation = useMutation({
    mutationFn: (values: PrescriptionFormValues) =>
      addPrescription(consultationId, {
        medicineName: values.medicineName,
        dosage: values.dosage,
        frequency: values.frequency || null,
        duration: values.duration || null,
        instructions: values.instructions || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations', consultationId, 'prescriptions'] });
      reset();
      setIsAdding(false);
    },
  });

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Prescriptions</h2>
        {!readOnly && !isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add Prescription
          </Button>
        )}
      </div>

      {prescriptionsQuery.isLoading && <LoadingSpinner />}
      {prescriptionsQuery.isError && <ErrorState message={getApiErrorMessage(prescriptionsQuery.error)} />}
      {prescriptionsQuery.data && prescriptionsQuery.data.length === 0 && !isAdding && (
        <EmptyState title="No prescriptions added yet" />
      )}
      {prescriptionsQuery.data && prescriptionsQuery.data.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100">
          {prescriptionsQuery.data.map((p) => (
            <li key={p.id} className="py-3">
              <p className="text-sm font-medium text-slate-900">
                {p.medicineName} <span className="font-normal text-slate-500">· {p.dosage}</span>
              </p>
              <p className="text-xs text-slate-500">
                {[p.frequency, p.duration].filter(Boolean).join(' · ') || 'No frequency or duration specified'}
              </p>
              {p.instructions && <p className="mt-1 text-xs text-slate-600">{p.instructions}</p>}
              <p className="mt-1 text-xs text-slate-400">Added {formatDateTime(p.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {isAdding && (
        <form
          onSubmit={handleSubmit((values) => addMutation.mutate(values))}
          className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Medicine Name" error={errors.medicineName?.message} {...register('medicineName')} />
            <Input label="Dosage" error={errors.dosage?.message} placeholder="e.g. 500mg" {...register('dosage')} />
            <Input label="Frequency (optional)" placeholder="e.g. Twice daily" {...register('frequency')} />
            <Input label="Duration (optional)" placeholder="e.g. 5 days" {...register('duration')} />
          </div>
          <div>
            <label htmlFor="instructions" className="text-sm font-medium text-slate-700">
              Instructions (optional)
            </label>
            <textarea
              id="instructions"
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              {...register('instructions')}
            />
          </div>
          {addMutation.isError && <p className="text-sm text-red-600">{getApiErrorMessage(addMutation.error)}</p>}
          <div className="flex gap-3">
            <Button type="submit" size="sm" isLoading={addMutation.isPending}>
              Save Prescription
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
