'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './SocketContext';

/**
 * Subscribes to the backend's `notification:new` push for the current user
 * (rooms are joined server-side from the socket's own auth, so there's
 * nothing to emit/join here) and invalidates notification queries so the
 * bell/list/dashboard card refetch without a page refresh. Reuses the one
 * socket connection SocketContext already opens per session - this hook
 * never opens or closes a connection itself, it just listens and cleans up
 * its own listener on unmount or when the socket changes (e.g. on logout).
 */
export function useNotificationsRealtime(): void {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    function handleNewNotification() {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, queryClient]);
}
