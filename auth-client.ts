import { BetterAuthClient, BetterAuthProvider, useBetterAuth } from '@better-auth/react';
import { MagicLinkPlugin } from '@better-auth/magic-link';
import { SocialAuthPlugin } from '@better-auth/social';

/**
 * Better Auth client configuration with provider plugins
 */
const authClient = new BetterAuthClient({
  basePath: '/api/auth',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    new MagicLinkPlugin({
      loginPath: '/login',
      redirectAfterLogin: '/dashboard',
    }),
    new SocialAuthPlugin({
      providers: ['google', 'github', 'facebook', 'linkedin'],
      redirectAfterLogin: '/dashboard',
    }),
  ],
  onSessionExpired: () => {
    // Redirect to login page when session expires
    window.location.href = '/login?expired=true';
  },
  onError: (error) => {
    console.error('Better Auth Client Error:', error);
    // Optionally, display a user-friendly error message or toast notification
  },
});

/**
 * Provides Better Auth client to React components
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <BetterAuthProvider client={authClient}>
      {children}
    </BetterAuthProvider>
  );
}

/**
 * Custom hook for authentication state access and actions
 * @returns Authentication state and methods for components
 */
export function useAuthentication() {
  const auth = useBetterAuth();
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    signIn: auth.signIn,
    signOut: auth.signOut,
    sendMagicLink: auth.sendMagicLink,
    refreshSession: auth.refreshSession,
    role: auth.user?.role || 'USER',
  };
}

/**
 * Utility to get client-side authentication status
 * @returns Boolean indicating if user is authenticated
 */
export function getIsAuthenticated() {
  const authState = authClient.getState();
  return authState.isAuthenticated;
}

/**
 * Triggers sign in flow with specified provider
 * @param provider Authentication provider to use
 */
export async function signInWithProvider(provider: 'google' | 'github' | 'facebook' | 'linkedin') {
  await authClient.signIn({ provider });
}

/**
 * Sends a magic link to specified email address
 * @param email User's email address
 * @returns Promise resolving when email is sent
 */
export async function sendMagicLink(email: string) {
  return authClient.sendMagicLink({ email });
}

export default authClient;
