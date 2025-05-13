
// src/lib/userSync.ts

import { User } from '@prisma/client';
import prisma from './prisma';
import { BetterAuthUser } from '@better-auth/core';

/**
 * Synchronizes a Better Auth user with our database
 * Creates or updates the user record as needed
 * 
 * @param authUser User data from Better Auth
 * @returns User record from database
 */
export async function syncUserWithDatabase(
  authUser: BetterAuthUser
): Promise<User> {
  if (!authUser.email) {
    throw new Error('User must have an email address');
  }

  // Find or create user record
  const user = await prisma.user.upsert({
    where: { 
      email: authUser.email 
    },
    update: {
      name: authUser.name,
      image: authUser.image,
      emailVerified: authUser.emailVerified ? new Date(authUser.emailVerified) : null,
      lastLoginAt: new Date(),
    },
    create: {
      email: authUser.email,
      name: authUser.name || null,
      image: authUser.image || null,
      emailVerified: authUser.emailVerified ? new Date(authUser.emailVerified) : null,
      role: 'USER', // Default role for new users
      lastLoginAt: new Date(),
    },
    include: {
      profile: true,
    },
  });

  return user;
}

/**
 * Updates a user's role in the database
 * 
 * @param userId User ID to update
 * @param role New role to assign
 * @returns Updated user record
 */
export async function updateUserRole(
  userId: string, 
  role: 'USER' | 'ADMIN'
): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return user;
}

/**
 * Retrieves full user data with profile and enrollments
 * 
 * @param userId User ID to retrieve
 * @returns User with related data
 */
export async function getUserWithRelations(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      enrollments: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              price: true,
            },
          },
        },
      },
      certificates: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      examAttempts: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return user;
}

/**
 * Updates a user's last activity timestamp
 * 
 * @param userId User ID to update
 * @returns Updated user record
 */
export async function updateUserActivity(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { lastActivityAt: new Date() },
  });
}

/**
 * Creates a new user session record for analytics
 * 
 * @param userId User ID for the session
 * @param ipAddress IP address of the user (optional)
 * @param userAgent User agent string (optional)
 * @returns Created session record
 */
export async function recordUserSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  return prisma.session.create({
    data: {
      userId,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });
}

/* Developed by Luccas A E | 2025 */
