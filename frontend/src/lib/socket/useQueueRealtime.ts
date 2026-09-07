'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './SocketContext';

/**
 * Joins the given doctor's live queue room and invalidates queue queries
 * whenever the backend broadcasts a change, so any page reading queue data
 * for that doctor refetches and re-renders without a manual page refresh.
 */
export function useQueueRealtime(doctorId: number | null | undefined): void {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !doctorId) return;

    socket.emit('queue:join', { doctorId }, (ack: { ok: boolean; error?: string }) => {
      if (!ack?.ok) {
        console.warn(`Could not join live queue updates: ${ack?.error ?? 'unknown error'}`);
      }
    });

    function handleQueueEvent() {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }

    socket.on('queue:updated', handleQueueEvent);
    socket.on('queue:patient-called', handleQueueEvent);

    return () => {
      socket.off('queue:updated', handleQueueEvent);
      socket.off('queue:patient-called', handleQueueEvent);
    };
  }, [socket, doctorId, queryClient]);
}
