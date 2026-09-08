'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { getUnreadNotificationCount } from '@/lib/api/notifications';
import { formatRole } from '@/lib/formatRole';
import { Button } from '@/components/ui/Button';

// Roles that have a /notifications page and should see the badge.
const NOTIFICATION_ROLES = new Set([
  'PATIENT',
  'DOCTOR',
  'RECEPTIONIST',
  'LAB_STAFF',
  'BILLING_STAFF',
  'ADMIN',
]);

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  // The unread count query is invalidated by useNotificationsRealtime (active
  // on every dashboard page via the layout) whenever notification:new fires,
  // and by the notifications page itself when items are marked read — so this
  // badge stays in sync without any extra polling.
  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(user) && NOTIFICATION_ROLES.has(user?.role ?? ''),
  });

  const unreadCount = unreadQuery.data ?? 0;
  const showBadge = unreadCount > 0;

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-sm font-semibold text-white">
              M
            </div>
            <span className="font-semibold text-slate-900">MediBridge</span>
          </div>
        </div>

        {user && (
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden max-w-48 text-right sm:block">
              <p className="truncate text-sm font-medium text-slate-900">{user.fullName ?? user.email}</p>
              <p className="truncate text-xs text-slate-500">
                {user.fullName ? user.email : formatRole(user.role)}
              </p>
            </div>

            {NOTIFICATION_ROLES.has(user.role) && (
              <Link
                href="/notifications"
                aria-label={showBadge ? `${unreadCount} unread notifications` : 'Notifications'}
                className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            <Button variant="outline" size="sm" className="shrink-0" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
