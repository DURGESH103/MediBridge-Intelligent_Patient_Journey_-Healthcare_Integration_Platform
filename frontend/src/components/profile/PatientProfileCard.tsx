'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyPatientProfile, updatePatient } from '@/lib/api/patients';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  registerWalkInPatientSchema,
  type RegisterWalkInPatientFormValues,
} from '@/lib/validation/patientSchemas';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

export function PatientProfileCard() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const patientQuery = useQuery({ queryKey: ['patients', 'me'], queryFn: getMyPatientProfile });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RegisterWalkInPatientFormValues>({ resolver: zodResolver(registerWalkInPatientSchema) });

  useEffect(() => {
    if (!patientQuery.data) return;
    reset({
      fullName: patientQuery.data.fullName,
      dateOfBirth: patientQuery.data.dateOfBirth,
      gender: patientQuery.data.gender,
      phone: patientQuery.data.phone,
      email: patientQuery.data.email ?? '',
      address: patientQuery.data.address ?? '',
      emergencyContactName: patientQuery.data.emergencyContactName ?? '',
      emergencyContactPhone: patientQuery.data.emergencyContactPhone ?? '',
    });
  }, [patientQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: RegisterWalkInPatientFormValues) =>
      updatePatient(patientQuery.data!.id, {
        ...values,
        email: values.email || undefined,
        address: values.address || undefined,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactPhone: values.emergencyContactPhone || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['patients', 'me'], updated);
      setSuccessMessage('Patient details updated.');
      setTimeout(() => setSuccessMessage(null), 2500);
    },
  });

  if (patientQuery.isLoading) return <LoadingSpinner />;
  if (patientQuery.isError) return <ErrorState message={getApiErrorMessage(patientQuery.error)} />;
  if (!patientQuery.data) return null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Patient Details</h2>
        <span className="text-xs text-slate-500">{patientQuery.data.patientCode}</span>
      </div>

      <form
        onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        noValidate
      >
        <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <Input label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
        <div className="flex flex-col gap-1">
          <label htmlFor="gender" className="text-sm font-medium text-slate-700">
            Gender
          </label>
          <select
            id="gender"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            {...register('gender')}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
        </div>
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Address" error={errors.address?.message} {...register('address')} />
        <Input
          label="Emergency contact name"
          error={errors.emergencyContactName?.message}
          {...register('emergencyContactName')}
        />
        <Input
          label="Emergency contact phone"
          type="tel"
          error={errors.emergencyContactPhone?.message}
          {...register('emergencyContactPhone')}
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
