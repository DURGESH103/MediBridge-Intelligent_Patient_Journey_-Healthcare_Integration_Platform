'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyPatientProfile } from '@/lib/api/patients';
import { getMyCurrentJourney, getPatientTimeline } from '@/lib/api/journey';
import { getApiErrorMessage } from '@/lib/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { JourneyChecklist } from '@/components/journey/JourneyChecklist';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';

export default function JourneyPage() {
  return (
    <RequireRole roles={['PATIENT']}>
      <JourneyPageContent />
    </RequireRole>
  );
}

function JourneyPageContent() {
  const patientQuery = useQuery({ queryKey: ['patients', 'me'], queryFn: getMyPatientProfile });
  const patientId = patientQuery.data?.id;

  const journeyQuery = useQuery({
    queryKey: ['journey', 'me'],
    queryFn: getMyCurrentJourney,
    retry: false,
  });

  const timelineQuery = useQuery({
    queryKey: ['journey', 'timeline', patientId],
    queryFn: () => getPatientTimeline(patientId!),
    enabled: Boolean(patientId),
  });

  if (patientQuery.isLoading) return <LoadingSpinner />;
  if (patientQuery.isError) return <ErrorState message={getApiErrorMessage(patientQuery.error)} />;

  const journeyErrorMessage = journeyQuery.error ? getApiErrorMessage(journeyQuery.error) : null;
  const hasNoAppointments = journeyErrorMessage === 'This patient has no appointments yet';

  return (
    <>
      <PageHeader title="My Journey" description="Track your visit from check-in through to your report." />

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Current Visit</h2>
          {journeyQuery.isLoading && <LoadingSpinner />}
          {journeyQuery.isError && hasNoAppointments && (
            <EmptyState
              title="No visits yet"
              description="Your journey will appear here once you book your first appointment."
            />
          )}
          {journeyQuery.isError && !hasNoAppointments && <ErrorState message={journeyErrorMessage!} />}
          {journeyQuery.data && (
            <div className="mt-4">
              <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
                {journeyQuery.data.nextAction}
              </p>
              <JourneyChecklist stages={journeyQuery.data.stages} />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>
          {timelineQuery.isLoading && <LoadingSpinner />}
          {timelineQuery.isError && <ErrorState message={getApiErrorMessage(timelineQuery.error)} />}
          {timelineQuery.data && timelineQuery.data.length === 0 && <EmptyState title="No activity recorded yet" />}
          {timelineQuery.data && timelineQuery.data.length > 0 && (
            <div className="mt-4">
              <JourneyTimeline events={timelineQuery.data} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
