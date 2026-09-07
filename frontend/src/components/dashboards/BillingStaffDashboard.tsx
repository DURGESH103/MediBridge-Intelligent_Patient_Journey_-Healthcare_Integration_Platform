import { Card } from '@/components/ui/Card';

export function BillingStaffDashboard() {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">Welcome</h2>
      <p className="mt-2 text-sm text-slate-500">
        Billing workflows are not yet available in MediBridge. This dashboard will show pending invoices and
        completed visits ready for billing once that module is built.
      </p>
    </Card>
  );
}
