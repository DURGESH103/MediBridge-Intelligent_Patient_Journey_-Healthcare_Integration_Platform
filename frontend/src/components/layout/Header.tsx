'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatRole } from '@/lib/formatRole';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-sm font-semibold text-white">
            M
          </div>
          <span className="font-semibold text-slate-900">MediBridge</span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-500">{formatRole(user.role)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
