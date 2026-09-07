'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAppointments } from '@/lib/api/appointments';
import { searchPatients } from '@/lib/api/patients';
import { checkIn } from '@/lib/api/queue';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatTime, todayDateString } from '@/lib/formatDate';
import { appointmentStatusStyle } from '@/lib/statusStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Patient } from '@/types/domain';

const CHECK_IN_ELIGIBLE = new Set(['SCHEDULED', 'CONFIRMED']);

export default function CheckInPage() {
  return (
    <RequireRole roles={['RECEPTIONIST']}>
      <CheckInPageContent />
    </RequireRole>
  );
}

function CheckInPageContent() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [checkedInToken, setCheckedInToken] = useState<{ appointmentId: number; tokenNumber: number } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeout = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const searchQuery = useQuery({
    queryKey: ['patients', 'search', searchTerm],
    queryFn: () => searchPatients(searchTerm),
    enabled: !selectedPatient && searchTerm.length > 0,
  });

  const today = todayDateString();
  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'checkIn', selectedPatient?.id, today],
    queryFn: () => listAppointments({ patientId: selectedPatient!.id, fromDate: today, toDate: today }),
    enabled: Boolean(selectedPatient),
  });

  const checkInMutation = useMutation({
    mutationFn: (appointmentId: number) => checkIn(appointmentId),
    onSuccess: (entry) => {
      setCheckedInToken({ appointmentId: entry.appointmentId, tokenNumber: entry.tokenNumber });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'checkIn'] });
    },
  });

  function reset() {
    setSelectedPatient(null);
    setSearchInput('');
    setCheckedInToken(null);
    checkInMutation.reset();
  }

  return (
    <>
      <PageHeader title="Check-In" description="Check in a patient who has arrived for their appointment." />

      {!selectedPatient && (
        <Card>
          <Input
            aria-label="Search for a patient"
            placeholder="Search by name, phone, or patient code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <div className="mt-4">
            {searchTerm.length === 0 && <EmptyState title="Search for a patient to check in" />}
            {searchQuery.isLoading && <LoadingSpinner />}
            {searchQuery.isError && <ErrorState message={getApiErrorMessage(searchQuery.error)} />}
            {searchQuery.data && searchQuery.data.length === 0 && <EmptyState title="No patients found" />}
            {searchQuery.data && searchQuery.data.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {searchQuery.data.map((patient) => (
                  <li key={patient.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(patient)}
                      className="flex w-full items-center justify-between py-3 text-left hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{patient.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {patient.patientCode} · {patient.phone}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {selectedPatient && (
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{selectedPatient.fullName}</h2>
                <p className="text-xs text-slate-500">{selectedPatient.patientCode}</p>
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                Search Another Patient
              </Button>
            </div>
          </Card>

          {checkedInToken && (
            <Card className="border-emerald-200 bg-emerald-50 text-center">
              <p className="text-sm font-medium text-emerald-800">Checked in successfully</p>
              <p className="mt-1 text-3xl font-bold text-emerald-900">Token #{checkedInToken.tokenNumber}</p>
            </Card>
          )}

          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Appointments</h2>
            {appointmentsQuery.isLoading && <LoadingSpinner />}
            {appointmentsQuery.isError && <ErrorState message={getApiErrorMessage(appointmentsQuery.error)} />}
            {appointmentsQuery.data && appointmentsQuery.data.length === 0 && (
              <EmptyState title="No appointments today" description="This patient has no appointments scheduled for today." />
            )}
            {appointmentsQuery.data && appointmentsQuery.data.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100">
                {appointmentsQuery.data.map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{formatTime(appt.scheduledAt)}</p>
                      {appt.reason && <p className="text-xs text-slate-500">{appt.reason}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge {...appointmentStatusStyle(appt.status)} />
                      {CHECK_IN_ELIGIBLE.has(appt.status) && checkedInToken?.appointmentId !== appt.id && (
                        <Button
                          size="sm"
                          isLoading={checkInMutation.isPending && checkInMutation.variables === appt.id}
                          onClick={() => checkInMutation.mutate(appt.id)}
                        >
                          Check In
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {checkInMutation.isError && (
              <p className="mt-3 text-sm text-red-600">{getApiErrorMessage(checkInMutation.error)}</p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
