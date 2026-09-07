import clsx from 'clsx';

export type StatusTone = 'success' | 'info' | 'warning' | 'neutral' | 'danger';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONE_CLASSES[tone]
      )}
    >
      {label}
    </span>
  );
}
