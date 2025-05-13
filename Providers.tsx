'use client'; // Mark this as a client component as it includes client-side hooks and providers

import * as React from 'react';
// Import the QueryClient and QueryClientProvider for React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import the ThemeProvider for managing the application's theme (light/dark)
import { ThemeProvider } from './ThemeProvider';
// Import the Toaster component to display toast notifications
import { Toaster } from '@/components/ui/toaster';
// Import the SessionProvider for Better Auth session management
import { SessionProvider } from 'next-auth/react'; // Assuming Better Auth integrates with next-auth

// Define the props for the Providers component
export function Providers({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for React Query
  // This instance will be used throughout the application for data fetching and caching
  const queryClient = new QueryClient();

  return (
    // SessionProvider provides the authentication session context
    <SessionProvider>
      {/* ThemeProvider manages the application's theme */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {/* QueryClientProvider provides the React Query client instance */}
        <QueryClientProvider client={queryClient}>
          {/* Render the child components wrapped by the providers */}
          {children}
          {/* The Toaster component renders all active toast notifications */}
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}