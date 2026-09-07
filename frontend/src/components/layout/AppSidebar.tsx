'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { NavItem } from '@/lib/navigation';

interface AppSidebarProps {
  navItems: NavItem[];
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

function NavLinks({ navItems, onNavigate }: { navItems: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ navItems, isMobileOpen, onCloseMobile }: AppSidebarProps) {
  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white px-3 py-6 lg:block">
        <NavLinks navItems={navItems} />
      </aside>

      {/* Mobile: slide-over drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white px-3 py-6 shadow-xl">
            <NavLinks navItems={navItems} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
