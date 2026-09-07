'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-white font-semibold">
          M
        </div>
        <span className="text-lg font-semibold text-slate-900">MediBridge</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
