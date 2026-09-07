'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDepartment, listDepartments } from '@/lib/api/doctors';
import { getApiErrorMessage } from '@/lib/api/client';
import { createDepartmentSchema, type CreateDepartmentFormValues } from '@/lib/validation/departmentSchemas';
import { formatDate } from '@/lib/formatDate';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DepartmentsPage() {
  return (
    <RequireRole roles={['ADMIN']}>
      <DepartmentsPageContent />
    </RequireRole>
  );
}

function DepartmentsPageContent() {
  const [apiError, setApiError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: listDepartments });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDepartmentFormValues>({ resolver: zodResolver(createDepartmentSchema) });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      reset();
    },
    onError: (error) => setApiError(getApiErrorMessage(error, 'Could not create department')),
  });

  function onSubmit(values: CreateDepartmentFormValues) {
    setApiError(null);
    createMutation.mutate(values);
  }

  return (
    <>
      <PageHeader title="Departments" description="Manage the hospital's clinical departments." />

      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900">Add Department</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start" noValidate>
          <div className="flex-1">
            <Input placeholder="e.g. Cardiology" error={errors.name?.message} {...register('name')} />
          </div>
          <div className="flex-1">
            <Input placeholder="Description (optional)" error={errors.description?.message} {...register('description')} />
          </div>
          <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
            Add
          </Button>
        </form>
        {apiError && <p className="mt-3 text-sm text-red-600">{apiError}</p>}
      </Card>

      <Card>
        {departmentsQuery.isLoading && <LoadingSpinner />}
        {departmentsQuery.isError && <ErrorState message={getApiErrorMessage(departmentsQuery.error)} />}
        {departmentsQuery.data && departmentsQuery.data.length === 0 && (
          <EmptyState title="No departments yet" description="Add your first department above." />
        )}
        {departmentsQuery.data && departmentsQuery.data.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {departmentsQuery.data.map((dept) => (
              <li key={dept.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{dept.name}</p>
                  {dept.description && <p className="text-xs text-slate-500">{dept.description}</p>}
                </div>
                <p className="text-xs text-slate-400">Added {formatDate(dept.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
