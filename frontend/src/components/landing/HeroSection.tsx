import Link from 'next/link';

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-3xl blur-2xl" />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Mock top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-3 h-5 bg-slate-200 rounded-full text-[10px] text-slate-400 flex items-center px-3">
            medibridge.local
          </div>
        </div>

        <div className="flex">
          {/* Mock sidebar */}
          <div className="hidden sm:flex w-32 flex-col gap-1 p-3 border-r border-slate-100 bg-slate-50/60">
            {['Dashboard', 'Appointments', 'Queue', 'Lab Reports', 'Billing'].map((item, i) => (
              <div
                key={item}
                className={`px-2 py-1.5 rounded-md text-[10px] font-medium ${
                  i === 0 ? 'bg-teal-100 text-teal-700' : 'text-slate-500'
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Mock content */}
          <div className="flex-1 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700">Today&apos;s Overview</p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Appointments', value: '12', color: 'bg-teal-50 text-teal-700' },
                { label: 'Waiting', value: '4', color: 'bg-amber-50 text-amber-700' },
                { label: 'Completed', value: '8', color: 'bg-green-50 text-green-700' },
                { label: 'Lab Reports', value: '3', color: 'bg-blue-50 text-blue-700' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg p-2.5 ${stat.color}`}>
                  <p className="text-[9px] font-medium opacity-70">{stat.label}</p>
                  <p className="text-lg font-bold leading-tight">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Patient journey strip */}
            <div className="rounded-lg border border-slate-100 p-2.5 bg-slate-50">
              <p className="text-[9px] font-semibold text-slate-500 mb-2">Patient Journey</p>
              <div className="flex items-center gap-1">
                {['Registered', 'Checked In', 'Consulting', 'Lab', 'Billing'].map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-1 min-w-0">
                    <div className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                      i < 3 ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {i < 3 ? '✓' : i + 1}
                    </div>
                    <span className={`text-[8px] hidden sm:block truncate ${i < 3 ? 'text-teal-600 font-medium' : 'text-slate-400'}`}>
                      {step}
                    </span>
                    {i < arr.length - 1 && <div className={`flex-shrink-0 h-px w-2 ${i < 2 ? 'bg-teal-300' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent appointments */}
            <div className="space-y-1.5">
              <p className="text-[9px] font-semibold text-slate-500">Recent Appointments</p>
              {[
                { name: 'Priya S.', time: '09:00', status: 'Completed', color: 'text-green-600 bg-green-50' },
                { name: 'Rahul V.', time: '10:15', status: 'In Queue', color: 'text-amber-600 bg-amber-50' },
                { name: 'Anita M.', time: '11:00', status: 'Scheduled', color: 'text-blue-600 bg-blue-50' },
              ].map((appt) => (
                <div key={appt.name} className="flex items-center justify-between rounded-md bg-white border border-slate-100 px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center text-[8px] font-bold text-teal-700">
                      {appt.name[0]}
                    </div>
                    <div>
                      <p className="text-[9px] font-medium text-slate-700">{appt.name}</p>
                      <p className="text-[8px] text-slate-400">{appt.time}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${appt.color}`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/40 pt-16"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-100/50 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-teal-50/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1.5 text-xs font-medium text-teal-700 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              Intelligent Healthcare Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              One Connected{' '}
              <span className="text-teal-600">Platform</span>{' '}
              for Better Healthcare
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Manage patients, appointments, consultations, laboratory reports, billing, and the complete healthcare journey through one intelligent and connected platform.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Get Started
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow transition-all"
              >
                Explore Features
              </button>
            </div>

            {/* Quick stats */}
            <div className="mt-10 flex flex-wrap gap-6 justify-center lg:justify-start">
              {[
                { label: 'Healthcare Roles', value: '6' },
                { label: 'Integrated Modules', value: '8+' },
                { label: 'Real-Time Updates', value: '✓' },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-teal-600">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: dashboard preview */}
          <div className="flex justify-center lg:justify-end">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
