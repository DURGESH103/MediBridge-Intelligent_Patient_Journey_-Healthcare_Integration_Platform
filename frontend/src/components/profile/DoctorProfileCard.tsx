'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyDoctorProfile, listDepartments, updateDoctor } from '@/lib/api/doctors';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  updateDoctorProfileSchema,
  type UpdateDoctorProfileFormValues,
} from '@/lib/validation/profileSchemas';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

export function DoctorProfileCard() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const doctorQuery = useQuery({ queryKey: ['doctors', 'me'], queryFn: getMyDoctorProfile });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: listDepartments });
  const department = departmentsQuery.data?.find((d) => d.id === doctorQuery.data?.departmentId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateDoctorProfileFormValues>({ resolver: zodResolver(updateDoctorProfileSchema) });

  useEffect(() => {
    if (!doctorQuery.data) return;
    reset({
      specialization: doctorQuery.data.specialization,
      qualification: doctorQuery.data.qualification ?? '',
      phone: doctorQuery.data.phone ?? '',
      consultationFee: doctorQuery.data.consultationFee != null ? String(doctorQuery.data.consultationFee) : '',
    });
  }, [doctorQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: UpdateDoctorProfileFormValues) =>
      updateDoctor(doctorQuery.data!.id, {
        specialization: values.specialization,
        qualification: values.qualification || null,
        phone: values.phone || null,
        consultationFee: values.consultationFee ? Number(values.consultationFee) : null,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['doctors', 'me'], updated);
      setSuccessMessage('Doctor profile updated.');
      setTimeout(() => setSuccessMessage(null), 2500);
    },
  });

  if (doctorQuery.isLoading) return <LoadingSpinner />;
  if (doctorQuery.isError) return <ErrorState message={getApiErrorMessage(doctorQuery.error)} />;
  if (!doctorQuery.data) return null;

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">Doctor Profile</h2>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Full Name</dt>
          <dd className="text-sm text-slate-900">{doctorQuery.data.fullName}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Department</dt>
          <dd className="text-sm text-slate-900">{department?.name ?? '—'}</dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-slate-400">Full name and department are managed by an administrator.</p>

      <form
        onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        noValidate
      >
        <Input label="Specialization" error={errors.specialization?.message} {...register('specialization')} />
        <Input label="Qualification" error={errors.qualification?.message} {...register('qualification')} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <Input
          label="Consultation Fee"
          type="number"
          step="0.01"
          error={errors.consultationFee?.message}
          {...register('consultationFee')}
        />

        {updateMutation.isError && (
          <p className="sm:col-span-2 text-sm text-red-600">{getApiErrorMessage(updateMutation.error)}</p>
        )}
        {successMessage && <p className="sm:col-span-2 text-sm text-emerald-600">{successMessage}</p>}

        <Button
          type="submit"
          isLoading={isSubmitting || updateMutation.isPending}
          disabled={!isDirty}
          className="sm:col-span-2 self-start"
        >
          Save Changes
        </Button>
      </form>
    </Card>
  );
}
