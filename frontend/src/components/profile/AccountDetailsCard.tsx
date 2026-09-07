'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { updateMyProfile } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { updateProfileSchema, type UpdateProfileFormValues } from '@/lib/validation/profileSchemas';
import { formatRole } from '@/lib/formatRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Only roles with no richer profile table (no linked patient/doctor record)
// edit their name here, straight against users.full_name. PATIENT and DOCTOR
// have their own name of record elsewhere (patients.full_name /
// doctors.full_name) - editing it there instead avoids two divergent names
// for the same person.
const NAME_EDITABLE_ROLES = new Set(['ADMIN', 'RECEPTIONIST', 'LAB_STAFF', 'BILLING_STAFF']);

export function AccountDetailsCard() {
  const { user, updateUser } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const canEditName = user ? NAME_EDITABLE_ROLES.has(user.role) : false;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user?.fullName ?? '' },
  });

  const saveMutation = useMutation({
    mutationFn: (values: UpdateProfileFormValues) => updateMyProfile(values.fullName),
    onSuccess: (updated) => {
      updateUser({ fullName: updated.fullName });
      setSuccessMessage('Profile updated.');
      setTimeout(() => setSuccessMessage(null), 2500);
    },
  });

  if (!user) return null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Account</h2>
        <StatusBadge label={formatRole(user.role)} tone="info" />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <p className="text-xs text-slate-500">Email</p>
          <p className="text-sm text-slate-900">{user.email}</p>
        </div>

        {canEditName ? (
          <form
            onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Input label="Full Name" error={errors.fullName?.message} {...register('fullName')} />
            </div>
            <Button type="submit" size="sm" isLoading={saveMutation.isPending} disabled={!isDirty}>
              Save
            </Button>
          </form>
        ) : (
          <div>
            <p className="text-xs text-slate-500">Full Name</p>
            <p className="text-sm text-slate-900">{user.fullName ?? '—'}</p>
          </div>
        )}

        {saveMutation.isError && <p className="text-sm text-red-600">{getApiErrorMessage(saveMutation.error)}</p>}
        {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
      </div>
    </Card>
  );
}
