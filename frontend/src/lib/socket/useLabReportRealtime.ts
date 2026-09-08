'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './SocketContext';

/**
 * Listens for `lab:report-ready` events emitted by the backend to the
 * `patient:<patientId>` room (joined automatically on socket connection for
 * PATIENT users) and invalidates the relevant TanStack Query keys so the
 * lab-reports page and any other consumer of laboratory data refreshes
 * without a manual page reload.
 *
 * Reuses the single socket connection managed by SocketContext — this hook
 * never opens or closes a connection itself, it only attaches and cleans up
 * its own event listener.
 */
export function useLabReportRealtime(patientId: number | null | undefined): void {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !patientId) return;

    function handleLabReportReady() {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'patient', patientId] });
      // Also refresh the journey so the LABORATORY stage updates to COMPLETED.
      queryClient.invalidateQueries({ queryKey: ['journey'] });
    }

    socket.on('lab:report-ready', handleLabReportReady);

    return () => {
      socket.off('lab:report-ready', handleLabReportReady);
    };
  }, [socket, patientId, queryClient]);
}
