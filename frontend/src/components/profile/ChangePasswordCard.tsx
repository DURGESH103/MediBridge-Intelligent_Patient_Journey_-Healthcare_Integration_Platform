'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/validation/profileSchemas';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function ChangePasswordCard() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const changeMutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) => changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      reset();
      setSuccessMessage('Password changed.');
      setTimeout(() => setSuccessMessage(null), 2500);
    },
  });

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">Change Password</h2>
      <form
        onSubmit={handleSubmit((values) => changeMutation.mutate(values))}
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        noValidate
      >
        <Input
          label="Current Password"
          type="password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Input label="New Password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input
          label="Confirm New Password"
          type="password"
          error={errors.confirmNewPassword?.message}
          {...register('confirmNewPassword')}
        />

        {changeMutation.isError && (
          <p className="sm:col-span-3 text-sm text-red-600">{getApiErrorMessage(changeMutation.error)}</p>
        )}
        {successMessage && <p className="sm:col-span-3 text-sm text-emerald-600">{successMessage}</p>}

        <Button
          type="submit"
          size="sm"
          isLoading={isSubmitting || changeMutation.isPending}
          className="self-start sm:col-span-3"
        >
          Update Password
        </Button>
      </form>
    </Card>
  );
}
