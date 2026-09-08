'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyPatientProfile } from '@/lib/api/patients';
import { listLabTestsForPatient } from '@/lib/api/laboratory';
import { getApiErrorMessage } from '@/lib/api/client';
import { useLabReportRealtime } from '@/lib/socket/useLabReportRealtime';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { LabReportCard } from '@/components/laboratory/LabReportCard';

export default function LabReportsPage() {
  return (
    <RequireRole roles={['PATIENT']}>
      <LabReportsPageContent />
    </RequireRole>
  );
}

function LabReportsPageContent() {
  const patientQuery = useQuery({ queryKey: ['patients', 'me'], queryFn: getMyPatientProfile });
  const patientId = patientQuery.data?.id;

  const labTestsQuery = useQuery({
    queryKey: ['laboratory', 'patient', patientId],
    queryFn: () => listLabTestsForPatient(patientId!),
    enabled: Boolean(patientId),
  });

  // Automatically refresh when the backend emits lab:report-ready for this patient.
  useLabReportRealtime(patientId);

  if (patientQuery.isLoading) return <LoadingSpinner />;
  if (patientQuery.isError) return <ErrorState message={getApiErrorMessage(patientQuery.error)} />;

  return (
    <>
      <PageHeader title="Lab Reports" description="Your laboratory test requests and results." />

      {labTestsQuery.isLoading && <LoadingSpinner />}
      {labTestsQuery.isError && <ErrorState message={getApiErrorMessage(labTestsQuery.error)} />}
      {labTestsQuery.data && labTestsQuery.data.length === 0 && <EmptyState title="No laboratory tests on record" />}
      {labTestsQuery.data && labTestsQuery.data.length > 0 && (
        <div className="flex flex-col gap-4">
          {labTestsQuery.data.map((request) => (
            <LabReportCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </>
  );
}
