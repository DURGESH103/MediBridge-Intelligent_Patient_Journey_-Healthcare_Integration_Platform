'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listConsultationLabTests, requestLabTest } from '@/lib/api/consultations';
import { getApiErrorMessage } from '@/lib/api/client';
import { labTestRequestFormSchema, type LabTestRequestFormValues } from '@/lib/validation/consultationSchemas';
import { labTestStatusStyle } from '@/lib/statusStyles';
import { formatDateTime } from '@/lib/formatDate';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function LabTestsPanel({ consultationId, readOnly }: { consultationId: number; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const labTestsQuery = useQuery({
    queryKey: ['consultations', consultationId, 'labTests'],
    queryFn: () => listConsultationLabTests(consultationId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LabTestRequestFormValues>({ resolver: zodResolver(labTestRequestFormSchema) });

  const requestMutation = useMutation({
    mutationFn: (values: LabTestRequestFormValues) => requestLabTest(consultationId, values.testName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations', consultationId, 'labTests'] });
      reset();
      setIsAdding(false);
    },
  });

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Laboratory Tests</h2>
        {!readOnly && !isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Request Test
          </Button>
        )}
      </div>

      {labTestsQuery.isLoading && <LoadingSpinner />}
      {labTestsQuery.isError && <ErrorState message={getApiErrorMessage(labTestsQuery.error)} />}
      {labTestsQuery.data && labTestsQuery.data.length === 0 && !isAdding && (
        <EmptyState title="No laboratory tests requested" />
      )}
      {labTestsQuery.data && labTestsQuery.data.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100">
          {labTestsQuery.data.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{t.testName}</p>
                <p className="text-xs text-slate-500">Requested {formatDateTime(t.requestedAt)}</p>
              </div>
              <StatusBadge {...labTestStatusStyle(t.status)} />
            </li>
          ))}
        </ul>
      )}

      {isAdding && (
        <form
          onSubmit={handleSubmit((values) => requestMutation.mutate(values))}
          className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              label="Test Name"
              error={errors.testName?.message}
              placeholder="e.g. Complete Blood Count"
              {...register('testName')}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" size="sm" isLoading={requestMutation.isPending}>
              Request
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {requestMutation.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(requestMutation.error)}</p>}
    </Card>
  );
}
