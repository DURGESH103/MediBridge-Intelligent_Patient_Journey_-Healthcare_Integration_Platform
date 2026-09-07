'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/api/client';
import { loginSchema, type LoginFormValues } from '@/lib/validation/authSchemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setApiError(null);
    try {
      await login(values);
      router.replace('/');
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Unable to log in. Please try again.'));
    }
  }

  return (
    <Card>
      <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back to MediBridge.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-8 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {apiError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New patient?{' '}
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
