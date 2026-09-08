'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/api/client';
import { registerSchema, type RegisterFormValues } from '@/lib/validation/authSchemas';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
    hasError ? 'border-red-400' : 'border-slate-300 hover:border-slate-400'
  }`;

export default function RegisterPage() {
  const { registerPatient } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setApiError(null);
    try {
      await registerPatient(values);
      router.replace('/');
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Unable to create your account. Please try again.'));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500">Register as a patient to book appointments and track your visits.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Personal Information */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Personal Information</p>

          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              id="fullName"
              placeholder="Jane Doe"
              aria-invalid={Boolean(errors.fullName)}
              className={inputClass(Boolean(errors.fullName))}
              {...register('fullName')}
            />
            <FieldError message={errors.fullName?.message} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              className={inputClass(Boolean(errors.email))}
              {...register('email')}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone number</label>
            <input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              aria-invalid={Boolean(errors.phone)}
              className={inputClass(Boolean(errors.phone))}
              {...register('phone')}
            />
            <FieldError message={errors.phone?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700">Date of birth</label>
              <input
                id="dateOfBirth"
                type="date"
                aria-invalid={Boolean(errors.dateOfBirth)}
                className={inputClass(Boolean(errors.dateOfBirth))}
                {...register('dateOfBirth')}
              />
              <FieldError message={errors.dateOfBirth?.message} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="gender" className="block text-sm font-medium text-slate-700">Gender</label>
              <select
                id="gender"
                defaultValue=""
                aria-invalid={Boolean(errors.gender)}
                className={`${inputClass(Boolean(errors.gender))} appearance-none`}
                {...register('gender')}
              >
                <option value="" disabled>Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <FieldError message={errors.gender?.message} />
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Account Security</p>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                aria-invalid={Boolean(errors.password)}
                className={`${inputClass(Boolean(errors.password))} pr-16`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors px-1 py-0.5"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className={`${inputClass(Boolean(errors.confirmPassword))} pr-16`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors px-1 py-0.5"
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            <FieldError message={errors.confirmPassword?.message} />
          </div>
        </div>

        {/* API error */}
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3"
          >
            <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
