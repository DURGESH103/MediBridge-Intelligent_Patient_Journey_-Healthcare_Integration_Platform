import clsx from 'clsx';
import type { JourneyStage } from '@/types/domain';

const STAGE_SUBTITLE: Record<JourneyStage['status'], string> = {
  COMPLETED: 'Completed',
  CURRENT: 'In progress',
  PENDING: 'Upcoming',
  SKIPPED: 'Not required',
};

function StageIcon({ status }: { status: JourneyStage['status'] }) {
  if (status === 'COMPLETED') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.415L8.5 12.086l6.79-6.797a1 1 0 011.415 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }
  if (status === 'CURRENT') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }
  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-300" />;
}

export function JourneyChecklist({ stages }: { stages: JourneyStage[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {stages.map((stage, index) => (
        <li key={stage.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <StageIcon status={stage.status} />
            {index < stages.length - 1 && (
              <span
                className={clsx('mt-1 h-6 w-0.5', stage.status === 'COMPLETED' ? 'bg-emerald-300' : 'bg-slate-200')}
              />
            )}
          </div>
          <div className={clsx('pt-0.5', stage.status === 'SKIPPED' && 'opacity-50')}>
            <p
              className={clsx(
                'text-sm font-medium',
                stage.status === 'CURRENT' ? 'text-blue-700' : 'text-slate-900'
              )}
            >
              {stage.label}
            </p>
            <p className="text-xs text-slate-500">{STAGE_SUBTITLE[stage.status]}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
