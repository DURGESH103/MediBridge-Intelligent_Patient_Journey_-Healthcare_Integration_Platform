'use client';

import { useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppointmentById } from '@/lib/api/appointments';
import { getPatientById } from '@/lib/api/patients';
import { completeConsultation, getConsultationByAppointment, startConsultation } from '@/lib/api/consultations';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/lib/formatDate';
import { appointmentStatusStyle, consultationStatusStyle } from '@/lib/statusStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConsultationNotesForm } from '@/components/consultations/ConsultationNotesForm';
import { PrescriptionsPanel } from '@/components/consultations/PrescriptionsPanel';
import { LabTestsPanel } from '@/components/consultations/LabTestsPanel';

export default function ConsultationWorkspacePage() {
  return (
    <RequireRole roles={['DOCTOR']}>
      <ConsultationWorkspaceContent />
    </RequireRole>
  );
}

function ConsultationWorkspaceContent() {
  const { appointmentId: appointmentIdParam } = useParams<{ appointmentId: string }>();
  const appointmentId = Number(appointmentIdParam);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const appointmentQuery = useQuery({
    queryKey: ['appointments', appointmentId],
    queryFn: () => getAppointmentById(appointmentId),
    enabled: Number.isFinite(appointmentId),
  });

  const patientQuery = useQuery({
    queryKey: ['patients', appointmentQuery.data?.patientId],
    queryFn: () => getPatientById(appointmentQuery.data!.patientId),
    enabled: Boolean(appointmentQuery.data),
  });

  const consultationQuery = useQuery({
    queryKey: ['consultations', 'byAppointment', appointmentId],
    queryFn: () => getConsultationByAppointment(appointmentId),
    enabled: Boolean(appointmentQuery.data),
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: () => startConsultation(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations', 'byAppointment', appointmentId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeConsultation(consultationQuery.data!.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', 'byAppointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      setCompletionMessage(
        result.nextStep === 'LABORATORY'
          ? 'Consultation completed. Sent to laboratory for testing.'
          : 'Consultation completed. Sent to billing.'
      );
    },
  });

  if (appointmentQuery.isLoading) return <LoadingSpinner />;
  if (appointmentQuery.isError) return <ErrorState message={getApiErrorMessage(appointmentQuery.error)} />;
  if (!appointmentQuery.data) return null;

  const appointment = appointmentQuery.data;
  const consultationNotFound =
    axios.isAxiosError(consultationQuery.error) && consultationQuery.error.response?.status === 404;

  return (
    <>
      <PageHeader
        title={patientQuery.data ? patientQuery.data.fullName : 'Consultation'}
        description={`Appointment on ${formatDateTime(appointment.scheduledAt)}`}
        action={<StatusBadge {...appointmentStatusStyle(appointment.status)} />}
      />

      <div className="flex flex-col gap-6">
        {appointment.reason && (
          <Card>
            <p className="text-xs text-slate-500">Reason for visit</p>
            <p className="mt-1 text-sm text-slate-700">{appointment.reason}</p>
          </Card>
        )}

        {consultationQuery.isLoading && <LoadingSpinner />}

        {consultationNotFound && appointment.status !== 'CHECKED_IN' && (
          <ErrorState message="This appointment isn't checked in, so a consultation can't be started yet." />
        )}

        {consultationNotFound && appointment.status === 'CHECKED_IN' && (
          <Card className="text-center">
            <p className="text-sm text-slate-600">No consultation has been started for this appointment yet.</p>
            {startMutation.isError && (
              <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(startMutation.error)}</p>
            )}
            <Button className="mt-4" isLoading={startMutation.isPending} onClick={() => startMutation.mutate()}>
              Start Consultation
            </Button>
          </Card>
        )}

        {consultationQuery.isError && !consultationNotFound && (
          <ErrorState message={getApiErrorMessage(consultationQuery.error)} />
        )}

        {consultationQuery.data && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Consultation status</span>
              <StatusBadge {...consultationStatusStyle(consultationQuery.data.status)} />
            </div>

            <ConsultationNotesForm
              consultation={consultationQuery.data}
              appointmentId={appointmentId}
              readOnly={consultationQuery.data.status === 'COMPLETED'}
            />

            <PrescriptionsPanel
              consultationId={consultationQuery.data.id}
              readOnly={consultationQuery.data.status === 'COMPLETED'}
            />

            <LabTestsPanel
              consultationId={consultationQuery.data.id}
              readOnly={consultationQuery.data.status === 'COMPLETED'}
            />

            {completeMutation.isError && (
              <p className="text-sm text-red-600">{getApiErrorMessage(completeMutation.error)}</p>
            )}
            {completionMessage && <p className="text-sm text-emerald-600">{completionMessage}</p>}

            {consultationQuery.data.status === 'IN_PROGRESS' && !completionMessage && (
              <Button isLoading={completeMutation.isPending} onClick={() => completeMutation.mutate()} className="self-start">
                Complete Consultation
              </Button>
            )}
          </>
        )}

        <Button variant="ghost" onClick={() => router.push('/consultations')} className="self-start">
          Back to Consultations
        </Button>
      </div>
    </>
  );
}
