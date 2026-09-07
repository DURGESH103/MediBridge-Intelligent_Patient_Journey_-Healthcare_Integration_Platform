import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import type { UserRole } from '@/types/roles';
import { EmptyState } from '@/components/ui/EmptyState';

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;

  if (!roles.includes(user.role)) {
    return <EmptyState title="You don't have access to this page" description="Contact an administrator if you believe this is a mistake." />;
  }

  return <>{children}</>;
}
