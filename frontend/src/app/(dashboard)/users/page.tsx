'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStaffUser, listUsers, setUserActive } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { createStaffUserSchema, type CreateStaffUserFormValues } from '@/lib/validation/staffUserSchemas';
import { formatRole } from '@/lib/formatRole';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

const STAFF_ROLES = ['ADMIN', 'RECEPTIONIST', 'LAB_STAFF', 'BILLING_STAFF'] as const;

export default function StaffUsersPage() {
  return (
    <RequireRole roles={['ADMIN']}>
      <StaffUsersPageContent />
    </RequireRole>
  );
}

function StaffUsersPageContent() {
  const [showForm, setShowForm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => listUsers() });
  const staffUsers = (usersQuery.data ?? []).filter((u) => u.role !== 'PATIENT');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffUserFormValues>({ resolver: zodResolver(createStaffUserSchema) });

  const createMutation = useMutation({
    mutationFn: createStaffUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      setShowForm(false);
    },
    onError: (error) => setApiError(getApiErrorMessage(error, 'Could not create user')),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setUserActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  function onSubmit(values: CreateStaffUserFormValues) {
    setApiError(null);
    createMutation.mutate(values);
  }

  return (
    <>
      <PageHeader
        title="Staff Users"
        description="Manage receptionist, lab, billing, and administrator accounts."
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add Staff User'}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-slate-900">Create Staff Account</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3" noValidate>
            <Input label="Full Name (optional)" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
            <div className="flex flex-col gap-1">
              <label htmlFor="role" className="text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                id="role"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                defaultValue=""
                {...register('role')}
              >
                <option value="" disabled>
                  Select role
                </option>
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatRole(role)}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
            </div>

            {apiError && <p className="sm:col-span-3 text-sm text-red-600">{apiError}</p>}

            <Button type="submit" isLoading={isSubmitting || createMutation.isPending} className="sm:col-span-3">
              Create Account
            </Button>
          </form>
        </Card>
      )}

      <Card>
        {usersQuery.isLoading && <LoadingSpinner />}
        {usersQuery.isError && <ErrorState message={getApiErrorMessage(usersQuery.error)} />}
        {staffUsers.length === 0 && !usersQuery.isLoading && <EmptyState title="No staff accounts yet" />}
        {staffUsers.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {staffUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{user.fullName ?? user.email}</p>
                  <p className="truncate text-xs text-slate-500">
                    {user.fullName ? user.email : formatRole(user.role)}
                    {user.fullName ? ` · ${formatRole(user.role)}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge label={user.isActive ? 'Active' : 'Inactive'} tone={user.isActive ? 'success' : 'neutral'} />
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={toggleActiveMutation.isPending && toggleActiveMutation.variables?.id === user.id}
                    onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
