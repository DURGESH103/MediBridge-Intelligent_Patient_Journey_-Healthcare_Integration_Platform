'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listDepartments, listDoctors, registerDoctor } from '@/lib/api/doctors';
import { getApiErrorMessage } from '@/lib/api/client';
import { registerDoctorSchema, type RegisterDoctorFormValues } from '@/lib/validation/doctorSchemas';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DoctorsPage() {
  return (
    <RequireRole roles={['ADMIN']}>
      <DoctorsPageContent />
    </RequireRole>
  );
}

function DoctorsPageContent() {
  const [showForm, setShowForm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const doctorsQuery = useQuery({ queryKey: ['doctors'], queryFn: () => listDoctors() });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: listDepartments });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDoctorFormValues>({
    resolver: zodResolver(registerDoctorSchema),
    defaultValues: { averageConsultationMinutes: '15' },
  });

  const registerMutation = useMutation({
    mutationFn: registerDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      reset();
      setShowForm(false);
    },
    onError: (error) => setApiError(getApiErrorMessage(error, 'Could not register doctor')),
  });

  function onSubmit(values: RegisterDoctorFormValues) {
    setApiError(null);
    registerMutation.mutate({
      email: values.email,
      password: values.password,
      departmentId: Number(values.departmentId),
      fullName: values.fullName,
      specialization: values.specialization,
      qualification: values.qualification || undefined,
      phone: values.phone || undefined,
      consultationFee: values.consultationFee ? Number(values.consultationFee) : undefined,
      averageConsultationMinutes: Number(values.averageConsultationMinutes),
    });
  }

  const departmentNameById = new Map((departmentsQuery.data ?? []).map((d) => [d.id, d.name]));

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Manage doctor profiles."
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add Doctor'}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-slate-900">Register Doctor</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
            <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Specialization" error={errors.specialization?.message} {...register('specialization')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />

            <div className="flex flex-col gap-1">
              <label htmlFor="departmentId" className="text-sm font-medium text-slate-700">
                Department
              </label>
              <select
                id="departmentId"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                defaultValue=""
                {...register('departmentId')}
              >
                <option value="" disabled>
                  Select department
                </option>
                {(departmentsQuery.data ?? []).map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className="text-sm text-red-600">{errors.departmentId.message}</p>}
            </div>

            <Input label="Qualification (optional)" error={errors.qualification?.message} {...register('qualification')} />
            <Input label="Phone (optional)" type="tel" error={errors.phone?.message} {...register('phone')} />
            <Input
              label="Consultation fee (optional)"
              type="number"
              step="0.01"
              error={errors.consultationFee?.message}
              {...register('consultationFee')}
            />
            <Input
              label="Avg. consultation minutes"
              type="number"
              error={errors.averageConsultationMinutes?.message}
              {...register('averageConsultationMinutes')}
            />

            {apiError && <p className="sm:col-span-2 text-sm text-red-600">{apiError}</p>}

            <Button type="submit" isLoading={isSubmitting || registerMutation.isPending} className="sm:col-span-2">
              Register Doctor
            </Button>
          </form>
        </Card>
      )}

      <Card>
        {doctorsQuery.isLoading && <LoadingSpinner />}
        {doctorsQuery.isError && <ErrorState message={getApiErrorMessage(doctorsQuery.error)} />}
        {doctorsQuery.data && doctorsQuery.data.length === 0 && (
          <EmptyState title="No doctors yet" description="Register your first doctor above." />
        )}
        {doctorsQuery.data && doctorsQuery.data.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {doctorsQuery.data.map((doctor) => (
              <li key={doctor.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{doctor.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {doctor.specialization} · {departmentNameById.get(doctor.departmentId) ?? 'Unknown department'}
                  </p>
                </div>
                <p className="text-xs text-slate-400">{doctor.averageConsultationMinutes} min / visit</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
