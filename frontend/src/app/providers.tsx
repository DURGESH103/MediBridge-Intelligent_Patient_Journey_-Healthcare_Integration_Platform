'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/lib/query/QueryProvider';
import { AuthProvider } from '@/lib/auth/AuthContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
