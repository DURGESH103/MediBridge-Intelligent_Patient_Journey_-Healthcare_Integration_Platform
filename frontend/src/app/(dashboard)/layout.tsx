'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotificationsRealtime } from '@/lib/socket/useNotificationsRealtime';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { NAV_ITEMS_BY_ROLE } from '@/lib/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Active for every authenticated page, not just /notifications, so the
  // dashboard's "Recent Notifications" card and any other consumer of
  // notification queries also update live.
  useNotificationsRealtime();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated' || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  const navItems = NAV_ITEMS_BY_ROLE[user.role];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      <div className="flex flex-1">
        <AppSidebar navItems={navItems} isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
