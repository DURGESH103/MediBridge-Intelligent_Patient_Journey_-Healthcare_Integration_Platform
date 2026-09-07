'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { setAccessToken, setSessionExpiredHandler } from '@/lib/api/client';
import { login as loginRequest, logout as logoutRequest, registerPatient as registerRequest } from '@/lib/api/auth';
import type { LoginPayload, RegisterPatientPayload } from '@/lib/api/auth';
import { getCurrentUser } from '@/lib/api/me';
import type { SafeUser } from '@/types/roles';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: SafeUser | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<SafeUser>;
  registerPatient: (payload: RegisterPatientPayload) => Promise<SafeUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // If a refresh silently fails mid-session (expired/revoked refresh token),
  // the axios interceptor calls this to drop us back to a logged-out state.
  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  // On first load there's no access token in memory yet, only the httpOnly
  // refresh cookie (if any) - try to silently restore the session from it.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await getCurrentUser();
        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setStatus('unauthenticated');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: loggedInUser, accessToken } = await loginRequest(payload);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    setStatus('authenticated');
    return loggedInUser;
  }, []);

  const registerPatient = useCallback(async (payload: RegisterPatientPayload) => {
    const { user: registeredUser, accessToken } = await registerRequest(payload);
    setAccessToken(accessToken);
    setUser(registeredUser);
    setStatus('authenticated');
    return registeredUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, status, login, registerPatient, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
