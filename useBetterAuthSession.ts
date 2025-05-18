'use client';

import { useEffect, useState } from 'react';
import { Session, User } from '@/types/better-auth.d';

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface BetterAuthClientHookReturn {
  data: Session | null;
  status: AuthStatus;
  update: (data?: Partial<Session | User>) => Promise<Session | null>;
}

const useSessionFromBetterAuthLibrary = (): BetterAuthClientHookReturn => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [data, setData] = useState<Session | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('unauthenticated');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const update = async (updateData?: Partial<Session | User>): Promise<Session | null> => {
    if (status === 'authenticated' && data) {
      const updatedUser = updateData && 'id' in updateData ? { ...data.user, ...updateData } : data.user;
      const updatedSession = updateData && 'expires' in updateData ? { ...data, ...updateData, user: updatedUser } : { ...data, user: updatedUser };
      setData(updatedSession as Session);
      return updatedSession as Session;
    }
    return null;
  };

  return { data, status, update };
};

export interface UseBetterAuthSessionReturn extends BetterAuthClientHookReturn {
  user: User | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: User['role'] | undefined;
}

export function useBetterAuthSession(): UseBetterAuthSessionReturn {
  const { data: session, status, update } = useSessionFromBetterAuthLibrary();

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isLoading = status === 'loading';
  const user = session?.user as User | undefined;
  const userRole = user?.role;

  return {
    data: session,
    status,
    update,
    user,
    isAuthenticated,
    isLoading,
    userRole,
  };
}
