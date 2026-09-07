import { formatDateTime } from '@/lib/formatDate';
import type { JourneyEvent } from '@/types/domain';

export function JourneyTimeline({ events }: { events: JourneyEvent[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, index) => (
        <li key={event.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
            {index < events.length - 1 && <span className="mt-1 h-full min-h-4 w-0.5 bg-slate-200" />}
          </div>
          <div className="pb-0.5">
            <p className="text-sm text-slate-900">{event.description}</p>
            <p className="text-xs text-slate-400">{formatDateTime(event.occurredAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
