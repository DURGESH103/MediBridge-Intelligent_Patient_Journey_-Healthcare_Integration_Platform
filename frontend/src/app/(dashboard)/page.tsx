'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { formatRole } from '@/lib/formatRole';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DashboardHomePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <PageHeader title={`Welcome, ${user.email}`} description={`Signed in as ${formatRole(user.role)}`} />
      <Card>
        <p className="text-sm text-slate-600">
          The {formatRole(user.role)} dashboard is being built next. Authentication is fully wired up: your
          session survives a page refresh via a silently-renewed access token.
        </p>
      </Card>
    </>
  );
}
