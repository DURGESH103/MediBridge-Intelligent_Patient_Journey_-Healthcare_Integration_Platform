import type { ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  bg: string;
}

const FEATURES: Feature[] = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Smart Appointments',
    description: 'Easy doctor scheduling with real-time slot availability, booking, rescheduling, and cancellation management.',
    color: 'text-teal-600',
    bg: 'bg-teal-50 group-hover:bg-teal-100',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Real-Time Queue',
    description: 'Track patient queues live with Redis-backed token sequencing and instant Socket.IO updates for doctors and patients.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 group-hover:bg-blue-100',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'Doctor Consultations',
    description: 'Manage consultations, record diagnoses, issue prescriptions, and request laboratory tests from one interface.',
    color: 'text-violet-600',
    bg: 'bg-violet-50 group-hover:bg-violet-100',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: 'Laboratory Management',
    description: 'Track lab requests through sample collection, processing, and report completion with real-time notifications.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 group-hover:bg-amber-100',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    title: 'Secure Billing',
    description: 'Manage healthcare billing records, track payment status, and maintain a complete financial history per patient.',
    color: 'text-green-600',
    bg: 'bg-green-50 group-hover:bg-green-100',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: 'Patient Journey Tracking',
    description: 'Follow the complete patient journey — computed live from real data, never out of sync — from registration to billing.',
    color: 'text-rose-600',
    bg: 'bg-rose-50 group-hover:bg-rose-100',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-3">Platform Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Everything your healthcare team needs
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            MediBridge brings every part of the clinical workflow into one coordinated system — so nothing falls through the cracks.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color} transition-colors mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
