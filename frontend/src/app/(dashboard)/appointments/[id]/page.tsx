'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelAppointment,
  confirmAppointment,
  getAppointmentById,
  getAvailableSlots,
  markNoShow,
  rescheduleAppointment,
} from '@/lib/api/appointments';
import { checkIn } from '@/lib/api/queue';
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
const CHECK_IN_STATUSES = new Set(['SCHEDULED', 'CONFIRMED']);

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
  const [checkInToken, setCheckInToken] = useState<number | null>(null);
  const [showNoShowConfirm, setShowNoShowConfirm] = useState(false);

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

  const checkInMutation = useMutation({
    mutationFn: () => checkIn(appointmentId),
    onSuccess: (entry) => {
      setCheckInToken(entry.tokenNumber);
      invalidateAppointment();
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['journey'] });
    },
    onError: (error) => setApiError(getApiErrorMessage(error)),
  });

  const noShowMutation = useMutation({
    mutationFn: () => markNoShow(appointmentId),
    onSuccess: () => {
      setShowNoShowConfirm(false);
      invalidateAppointment();
      queryClient.invalidateQueries({ queryKey: ['journey'] });
    },
    onError: (error) => {
      setShowNoShowConfirm(false);
      setApiError(getApiErrorMessage(error));
    },
  });

  if (appointmentQuery.isLoading) return <LoadingSpinner />;
  if (appointmentQuery.isError) return <ErrorState message={getApiErrorMessage(appointmentQuery.error)} />;
  if (!appointmentQuery.data) return null;

  const appointment = appointmentQuery.data;
  const canAct = ACTIONABLE_STATUSES.has(appointment.status);
  const appointmentDate = appointment.scheduledAt.slice(0, 10);
  const isToday = appointmentDate === todayDateString();
  const canCheckIn =
    user?.role === 'PATIENT' &&
    CHECK_IN_STATUSES.has(appointment.status) &&
    isToday;
  const canMarkNoShow =
    (user?.role === 'DOCTOR' || user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN') &&
    ACTIONABLE_STATUSES.has(appointment.status);

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

        {checkInToken !== null && (
          <Card className="border-emerald-200 bg-emerald-50 text-center">
            <p className="text-sm font-medium text-emerald-800">Checked in successfully!</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">Token #{checkInToken}</p>
            <p className="mt-1 text-xs text-emerald-700">Please wait to be called.</p>
          </Card>
        )}

        {canCheckIn && checkInToken === null && (
          <Card>
            <p className="text-sm text-slate-600">Your appointment is today. Check in to join the queue.</p>
            <Button
              className="mt-3"
              isLoading={checkInMutation.isPending}
              onClick={() => { setApiError(null); checkInMutation.mutate(); }}
            >
              Check In
            </Button>
          </Card>
        )}

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
            {canMarkNoShow && (
              <Button
                variant="outline"
                onClick={() => { setApiError(null); setShowNoShowConfirm(true); }}
              >
                Mark as No-Show
              </Button>
            )}
          </div>
        )}

        {showNoShowConfirm && (
          <Card className="border-amber-200 bg-amber-50">
            <p className="text-sm font-medium text-amber-900">
              Mark this appointment as no-show?
            </p>
            <p className="mt-1 text-xs text-amber-700">
              This cannot be undone. The patient will be recorded as having not attended.
            </p>
            <div className="mt-3 flex gap-3">
              <Button
                size="sm"
                variant="danger"
                isLoading={noShowMutation.isPending}
                onClick={() => noShowMutation.mutate()}
              >
                Confirm No-Show
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNoShowConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </Card>
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
