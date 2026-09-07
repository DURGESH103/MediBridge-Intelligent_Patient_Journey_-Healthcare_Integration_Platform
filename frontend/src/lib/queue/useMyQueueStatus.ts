import { useQuery } from '@tanstack/react-query';
import { listAppointments } from '@/lib/api/appointments';
import { getQueueEntryByAppointment, getQueueEntryStatus } from '@/lib/api/queue';
import { useQueueRealtime } from '@/lib/socket/useQueueRealtime';

/**
 * Resolves the current patient's active queue entry (if any) from their
 * checked-in appointment and subscribes to live updates for it. Shared by
 * the full queue page and the dashboard summary card so both stay in sync
 * without duplicating the lookup logic.
 */
export function useMyQueueStatus() {
  const appointmentsQuery = useQuery({ queryKey: ['appointments', 'me'], queryFn: () => listAppointments() });
  const checkedInAppointment = appointmentsQuery.data?.find((a) => a.status === 'CHECKED_IN');

  const entryQuery = useQuery({
    queryKey: ['queue', 'entry', 'byAppointment', checkedInAppointment?.id],
    queryFn: () => getQueueEntryByAppointment(checkedInAppointment!.id),
    enabled: Boolean(checkedInAppointment),
  });

  const statusQuery = useQuery({
    queryKey: ['queue', 'status', entryQuery.data?.id],
    queryFn: () => getQueueEntryStatus(entryQuery.data!.id),
    enabled: Boolean(entryQuery.data),
  });

  useQueueRealtime(entryQuery.data?.doctorId);

  return { appointmentsQuery, checkedInAppointment, entryQuery, statusQuery };
}
