import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { BetterAuthMiddlewareAdapter } from '@better-auth/next';

// Define path patterns that require authentication
const PROTECTED_PATHS = [
  // Dashboard and account
  '/dashboard',
  '/profile',
  '/settings',
  
  // Course access
  '/courses/:path*/view',
  '/courses/enrolled',
  
  // Exam and certification
  '/certificates',
  
  // Payment and checkout
  '/checkout',
  '/purchase/success',
  
  // Admin area
  '/admin/:path*',
];

// Define admin-only paths
const ADMIN_PATHS = [
  '/admin/:path*',
];

// Define public paths that should redirect logged-in users
const REDIRECT_WHEN_AUTHENTICATED = [
  '/login',
  '/register',
  '/forgot-password',
];

/**
 * Middleware function that runs before each request
 * Handles authentication verification and access control
 */
export async function middleware(request: NextRequest) {
  // Create adapter from the Better Auth middleware
  const auth = BetterAuthMiddlewareAdapter.create(request);
  
  // Get the current path
  const path = request.nextUrl.pathname;
  
  // Check if the user is authenticated
  const isAuthenticated = await auth.isAuthenticated();
  
  // Handle paths that should redirect authenticated users
  if (isAuthenticated && pathMatchesPatterns(path, REDIRECT_WHEN_AUTHENTICATED)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Check if the path requires authentication
  if (pathMatchesPatterns(path, PROTECTED_PATHS)) {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      // Add the current path as a redirect parameter
      loginUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // For admin paths, check if the user has admin role
    if (pathMatchesPatterns(path, ADMIN_PATHS)) {
      const session = await auth.getSession();
      const userRole = session?.user?.role;
      
      // If the user is not an admin, redirect to dashboard
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

/**
 * Helper function to check if a path matches any of the provided patterns
 * 
 * @param path The path to check
 * @param patterns Array of path patterns
 * @returns Boolean indicating if the path matches any pattern
 */
function pathMatchesPatterns(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Replace path parameters with regex
    const regexPattern = pattern
      .replace(/\//g, '\\/') // Escape forward slashes
      .replace(/:\w+(\*)?/g, (_, asterisk) => asterisk ? '.*' : '[^\\/]+'); // Replace :param with regex
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  });
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Auth routes
    '/login',
    '/register',
    '/forgot-password',
    
    // Protected routes
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/courses/:path*',
    '/certificates/:path*',
    '/checkout/:path*',
    '/purchase/:path*',
    '/admin/:path*',
  ],
};

/* Developed by Luccas A E | 2025 */
