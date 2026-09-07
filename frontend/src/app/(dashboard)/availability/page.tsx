'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getDoctorAvailability, getMyDoctorProfile, setDoctorAvailability } from '@/lib/api/doctors';
import { getApiErrorMessage } from '@/lib/api/client';
import { availabilityFormSchema, type AvailabilityFormValues } from '@/lib/validation/availabilitySchemas';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
  return (
    <RequireRole roles={['DOCTOR']}>
      <AvailabilityPageContent />
    </RequireRole>
  );
}

function AvailabilityPageContent() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const doctorQuery = useQuery({ queryKey: ['doctors', 'me'], queryFn: getMyDoctorProfile });
  const doctorId = doctorQuery.data?.id;

  const availabilityQuery = useQuery({
    queryKey: ['doctors', doctorId, 'availability'],
    queryFn: () => getDoctorAvailability(doctorId!),
    enabled: Boolean(doctorId),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      slots: DAY_LABELS.map(() => ({ enabled: false, startTime: '09:00', endTime: '17:00', slotDurationMinutes: '15' })),
    },
  });
  const slots = useWatch({ control, name: 'slots' });

  // Populate the form once the doctor's saved availability has loaded.
  useEffect(() => {
    if (!availabilityQuery.data) return;
    const byDay = new Map(availabilityQuery.data.map((a) => [a.dayOfWeek, a]));
    reset({
      slots: DAY_LABELS.map((_, dayOfWeek) => {
        const existing = byDay.get(dayOfWeek);
        return existing
          ? {
              enabled: true,
              startTime: existing.startTime.slice(0, 5),
              endTime: existing.endTime.slice(0, 5),
              slotDurationMinutes: String(existing.slotDurationMinutes),
            }
          : { enabled: false, startTime: '09:00', endTime: '17:00', slotDurationMinutes: '15' };
      }),
    });
  }, [availabilityQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: AvailabilityFormValues) =>
      setDoctorAvailability(
        doctorId!,
        values.slots
          .map((row, dayOfWeek) => ({ ...row, dayOfWeek }))
          .filter((row) => row.enabled)
          .map((row) => ({
            dayOfWeek: row.dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
            slotDurationMinutes: Number(row.slotDurationMinutes),
          }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors', doctorId, 'availability'] });
      setSuccessMessage('Availability updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => setApiError(getApiErrorMessage(error, 'Could not save availability')),
  });

  function onSubmit(values: AvailabilityFormValues) {
    setApiError(null);
    saveMutation.mutate(values);
  }

  if (doctorQuery.isLoading || availabilityQuery.isLoading) return <LoadingSpinner />;
  if (doctorQuery.isError) return <ErrorState message={getApiErrorMessage(doctorQuery.error)} />;

  return (
    <>
      <PageHeader title="Availability" description="Set the days and hours patients can book appointments with you." />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {DAY_LABELS.map((day, index) => (
            <div key={day} className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-4 last:border-0">
              <label className="flex w-36 items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register(`slots.${index}.enabled`)} />
                <span className="text-sm font-medium text-slate-900">{day}</span>
              </label>

              {slots?.[index]?.enabled && (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="time"
                    aria-label={`${day} start time`}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    {...register(`slots.${index}.startTime`)}
                  />
                  <span className="text-sm text-slate-400">to</span>
                  <input
                    type="time"
                    aria-label={`${day} end time`}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    {...register(`slots.${index}.endTime`)}
                  />
                  <select
                    aria-label={`${day} slot duration`}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    {...register(`slots.${index}.slotDurationMinutes`)}
                  >
                    {[10, 15, 20, 30, 45, 60].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} min slots
                      </option>
                    ))}
                  </select>
                  {errors.slots?.[index]?.startTime && (
                    <p className="w-full text-sm text-red-600">{errors.slots[index]?.startTime?.message}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {apiError && <p className="text-sm text-red-600">{apiError}</p>}
          {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}

          <Button type="submit" isLoading={saveMutation.isPending} className="self-start">
            Save Availability
          </Button>
        </form>
      </Card>
    </>
  );
}
