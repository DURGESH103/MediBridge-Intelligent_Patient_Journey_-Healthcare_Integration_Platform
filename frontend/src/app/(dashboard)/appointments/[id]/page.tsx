'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelAppointment,
  confirmAppointment,
  getAppointmentById,
  getAvailableSlots,
  rescheduleAppointment,
} from '@/lib/api/appointments';
import { getDoctorById } from '@/lib/api/doctors';
import { getPatientById } from '@/lib/api/patients';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatDateTime, todayDateString, toScheduledAtUtc } from '@/lib/formatDate';
import { appointmentStatusStyle } from '@/lib/statusStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SlotGrid } from '@/components/appointments/SlotGrid';

export default function AppointmentDetailPage() {
  return (
    <RequireRole roles={['PATIENT', 'RECEPTIONIST']}>
      <AppointmentDetailPageContent />
    </RequireRole>
  );
}

const ACTIONABLE_STATUSES = new Set(['SCHEDULED', 'CONFIRMED']);

function AppointmentDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const appointmentId = Number(id);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [apiError, setApiError] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(todayDateString());
  const [rescheduleSlot, setRescheduleSlot] = useState<string | null>(null);

  const appointmentQuery = useQuery({
    queryKey: ['appointments', appointmentId],
    queryFn: () => getAppointmentById(appointmentId),
    enabled: Number.isFinite(appointmentId),
  });

  const doctorQuery = useQuery({
    queryKey: ['doctors', appointmentQuery.data?.doctorId],
    queryFn: () => getDoctorById(appointmentQuery.data!.doctorId),
    enabled: Boolean(appointmentQuery.data),
  });

  const patientQuery = useQuery({
    queryKey: ['patients', appointmentQuery.data?.patientId],
    queryFn: () => getPatientById(appointmentQuery.data!.patientId),
    enabled: Boolean(appointmentQuery.data) && user?.role === 'RECEPTIONIST',
  });

  const slotsQuery = useQuery({
    queryKey: ['appointments', 'slots', appointmentQuery.data?.doctorId, rescheduleDate],
    queryFn: () => getAvailableSlots(appointmentQuery.data!.doctorId, rescheduleDate),
    enabled: isRescheduling && Boolean(appointmentQuery.data),
  });

  function invalidateAppointment() {
    queryClient.invalidateQueries({ queryKey: ['appointments', appointmentId] });
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  }

  const confirmMutation = useMutation({
    mutationFn: () => confirmAppointment(appointmentId),
    onSuccess: invalidateAppointment,
    onError: (error) => setApiError(getApiErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(appointmentId),
    onSuccess: invalidateAppointment,
    onError: (error) => setApiError(getApiErrorMessage(error)),
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => rescheduleAppointment(appointmentId, toScheduledAtUtc(rescheduleDate, rescheduleSlot!)),
    onSuccess: () => {
      invalidateAppointment();
      setIsRescheduling(false);
      setRescheduleSlot(null);
    },
    onError: (error) => setApiError(getApiErrorMessage(error)),
  });

  if (appointmentQuery.isLoading) return <LoadingSpinner />;
  if (appointmentQuery.isError) return <ErrorState message={getApiErrorMessage(appointmentQuery.error)} />;
  if (!appointmentQuery.data) return null;

  const appointment = appointmentQuery.data;
  const canAct = ACTIONABLE_STATUSES.has(appointment.status);

  return (
    <>
      <PageHeader title="Appointment Details" action={<StatusBadge {...appointmentStatusStyle(appointment.status)} />} />

      <div className="flex flex-col gap-6">
        <Card>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Date &amp; Time</dt>
              <dd className="text-sm font-medium text-slate-900">{formatDateTime(appointment.scheduledAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Doctor</dt>
              <dd className="text-sm font-medium text-slate-900">
                {doctorQuery.data ? `${doctorQuery.data.fullName} · ${doctorQuery.data.specialization}` : '—'}
              </dd>
            </div>
            {user?.role === 'RECEPTIONIST' && (
              <div>
                <dt className="text-xs text-slate-500">Patient</dt>
                <dd className="text-sm font-medium text-slate-900">{patientQuery.data?.fullName ?? '—'}</dd>
              </div>
            )}
            {appointment.reason && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Reason</dt>
                <dd className="text-sm text-slate-700">{appointment.reason}</dd>
              </div>
            )}
          </dl>
        </Card>

        {apiError && <p className="text-sm text-red-600">{apiError}</p>}

        {canAct && !isRescheduling && (
          <div className="flex flex-wrap gap-3">
            {user?.role === 'RECEPTIONIST' && appointment.status === 'SCHEDULED' && (
              <Button isLoading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
                Confirm Appointment
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsRescheduling(true)}>
              Reschedule
            </Button>
            <Button
              variant="danger"
              isLoading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Cancel Appointment
            </Button>
          </div>
        )}

        {isRescheduling && (
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Reschedule to a New Slot</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsRescheduling(false)}>
                Cancel
              </Button>
            </div>
            <Input
              type="date"
              className="mt-3 w-auto"
              min={todayDateString()}
              value={rescheduleDate}
              onChange={(e) => {
                setRescheduleDate(e.target.value);
                setRescheduleSlot(null);
              }}
            />
            <div className="mt-4">
              {slotsQuery.isLoading && <LoadingSpinner />}
              {slotsQuery.data && (
                <SlotGrid slots={slotsQuery.data} selected={rescheduleSlot} onSelect={setRescheduleSlot} />
              )}
            </div>
            {rescheduleSlot && (
              <Button
                className="mt-4"
                isLoading={rescheduleMutation.isPending}
                onClick={() => rescheduleMutation.mutate()}
              >
                Confirm New Time: {rescheduleDate} at {rescheduleSlot}
              </Button>
            )}
          </Card>
        )}

        <Button variant="ghost" onClick={() => router.push('/appointments')} className="self-start">
          Back to Appointments
        </Button>
      </div>
    </>
  );
}
