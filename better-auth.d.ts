import 'next-auth';
import { UserRole } from '@prisma/client';

declare module '@better-auth/core' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      emailVerified?: Date | null; // Additional field
      lastLoginAt?: Date | null; // Additional field
    };
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    emailVerified?: Date | null; // Additional field
    lastLoginAt?: Date | null; // Additional field
  }
}
