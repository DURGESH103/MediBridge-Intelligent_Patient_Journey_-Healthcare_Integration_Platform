'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getMyPatientProfile, getPatientById, searchPatients } from '@/lib/api/patients';
import { listDepartments, listDoctors } from '@/lib/api/doctors';
import { createAppointment, getAvailableSlots } from '@/lib/api/appointments';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { todayDateString, toScheduledAtUtc } from '@/lib/formatDate';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { SlotGrid } from '@/components/appointments/SlotGrid';

export default function BookAppointmentPage() {
  return (
    <RequireRole roles={['PATIENT', 'RECEPTIONIST']}>
      <BookAppointmentPageContent />
    </RequireRole>
  );
}

function BookAppointmentPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isStaff = user?.role === 'RECEPTIONIST';

  // Only meaningful for staff, who pick a patient by search (or arrive with
  // one preselected via ?patientId=). Patients booking for themselves never
  // set this - their id comes straight from their own profile query below.
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    searchParams.get('patientId') ? Number(searchParams.get('patientId')) : null
  );
  const [patientSearch, setPatientSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [date, setDate] = useState(todayDateString());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  // Patients book for themselves; resolve their own patient id once on load.
  const myPatientQuery = useQuery({
    queryKey: ['patients', 'me'],
    queryFn: getMyPatientProfile,
    enabled: !isStaff,
  });
  const patientId = isStaff ? selectedPatientId : (myPatientQuery.data?.id ?? null);

  const selectedPatientQuery = useQuery({
    queryKey: ['patients', patientId],
    queryFn: () => getPatientById(patientId!),
    enabled: Boolean(patientId),
  });

  const patientSearchQuery = useQuery({
    queryKey: ['patients', 'search', patientSearch],
    queryFn: () => searchPatients(patientSearch),
    enabled: isStaff && !patientId && patientSearch.trim().length > 0,
  });

  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: listDepartments });
  const doctorsQuery = useQuery({
    queryKey: ['doctors', departmentId],
    queryFn: () => listDoctors(departmentId!),
    enabled: Boolean(departmentId),
  });
  const slotsQuery = useQuery({
    queryKey: ['appointments', 'slots', doctorId, date],
    queryFn: () => getAvailableSlots(doctorId!, date),
    enabled: Boolean(doctorId) && Boolean(date),
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      createAppointment({
        doctorId: doctorId!,
        scheduledAt: toScheduledAtUtc(date, selectedSlot!),
        reason: reason || undefined,
        patientId: isStaff ? patientId! : undefined,
      }),
    onSuccess: (appointment) => {
      router.push(`/appointments/${appointment.id}`);
    },
    onError: (error) => setApiError(getApiErrorMessage(error, 'Could not book appointment')),
  });

  const selectedDoctor = (doctorsQuery.data ?? []).find((d) => d.id === doctorId);

  return (
    <>
      <PageHeader title="Book Appointment" description="Select a department, doctor, date, and time slot." />

      <div className="flex flex-col gap-6">
        {isStaff && !patientId && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">1. Select Patient</h2>
            <Input
              className="mt-3"
              placeholder="Search by name, phone, or patient code…"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            {patientSearchQuery.isLoading && <LoadingSpinner />}
            {patientSearchQuery.data && patientSearchQuery.data.length === 0 && (
              <EmptyState title="No patients found" />
            )}
            {patientSearchQuery.data && patientSearchQuery.data.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100">
                {patientSearchQuery.data.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className="w-full py-2 text-left text-sm text-slate-700 hover:text-brand-700"
                    >
                      {p.fullName} <span className="text-xs text-slate-400">({p.patientCode})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {patientId && selectedPatientQuery.data && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Patient</h2>
                <p className="text-sm text-slate-600">{selectedPatientQuery.data.fullName}</p>
              </div>
              {isStaff && (
                <Button variant="outline" size="sm" onClick={() => setSelectedPatientId(null)}>
                  Change
                </Button>
              )}
            </div>
          </Card>
        )}

        {patientId && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">2. Select Department</h2>
            {departmentsQuery.isLoading && <LoadingSpinner />}
            <div className="mt-3 flex flex-wrap gap-2">
              {(departmentsQuery.data ?? []).map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    setDepartmentId(dept.id);
                    setDoctorId(null);
                    setSelectedSlot(null);
                  }}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                    departmentId === dept.id
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:border-brand-400'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </Card>
        )}

        {departmentId && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">3. Select Doctor</h2>
            {doctorsQuery.isLoading && <LoadingSpinner />}
            {doctorsQuery.data && doctorsQuery.data.length === 0 && (
              <EmptyState title="No doctors available in this department" />
            )}
            <div className="mt-3 flex flex-col gap-2">
              {(doctorsQuery.data ?? []).map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => {
                    setDoctorId(doctor.id);
                    setSelectedSlot(null);
                  }}
                  className={`rounded-md border px-3 py-2 text-left text-sm ${
                    doctorId === doctor.id
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-slate-300 hover:border-brand-400'
                  }`}
                >
                  <span className="font-medium text-slate-900">{doctor.fullName}</span>
                  <span className="ml-2 text-slate-500">{doctor.specialization}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {doctorId && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">4. Select Date &amp; Time</h2>
            <Input
              type="date"
              className="mt-3 w-auto"
              min={todayDateString()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
            />
            <div className="mt-4">
              {slotsQuery.isLoading && <LoadingSpinner />}
              {slotsQuery.data && slotsQuery.data.length === 0 && (
                <EmptyState title="No availability on this date" description="Try a different date." />
              )}
              {slotsQuery.data && slotsQuery.data.length > 0 && (
                <SlotGrid slots={slotsQuery.data} selected={selectedSlot} onSelect={setSelectedSlot} />
              )}
            </div>
          </Card>
        )}

        {selectedSlot && selectedDoctor && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">5. Confirm Appointment</h2>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-slate-500">Doctor</dt>
              <dd className="text-slate-900">{selectedDoctor.fullName}</dd>
              <dt className="text-slate-500">Date &amp; time</dt>
              <dd className="text-slate-900">
                {date} at {selectedSlot}
              </dd>
            </dl>
            <label htmlFor="reason" className="mt-4 block text-sm font-medium text-slate-700">
              Reason for visit (optional)
            </label>
            <textarea
              id="reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {apiError && <p className="mt-3 text-sm text-red-600">{apiError}</p>}
            <Button
              className="mt-4"
              isLoading={bookMutation.isPending}
              onClick={() => {
                setApiError(null);
                bookMutation.mutate();
              }}
            >
              Confirm Appointment
            </Button>
          </Card>
        )}
      </div>
    </>
  );
}
