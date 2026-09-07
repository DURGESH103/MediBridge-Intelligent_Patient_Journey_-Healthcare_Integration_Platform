'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerWalkInPatient, searchPatients } from '@/lib/api/patients';
import { getApiErrorMessage } from '@/lib/api/client';
import { registerWalkInPatientSchema, type RegisterWalkInPatientFormValues } from '@/lib/validation/patientSchemas';
import { formatDate } from '@/lib/formatDate';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PatientsPage() {
  return (
    <RequireRole roles={['ADMIN', 'RECEPTIONIST']}>
      <PatientsPageContent />
    </RequireRole>
  );
}

function PatientsPageContent() {
  const [showForm, setShowForm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeout = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const searchQuery = useQuery({
    queryKey: ['patients', 'search', searchTerm],
    queryFn: () => searchPatients(searchTerm),
    enabled: searchTerm.length > 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterWalkInPatientFormValues>({ resolver: zodResolver(registerWalkInPatientSchema) });

  const registerMutation = useMutation({
    mutationFn: registerWalkInPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', 'search'] });
      reset();
      setShowForm(false);
    },
    onError: (error) => setApiError(getApiErrorMessage(error, 'Could not register patient')),
  });

  function onSubmit(values: RegisterWalkInPatientFormValues) {
    setApiError(null);
    registerMutation.mutate({
      ...values,
      email: values.email || undefined,
      address: values.address || undefined,
      emergencyContactName: values.emergencyContactName || undefined,
      emergencyContactPhone: values.emergencyContactPhone || undefined,
    });
  }

  return (
    <>
      <PageHeader
        title="Patients"
        description="Search existing patients or register a walk-in."
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Register Patient'}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-slate-900">Register Walk-In Patient</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
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
                defaultValue=""
                {...register('gender')}
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
            </div>
            <Input label="Email (optional)" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Address (optional)" error={errors.address?.message} {...register('address')} />
            <Input
              label="Emergency contact name (optional)"
              error={errors.emergencyContactName?.message}
              {...register('emergencyContactName')}
            />
            <Input
              label="Emergency contact phone (optional)"
              type="tel"
              error={errors.emergencyContactPhone?.message}
              {...register('emergencyContactPhone')}
            />

            {apiError && <p className="sm:col-span-2 text-sm text-red-600">{apiError}</p>}

            <Button type="submit" isLoading={isSubmitting || registerMutation.isPending} className="sm:col-span-2">
              Register Patient
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <Input
          placeholder="Search by name, phone, or patient code…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <div className="mt-4">
          {searchTerm.length === 0 && (
            <EmptyState title="Search for a patient" description="Start typing a name, phone number, or patient code." />
          )}
          {searchQuery.isLoading && <LoadingSpinner />}
          {searchQuery.isError && <ErrorState message={getApiErrorMessage(searchQuery.error)} />}
          {searchQuery.data && searchQuery.data.length === 0 && (
            <EmptyState title="No patients found" description="Try a different search term, or register a new patient." />
          )}
          {searchQuery.data && searchQuery.data.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {searchQuery.data.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{patient.fullName}</p>
                      <p className="text-xs text-slate-500">
                        {patient.patientCode} · {patient.phone} · DOB {formatDate(patient.dateOfBirth)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </>
  );
}
