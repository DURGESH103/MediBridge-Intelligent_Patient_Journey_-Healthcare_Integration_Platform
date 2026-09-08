'use client';

import Link from 'next/link';

function smoothScroll(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white text-sm font-bold">
              M
            </div>
            <span className="text-base font-semibold text-slate-900">MediBridge</span>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { label: 'Home', id: 'home' },
              { label: 'Features', id: 'features' },
              { label: 'How It Works', id: 'how-it-works' },
              { label: 'About', id: 'about' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => smoothScroll(link.id)}
                className="text-sm text-slate-500 hover:text-teal-700 transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link href="/login" className="text-sm text-slate-500 hover:text-teal-700 transition-colors">
              Sign In
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} MediBridge. Intelligent Patient Journey &amp; Healthcare Integration Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
