'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyPrescriptions, type PrescriptionWithContext } from '@/lib/api/consultations';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MyPrescriptionsPage() {
  return (
    <RequireRole roles={['PATIENT']}>
      <MyPrescriptionsContent />
    </RequireRole>
  );
}

// Group all prescription rows that share a consultationId into one visit group.
function groupByConsultation(rows: PrescriptionWithContext[]): PrescriptionWithContext[][] {
  const map = new Map<number, PrescriptionWithContext[]>();
  for (const p of rows) {
    const g = map.get(p.consultationId) ?? [];
    g.push(p);
    map.set(p.consultationId, g);
  }
  return Array.from(map.values());
}

// Derive age in years from a YYYY-MM-DD date-of-birth string.
function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const m = today.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Prescription reference ID: RX-<consultationId>-<prescriptionId>
function refId(p: PrescriptionWithContext) {
  return `RX-${String(p.consultationId).padStart(4, '0')}-${String(p.id).padStart(4, '0')}`;
}

// ─── Label / value pair ───────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 mb-3">
      {children}
    </p>
  );
}

// ─── List page ────────────────────────────────────────────────────────────────
function MyPrescriptionsContent() {
  const [selected, setSelected] = useState<PrescriptionWithContext[] | null>(null);

  const query = useQuery({
    queryKey: ['prescriptions', 'me'],
    queryFn: getMyPrescriptions,
  });

  if (query.isLoading) return <LoadingSpinner />;
  if (query.isError) return <ErrorState message={getApiErrorMessage(query.error)} />;

  const groups = groupByConsultation(query.data ?? []);

  return (
    <>
      <PageHeader
        title="My Prescriptions"
        description="Prescriptions issued during your consultations."
      />

      {groups.length === 0 && (
        <EmptyState
          title="No prescriptions yet"
          description="Prescriptions will appear here after your doctor adds them during a consultation."
        />
      )}

      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const first = group[0];
          const age = calcAge(first.patientDateOfBirth);
          return (
            <Card key={first.consultationId}>
              {/* Card header row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{first.doctorName}</p>
                    <span className="text-xs text-slate-400">·</span>
                    <p className="text-xs text-slate-500">{first.doctorSpecialization}</p>
                    <span className="text-xs text-slate-400">·</span>
                    <p className="text-xs text-slate-500">{first.departmentName}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Patient: {first.patientName} · {age} yrs · {capitalize(first.patientGender)} · {first.patientCode}
                  </p>
                  {first.consultationCompletedAt && (
                    <p className="text-xs text-slate-400">
                      Consultation: {formatDate(first.consultationCompletedAt)}
                    </p>
                  )}
                  {first.diagnosis && (
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Diagnosis:</span> {first.diagnosis}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {group.length} medicine{group.length !== 1 ? 's' : ''} · Ref: {refId(first)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setSelected(group)}>
                    View
                  </Button>
                  <Button size="sm" onClick={() => downloadPdf(group)}>
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* Medicine summary list */}
              <ul className="mt-3 divide-y divide-slate-100">
                {group.map((p) => (
                  <li key={p.id} className="py-2">
                    <p className="text-sm font-medium text-slate-900">
                      {p.medicineName}{' '}
                      <span className="font-normal text-slate-500">· {p.dosage}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {[p.frequency, p.duration].filter(Boolean).join(' · ') ||
                        'No frequency or duration specified'}
                    </p>
                    {p.instructions && (
                      <p className="mt-0.5 text-xs text-slate-600">{p.instructions}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {selected && (
        <PrescriptionModal group={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

// ─── View modal ───────────────────────────────────────────────────────────────
function PrescriptionModal({
  group,
  onClose,
}: {
  group: PrescriptionWithContext[];
  onClose: () => void;
}) {
  const first = group[0];
  const age = calcAge(first.patientDateOfBirth);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Prescription Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ref: {refId(first)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Hospital banner */}
          <div className="rounded-lg bg-teal-600 px-5 py-4 text-center">
            <p className="text-base font-bold text-white tracking-wide">MediBridge Healthcare</p>
            <p className="text-xs text-teal-100 mt-0.5">Intelligent Patient Journey Platform</p>
          </div>

          {/* Patient details */}
          <div>
            <SectionHeading>Patient Information</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Full Name" value={first.patientName} />
              <Field label="Patient ID" value={first.patientCode} />
              <Field label="Age" value={`${age} years`} />
              <Field label="Gender" value={capitalize(first.patientGender)} />
              <Field label="Date of Birth" value={formatDate(first.patientDateOfBirth)} />
              <Field label="Contact" value={first.patientPhone} />
              {first.patientEmail && <Field label="Email" value={first.patientEmail} />}
            </div>
          </div>

          {/* Doctor details */}
          <div>
            <SectionHeading>Doctor Information</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Doctor Name" value={first.doctorName} />
              <Field label="Doctor ID" value={`DR-${String(first.doctorId).padStart(4, '0')}`} />
              <Field label="Specialization" value={first.doctorSpecialization} />
              <Field label="Department" value={first.departmentName} />
              {first.doctorQualification && (
                <Field label="Qualification" value={first.doctorQualification} />
              )}
              {first.doctorPhone && <Field label="Contact" value={first.doctorPhone} />}
            </div>
          </div>

          {/* Prescription meta */}
          <div>
            <SectionHeading>Prescription Information</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Prescription ID" value={refId(first)} />
              {first.consultationCompletedAt && (
                <Field label="Consultation Date" value={formatDate(first.consultationCompletedAt)} />
              )}
              <Field label="Prescription Date" value={formatDateTime(first.createdAt)} />
            </div>
          </div>

          {/* Diagnosis & notes */}
          {(first.diagnosis || first.consultationNotes) && (
            <div>
              <SectionHeading>Clinical Details</SectionHeading>
              <div className="space-y-3">
                {first.diagnosis && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Diagnosis</p>
                    <p className="text-sm text-slate-800 rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
                      {first.diagnosis}
                    </p>
                  </div>
                )}
                {first.consultationNotes && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Doctor Notes</p>
                    <p className="text-sm text-slate-700 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 whitespace-pre-wrap">
                      {first.consultationNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medicines */}
          <div>
            <SectionHeading>Prescribed Medicines</SectionHeading>
            <div className="space-y-3">
              {group.map((p, i) => (
                <div key={p.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {i + 1}. {p.medicineName}
                    </p>
                    <span className="text-xs text-slate-400 flex-shrink-0">#{p.id}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
                    <Field label="Dosage" value={p.dosage} />
                    {p.frequency && <Field label="Frequency" value={p.frequency} />}
                    {p.duration && <Field label="Duration" value={p.duration} />}
                  </div>
                  {p.instructions && (
                    <p className="mt-2 text-xs text-slate-600">
                      <span className="font-semibold">Instructions:</span> {p.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={() => downloadPdf(group)}>Download PDF</Button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF (browser print-to-PDF, no external deps) ────────────────────────────
function downloadPdf(group: PrescriptionWithContext[]) {
  const first = group[0];
  const age = calcAge(first.patientDateOfBirth);
  const consultationDate = first.consultationCompletedAt
    ? formatDate(first.consultationCompletedAt)
    : '—';
  const prescriptionDate = formatDateTime(first.createdAt);
  const ref = refId(first);
  const doctorIdFormatted = `DR-${String(first.doctorId).padStart(4, '0')}`;

  const medicinesHtml = group
    .map(
      (p, i) => `
      <tr>
        <td class="med-name">${i + 1}. ${esc(p.medicineName)}</td>
        <td>${esc(p.dosage)}</td>
        <td>${esc(p.frequency ?? '—')}</td>
        <td>${esc(p.duration ?? '—')}</td>
        <td>${esc(p.instructions ?? '—')}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Prescription ${ref}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;font-size:12px;padding:32px}
    /* Header */
    .header{background:#0d9488;color:#fff;border-radius:8px;padding:16px 24px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center}
    .header-left h1{font-size:18px;font-weight:700;letter-spacing:0.02em}
    .header-left p{font-size:11px;opacity:.85;margin-top:2px}
    .header-right{text-align:right;font-size:11px;opacity:.9}
    .header-right strong{display:block;font-size:13px}
    /* Section */
    .section{margin-bottom:20px}
    .section-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:10px}
    /* Grid */
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 20px}
    .field-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:2px}
    .field-value{font-size:12px;color:#0f172a;font-weight:500}
    /* Clinical */
    .box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;font-size:12px;color:#334155;line-height:1.5;margin-top:4px}
    /* Table */
    table{width:100%;border-collapse:collapse;margin-top:6px}
    thead tr{background:#f1f5f9}
    th{padding:7px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #e2e8f0}
    td{padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:11px;vertical-align:top}
    td.med-name{font-weight:600;color:#0f172a}
    tr:last-child td{border-bottom:none}
    /* Footer */
    .footer{margin-top:36px;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8}
    @media print{body{padding:16px}@page{margin:1.5cm}}
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <h1>MediBridge Healthcare</h1>
      <p>Intelligent Patient Journey Platform</p>
    </div>
    <div class="header-right">
      <strong>${esc(ref)}</strong>
      Prescription Reference
    </div>
  </div>

  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="grid">
      <div><div class="field-label">Full Name</div><div class="field-value">${esc(first.patientName)}</div></div>
      <div><div class="field-label">Patient ID</div><div class="field-value">${esc(first.patientCode)}</div></div>
      <div><div class="field-label">Age</div><div class="field-value">${age} years</div></div>
      <div><div class="field-label">Gender</div><div class="field-value">${capitalize(first.patientGender)}</div></div>
      <div><div class="field-label">Date of Birth</div><div class="field-value">${esc(formatDate(first.patientDateOfBirth))}</div></div>
      <div><div class="field-label">Contact</div><div class="field-value">${esc(first.patientPhone)}</div></div>
      ${first.patientEmail ? `<div><div class="field-label">Email</div><div class="field-value">${esc(first.patientEmail)}</div></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Doctor Information</div>
    <div class="grid">
      <div><div class="field-label">Doctor Name</div><div class="field-value">${esc(first.doctorName)}</div></div>
      <div><div class="field-label">Doctor ID</div><div class="field-value">${esc(doctorIdFormatted)}</div></div>
      <div><div class="field-label">Specialization</div><div class="field-value">${esc(first.doctorSpecialization)}</div></div>
      <div><div class="field-label">Department</div><div class="field-value">${esc(first.departmentName)}</div></div>
      ${first.doctorQualification ? `<div><div class="field-label">Qualification</div><div class="field-value">${esc(first.doctorQualification)}</div></div>` : ''}
      ${first.doctorPhone ? `<div><div class="field-label">Contact</div><div class="field-value">${esc(first.doctorPhone)}</div></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Prescription Information</div>
    <div class="grid">
      <div><div class="field-label">Prescription ID</div><div class="field-value">${esc(ref)}</div></div>
      <div><div class="field-label">Consultation Date</div><div class="field-value">${esc(consultationDate)}</div></div>
      <div><div class="field-label">Prescription Date</div><div class="field-value">${esc(prescriptionDate)}</div></div>
    </div>
  </div>

  ${first.diagnosis || first.consultationNotes ? `
  <div class="section">
    <div class="section-title">Clinical Details</div>
    ${first.diagnosis ? `<div class="field-label" style="margin-bottom:4px">Diagnosis</div><div class="box">${esc(first.diagnosis)}</div>` : ''}
    ${first.consultationNotes ? `<div class="field-label" style="margin-top:10px;margin-bottom:4px">Doctor Notes</div><div class="box">${esc(first.consultationNotes)}</div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="section-title">Prescribed Medicines</div>
    <table>
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>${medicinesHtml}</tbody>
    </table>
  </div>

  <div class="footer">
    <span>MediBridge Healthcare Platform &nbsp;·&nbsp; ${esc(ref)}</span>
    <span>Generated: ${esc(prescriptionDate)}</span>
  </div>

</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  // Small delay lets the browser finish rendering before the print dialog opens.
  setTimeout(() => win.print(), 300);
}

// Escape HTML special characters to prevent XSS in the generated document.
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
