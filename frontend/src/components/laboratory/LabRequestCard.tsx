'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectSample, completeLabTest, startProcessing } from '@/lib/api/laboratory';
import { getApiErrorMessage } from '@/lib/api/client';
import { completeLabTestFormSchema, type CompleteLabTestFormValues } from '@/lib/validation/consultationSchemas';
import { labTestStatusStyle } from '@/lib/statusStyles';
import { formatDateTime } from '@/lib/formatDate';
import type { LabTestRequest } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PatientNameLabel } from '@/components/patients/PatientNameLabel';

export function LabRequestCard({ request }: { request: LabTestRequest }) {
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['laboratory'] });
  }

  const collectMutation = useMutation({
    mutationFn: () => collectSample(request.id),
    onSuccess: invalidate,
  });

  const startProcessingMutation = useMutation({
    mutationFn: () => startProcessing(request.id),
    onSuccess: invalidate,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteLabTestFormValues>({ resolver: zodResolver(completeLabTestFormSchema) });

  const completeMutation = useMutation({
    mutationFn: (values: CompleteLabTestFormValues) =>
      completeLabTest(request.id, { resultSummary: values.resultSummary, reportFileUrl: values.reportFileUrl || null }),
    onSuccess: () => {
      invalidate();
      setIsCompleting(false);
    },
  });

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{request.testName}</p>
          <p className="text-xs text-slate-500">
            <PatientNameLabel patientId={request.patientId} /> · Requested {formatDateTime(request.requestedAt)}
          </p>
        </div>
        <StatusBadge {...labTestStatusStyle(request.status)} />
      </div>

      {(collectMutation.isError || startProcessingMutation.isError) && (
        <p className="mt-2 text-sm text-red-600">
          {getApiErrorMessage(collectMutation.error ?? startProcessingMutation.error)}
        </p>
      )}

      {request.status === 'REQUESTED' && (
        <Button className="mt-3" size="sm" isLoading={collectMutation.isPending} onClick={() => collectMutation.mutate()}>
          Collect Sample
        </Button>
      )}

      {request.status === 'SAMPLE_COLLECTED' && (
        <Button
          className="mt-3"
          size="sm"
          isLoading={startProcessingMutation.isPending}
          onClick={() => startProcessingMutation.mutate()}
        >
          Start Processing
        </Button>
      )}

      {request.status === 'PROCESSING' && !isCompleting && (
        <Button className="mt-3" size="sm" onClick={() => setIsCompleting(true)}>
          Complete Test
        </Button>
      )}

      {request.status === 'PROCESSING' && isCompleting && (
        <form
          onSubmit={handleSubmit((values) => completeMutation.mutate(values))}
          className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4"
        >
          <div>
            <label htmlFor={`resultSummary-${request.id}`} className="text-sm font-medium text-slate-700">
              Result Summary
            </label>
            <textarea
              id={`resultSummary-${request.id}`}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              {...register('resultSummary')}
            />
            {errors.resultSummary && <p className="mt-1 text-sm text-red-600">{errors.resultSummary.message}</p>}
          </div>
          <Input label="Report File URL (optional)" placeholder="https://…" {...register('reportFileUrl')} />
          {completeMutation.isError && <p className="text-sm text-red-600">{getApiErrorMessage(completeMutation.error)}</p>}
          <div className="flex gap-3">
            <Button type="submit" size="sm" isLoading={completeMutation.isPending}>
              Submit Report
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCompleting(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
