'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import type { UserRole } from '@/types/roles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  const isUnauthorized = status === 'authenticated' && user !== null && !roles.includes(user.role);

  useEffect(() => {
    if (isUnauthorized) {
      router.replace('/');
    }
  }, [isUnauthorized, router]);

  // Still loading — don't flash content or redirect prematurely.
  if (status === 'loading') return <LoadingSpinner />;

  // Not authenticated — the dashboard layout already handles the /login redirect.
  if (!user) return null;

  // Wrong role — redirect is in flight, render nothing so the page content
  // never flashes before the navigation completes.
  if (isUnauthorized) return null;

  return <>{children}</>;
}
