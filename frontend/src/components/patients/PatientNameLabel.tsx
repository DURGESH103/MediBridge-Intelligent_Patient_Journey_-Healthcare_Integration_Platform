'use client';

import { useQuery } from '@tanstack/react-query';
import { getPatientById } from '@/lib/api/patients';

export function PatientNameLabel({ patientId }: { patientId: number }) {
  const patientQuery = useQuery({ queryKey: ['patients', patientId], queryFn: () => getPatientById(patientId) });
  return <>{patientQuery.data?.fullName ?? `Patient #${patientId}`}</>;
}
