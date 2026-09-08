import type { ReactNode } from 'react';

interface Role {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}

const ROLES: Role[] = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Patient',
    description: 'Book appointments, track queue status, view lab reports, follow your healthcare journey, and manage billing.',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Doctor',
    description: 'Manage your appointment queue, conduct consultations, issue prescriptions, and request laboratory tests.',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Receptionist',
    description: 'Register walk-in patients, manage appointments, handle check-ins, and oversee the daily patient queue.',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: 'Laboratory Staff',
    description: 'Process laboratory requests, collect samples, run tests, and complete reports that are delivered in real time.',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    title: 'Billing Staff',
    description: 'Manage patient billing records, track payment status, and maintain a complete financial history per visit.',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-100',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Admin',
    description: 'Manage departments, doctors, and staff accounts. Oversee the entire platform and patient registration.',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
];

export function RolesSection() {
  return (
    <section id="about" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-3">Built for Every Role</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            One platform, six roles
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            MediBridge is purpose-built for every member of the healthcare team, with role-specific dashboards and access controls.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map((role) => (
            <div
              key={role.title}
              className={`rounded-2xl border ${role.border} bg-white p-6 hover:shadow-md transition-shadow duration-200`}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${role.bg} ${role.color} mb-4`}>
                {role.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{role.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
