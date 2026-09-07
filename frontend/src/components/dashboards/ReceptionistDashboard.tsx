import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const QUICK_ACTIONS = [
  { href: '/patients', title: 'Search or Register Patient', description: 'Find an existing patient or register a walk-in.' },
  { href: '/appointments', title: 'Book Appointment', description: 'Schedule a new appointment for a patient.' },
  { href: '/check-in', title: 'Check-In', description: 'Check in a patient who has arrived for their appointment.' },
];

export function ReceptionistDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {QUICK_ACTIONS.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="h-full transition-colors hover:border-brand-300 hover:bg-brand-50/40">
            <h2 className="text-sm font-semibold text-slate-900">{action.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{action.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
