import clsx from 'clsx';
import type { TimeSlot } from '@/types/domain';

export function SlotGrid({
  slots,
  selected,
  onSelect,
}: {
  slots: TimeSlot[];
  selected: string | null;
  onSelect: (startTime: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {slots.map((slot) => (
        <button
          key={slot.startTime}
          type="button"
          disabled={!slot.available}
          onClick={() => onSelect(slot.startTime)}
          className={clsx(
            'rounded-md border px-2 py-2 text-sm font-medium transition-colors',
            !slot.available && 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through',
            slot.available && slot.startTime !== selected && 'border-slate-300 text-slate-700 hover:border-brand-400 hover:bg-brand-50',
            slot.available && slot.startTime === selected && 'border-brand-600 bg-brand-600 text-white'
          )}
        >
          {slot.startTime}
        </button>
      ))}
    </div>
  );
}
