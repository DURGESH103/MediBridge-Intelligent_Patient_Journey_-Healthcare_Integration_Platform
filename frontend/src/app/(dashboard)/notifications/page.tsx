'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/api/notifications';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/lib/formatDate';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  return (
    <RequireRole roles={['PATIENT']}>
      <NotificationsPageContent />
    </RequireRole>
  );
}

function NotificationsPageContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me', page],
    queryFn: () => listMyNotifications(page, PAGE_SIZE),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });

  const notifications = notificationsQuery.data ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your appointments, queue, and lab reports."
        action={
          hasUnread && (
            <Button
              variant="outline"
              size="sm"
              isLoading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all as read
            </Button>
          )
        }
      />

      {notificationsQuery.isLoading && <LoadingSpinner />}
      {notificationsQuery.isError && <ErrorState message={getApiErrorMessage(notificationsQuery.error)} />}
      {notifications.length === 0 && !notificationsQuery.isLoading && <EmptyState title="No notifications yet" />}
      {notifications.length > 0 && (
        <Card>
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />}
                    <p className={n.isRead ? 'text-sm font-medium text-slate-600' : 'text-sm font-semibold text-slate-900'}>
                      {n.title}
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={markReadMutation.isPending && markReadMutation.variables === n.id}
                    onClick={() => markReadMutation.mutate(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {notifications.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-slate-500">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={notifications.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
