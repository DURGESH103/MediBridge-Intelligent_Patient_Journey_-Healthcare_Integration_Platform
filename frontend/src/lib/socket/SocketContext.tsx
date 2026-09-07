'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth/AuthContext';
import { API_BASE_URL, getAccessToken } from '@/lib/api/client';

const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  // One socket connection per login session, opened only once auth has
  // settled and torn down on logout/unmount - never left dangling or
  // duplicated across re-renders.
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }
    const token = getAccessToken();
    if (!token) return;

    const instance = io(SOCKET_URL, { auth: { token } });
    // This is synchronizing with an external system (opening a connection),
    // not deriving state from props/state - one of the two valid effect
    // patterns per React's own docs, even though the compiler's heuristic
    // flags any setState call inside an effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, [status]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
