const STEPS = [
  {
    number: '01',
    title: 'Register or Sign In',
    description: 'Patients create an account or sign in. Staff accounts are managed by administrators.',
    color: 'bg-teal-600',
    light: 'bg-teal-50 border-teal-200',
    text: 'text-teal-700',
  },
  {
    number: '02',
    title: 'Book an Appointment',
    description: 'Choose a doctor, view available slots, and book a confirmed appointment.',
    color: 'bg-blue-600',
    light: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
  },
  {
    number: '03',
    title: 'Check In & Join the Queue',
    description: 'On arrival, check in to receive a queue token and track your position in real time.',
    color: 'bg-violet-600',
    light: 'bg-violet-50 border-violet-200',
    text: 'text-violet-700',
  },
  {
    number: '04',
    title: 'Consult with the Doctor',
    description: 'The doctor records the diagnosis, issues prescriptions, and requests any lab tests needed.',
    color: 'bg-amber-600',
    light: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
  },
  {
    number: '05',
    title: 'Complete Laboratory Tests',
    description: 'If required, lab staff process the sample and complete the report. You are notified when it is ready.',
    color: 'bg-rose-600',
    light: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
  },
  {
    number: '06',
    title: 'Track Reports & Complete Billing',
    description: 'Review lab reports, settle the billing record, and your visit journey is marked complete.',
    color: 'bg-green-600',
    light: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            From registration to completion
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            MediBridge guides every patient through a clear, connected journey — and keeps every team member informed at each step.
          </p>
        </div>

        {/* Desktop: two-column alternating */}
        <div className="hidden lg:block relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />

          <div className="space-y-12">
            {STEPS.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={step.number} className={`flex items-center gap-8 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`flex-1 ${isLeft ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block rounded-2xl border p-5 ${step.light} max-w-sm ${isLeft ? 'ml-auto' : 'mr-auto'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest ${step.text} mb-1`}>Step {step.number}</p>
                      <h3 className="text-base font-semibold text-slate-900 mb-1.5">{step.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${step.color} text-white text-xs font-bold shadow-md`}>
                    {i + 1}
                  </div>

                  <div className="flex-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical list */}
        <div className="lg:hidden relative pl-8">
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" />
          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                <div className={`absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full ${step.color} text-white text-xs font-bold shadow-sm`}>
                  {i + 1}
                </div>
                <div className={`rounded-xl border p-4 ${step.light}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest ${step.text} mb-1`}>Step {step.number}</p>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
