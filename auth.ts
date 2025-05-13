
// src/lib/auth.ts

import { betterAuth } from '@better-auth/core';
import { betterAuthConfig } from '@better-auth/next';
import { PrismaAdapter } from '@better-auth/prisma';
import { 
  GoogleProvider, 
  GithubProvider, 
  FacebookProvider, 
  LinkedInProvider 
} from '@better-auth/providers';
import { MagicLinkProvider } from '@better-auth/magic-link';

import prisma from '@/lib/prisma';
import { syncUserWithDatabase, recordUserSession } from '@/lib/userSync';

/**
 * Better Auth server-side configuration
 * Includes session handling, callbacks, and all authentication providers
 */
export const auth = betterAuth({
  ...betterAuthConfig({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseUrl: process.env.BETTER_AUTH_URL!,
  }),
  
  // Use Prisma adapter for database storage of auth data
  adapter: PrismaAdapter(prisma),
  
  // Configure all authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    MagicLinkProvider({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      server: {
        host: process.env.EMAIL_SERVER_HOST || '',
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER || '',
          pass: process.env.EMAIL_SERVER_PASSWORD || '',
        },
      },
    }),
  ],
  
  // Callback configuration
  callbacks: {
    async session({ session, user, token }) {
      // Include user role and other custom data in session
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { 
            id: true,
            role: true,
            emailVerified: true,
          },
        });
        
        session.user.id = user.id;
        session.user.role = dbUser?.role || 'USER';
        session.user.emailVerified = dbUser?.emailVerified || null;
      }
      return session;
    },
    
    async signIn({ user, account, profile, email, credentials, request }) {
      try {
        // Synchronize user between Better Auth and our database
        await syncUserWithDatabase(user);
        
        // Record user session for analytics (if request object available)
        if (request && user.id) {
          const ip = request.headers?.['x-forwarded-for'] || 
                     request.headers?.['x-real-ip'] || 
                     'unknown';
          const userAgent = request.headers?.['user-agent'] || 'unknown';
          
          await recordUserSession(
            user.id, 
            typeof ip === 'string' ? ip : ip[0],
            userAgent as string
          );
        }
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    
    async redirect({ url, baseUrl }) {
      // Handle redirects (customize if needed)
      // Force absolute URLs to be relative to the base URL
      const urlObj = new URL(url, baseUrl);
      const baseUrlObj = new URL(baseUrl);
      
      if (urlObj.origin === baseUrlObj.origin) {
        // Return path and query parameters for internal URLs
        return urlObj.pathname + urlObj.search;
      }
      
      // Return to home page or dashboard for external URLs
      return '/dashboard';
    },
    
    async jwt({ token, user, account, profile }) {
      // Add custom claims to JWT if needed
      if (user) {
        token.role = user.role || 'USER';
        token.id = user.id;
      }
      return token;
    },
  },
  
  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // Custom auth pages
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/error',
    verifyRequest: '/verify-request',
    newUser: '/onboarding', // New users will be redirected here after first sign in
  },
  
  // Set debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Events for logging and analytics
  events: {
    async signIn(message) {
      console.log("User signed in:", message);
    },
    async signOut(message) {
      console.log("User signed out:", message);
    },
    async createUser(message) {
      console.log("User created:", message);
    },
    async linkAccount(message) {
      console.log("Account linked:", message);
    },
    async session(message) {
      // Session is updated - don't log to prevent spam
    },
  },
});

/**
 * Utility to get the current user's session server-side
 * For use in API routes and server components
 */
export async function getServerSession() {
  try {
    return await auth.getSession();
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/* Developed by Luccas A E | 2025 */
