'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const BRAND_FEATURES = [
  'Role-based dashboards for every team member',
  'Real-time queue and notification updates',
  'Complete patient journey tracking',
  'Secure JWT authentication',
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute top-1/3 -right-16 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-white/5" />
        </div>

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white text-sm font-bold backdrop-blur-sm">
              M
            </div>
            <span className="text-lg font-semibold text-white">MediBridge</span>
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              One connected platform for better healthcare
            </h2>
            <p className="mt-3 text-teal-100 leading-relaxed">
              Manage patients, appointments, consultations, laboratory workflows, and billing — all in one place.
            </p>
          </div>

          <ul className="space-y-3">
            {BRAND_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-teal-100">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <p className="text-xs text-teal-300">
            &copy; {new Date().getFullYear()} MediBridge. Intelligent Healthcare Platform.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-8">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white text-sm font-bold shadow-sm">
              M
            </div>
            <span className="text-lg font-semibold text-slate-900">MediBridge</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
