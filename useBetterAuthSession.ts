// src/hooks/useBetterAuthSession.ts
// This hook provides a centralized way to access the Better Auth session data,
// user authentication status, and retrieve session information on the client-side.
// It wraps or utilizes the core session management functionality provided by
// the "Better Auth" library (assumed to be exposed via a client-side utility,
// potentially from 'src/lib/auth-client.ts' or a 'better-auth/react' module).
// Developed by Luccas A E | 2025

'use client'; // This hook is for client-side components

import { useEffect, useState } from 'react';
// Assuming "Better Auth" provides a client-side hook or function to get session.
// This is a common pattern, similar to next-auth/react's useSession.
// Let's define a placeholder for what the actual "Better Auth" client library might export.
// In a real scenario, you would import directly from 'better-auth/react' or '@/lib/auth-client'.

// --- Hypothetical "Better Auth" Client Library Exports ---
// This section simulates the kind of interface a real "Better Auth" client library might provide.
// Replace these with actual imports from your "Better Auth" setup.

import { Session, User } from '@/types/better-auth.d'; // Using our augmented Session and User types

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface BetterAuthClientHookReturn {
  data: Session | null;
  status: AuthStatus;
  update: (data?: Partial<Session | User>) => Promise<Session | null>; // Function to client-update session (e.g., after profile edit)
  // signIn: (providerId?: string, options?: Record<string, any>) => Promise<any>; // Example signIn function
  // signOut: (options?: Record<string, any>) => Promise<any>; // Example signOut function
}

// This is a MOCK implementation of the Better Auth client hook.
// In a real application, this would be provided by the "Better Auth" library itself
// or by your `src/lib/auth-client.ts` which configures and re-exports it.
// For demonstration, we'll create a simplified version.
const useSessionFromBetterAuthLibrary = (): BetterAuthClientHookReturn => {
  // This mock will simulate loading and then an unauthenticated state.
  // A real implementation would subscribe to auth state changes or fetch session.
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [data, setData] = useState<Session | null>(null);

  useEffect(() => {
    // Simulate fetching session
    const timer = setTimeout(() => {
      // In a real app, you'd check for a cookie, call an endpoint, etc.
      // For now, let's assume unauthenticated for this mock.
      // To test authenticated state, you could mock `setData` with a session object.
      // Example:
      // setData({
      //   user: { id: 'mock-user-id', dbId: 'db-mock-id', email: 'test@example.com', role: UserRole.STUDENT, name: 'Test User' },
      //   expires: new Date(Date.now() + 3600 * 1000).toISOString(),
      // });
      // setStatus('authenticated');
      setStatus('unauthenticated'); // Default mock to unauthenticated
    }, 1000); // Simulate 1s loading time

    return () => clearTimeout(timer);
  }, []);

  const update = async (updateData?: Partial<Session | User>): Promise<Session | null> => {
    // Mock session update. A real implementation would call an API or update local state.
    if (status === 'authenticated' && data) {
      const updatedUser = updateData && 'id' in updateData ? { ...data.user, ...updateData } : data.user;
      const updatedSession = updateData && 'expires' in updateData ? { ...data, ...updateData, user: updatedUser } : { ...data, user: updatedUser };
      setData(updatedSession as Session); // Type assertion after merge
      return updatedSession as Session;
    }
    return null;
  };


  return { data, status, update };
};
// --- End of Hypothetical "Better Auth" Client Library Exports ---


export interface UseBetterAuthSessionReturn extends BetterAuthClientHookReturn {
  /** The authenticated user object from the session, if available. */
  user: User | undefined;
  /** A boolean indicating if the user is currently authenticated. */
  isAuthenticated: boolean;
  /** A boolean indicating if the session is currently being loaded. */
  isLoading: boolean;
  /** The role of the authenticated user, if available. */
  userRole: User['role'] | undefined;
}

/**
 * Custom hook to access the Better Auth session and user authentication status.
 * This hook should wrap the primary session hook provided by the Better Auth client library.
 * It provides a consistent interface for accessing session data throughout the NSBS application.
 *
 * @returns {UseBetterAuthSessionReturn} An object containing session data, status, and helper flags.
 */
export function useBetterAuthSession(): UseBetterAuthSessionReturn {
  // Replace `useSessionFromBetterAuthLibrary` with the actual hook from your Better Auth setup.
  // e.g., import { useSession } from 'better-auth/react';
  // const { data: session, status, update } = useSession();
  const { data: session, status, update } = useSessionFromBetterAuthLibrary();

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isLoading = status === 'loading';
  const user = session?.user as User | undefined; // Using our augmented User type
  const userRole = user?.role;

  return {
    data: session,
    status,
    update, // Function to trigger a session update if supported by Better Auth
    user,
    isAuthenticated,
    isLoading,
    userRole,
    // Expose signIn and signOut if they are part of the base hook and needed here
    // signIn: clientAuthLibrary.signIn,
    // signOut: clientAuthLibrary.signOut,
  };
}

// Example Usage in a component:
// const MyComponent = () => {
//   const { data: session, user, isAuthenticated, isLoading, userRole } = useBetterAuthSession();
//
//   if (isLoading) {
//     return <p>Loading session...</p>;
//   }
//
//   if (!isAuthenticated || !user) {
//     return <p>Access Denied. Please log in.</p>;
//   }
//
//   return (
//     <div>
//       <h1>Welcome, {user.name || user.email}!</h1>
//       <p>Your role: {userRole}</p>
//       {/* ... other component logic ... */}
//     </div>
//   );
// };