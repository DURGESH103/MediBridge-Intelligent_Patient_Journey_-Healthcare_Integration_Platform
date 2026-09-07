import { PageHeader } from './PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="This section is under construction" description={`Coming in ${phase}.`} />
    </>
  );
}
