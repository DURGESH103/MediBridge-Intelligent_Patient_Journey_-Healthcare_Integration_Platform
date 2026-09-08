'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotificationsRealtime } from '@/lib/socket/useNotificationsRealtime';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { NAV_ITEMS_BY_ROLE } from '@/lib/navigation';
import { formatRole } from '@/lib/formatRole';
import { PatientDashboard } from '@/components/dashboards/PatientDashboard';
import { DoctorDashboard } from '@/components/dashboards/DoctorDashboard';
import { ReceptionistDashboard } from '@/components/dashboards/ReceptionistDashboard';
import { LabStaffDashboard } from '@/components/dashboards/LabStaffDashboard';
import { BillingStaffDashboard } from '@/components/dashboards/BillingStaffDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { JourneySection } from '@/components/landing/JourneySection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { RolesSection } from '@/components/landing/RolesSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { Footer } from '@/components/landing/Footer';

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <JourneySection />
      <FeaturesSection />
      <HowItWorksSection />
      <RolesSection />
      <TrustSection />
      <CtaSection />
      <Footer />
    </div>
  );
}

function AuthenticatedDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useNotificationsRealtime();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  const navItems = NAV_ITEMS_BY_ROLE[user.role];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      <div className="flex flex-1">
        <AppSidebar
          navItems={navItems}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Dashboard"
            description={`Welcome back, signed in as ${formatRole(user.role)}`}
          />
          {user.role === 'PATIENT' && <PatientDashboard />}
          {user.role === 'DOCTOR' && <DoctorDashboard />}
          {user.role === 'RECEPTIONIST' && <ReceptionistDashboard />}
          {user.role === 'LAB_STAFF' && <LabStaffDashboard />}
          {user.role === 'BILLING_STAFF' && <BillingStaffDashboard />}
          {user.role === 'ADMIN' && <AdminDashboard />}
        </main>
      </div>
    </div>
  );
}

export default function RootPage() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LandingPage />;
  }

  return <AuthenticatedDashboard />;
}
