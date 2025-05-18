'use client';

import { useCallback } from 'react';
import { useBetterAuthSession } from './useBetterAuthSession';
import { UserRole, User } from '@/types/better-auth.d';

export interface UseRBACReturn {
  user: User | undefined;
  userRole: UserRole | undefined;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isStudent: boolean;
}

export function useRBAC(): UseRBACReturn {
  const { user, isLoading, userRole: roleFromSession } = useBetterAuthSession();

  const userRole = roleFromSession;

  const hasRole = useCallback(
    (roleToCheck: UserRole): boolean => {
      return !!userRole && userRole === roleToCheck;
    },
    [userRole]
  );

  const hasAnyRole = useCallback(
    (rolesToCheck: UserRole[]): boolean => {
      return !!userRole && rolesToCheck.includes(userRole);
    },
    [userRole]
  );

  const hasPermission = useCallback(
    (permissionToCheck: string): boolean => {
      if (!userRole) return false;

      switch (userRole) {
        case UserRole.ADMIN:
          if (permissionToCheck.startsWith('admin:')) return true;
          if (permissionToCheck === 'course:viewAny' || permissionToCheck === 'user:list') return true;
          return true;

        case UserRole.STUDENT:
          if (permissionToCheck.startsWith('student:')) return true;
          if (permissionToCheck === 'course:viewEnrolled' || permissionToCheck === 'lesson:access') return true;
          return false;

        default:
          return false;
      }
    },
    [userRole]
  );

  const isAdmin = hasRole(UserRole.ADMIN);
  const isStudent = hasRole(UserRole.STUDENT);

  return {
    user,
    userRole,
    isLoading,
    hasRole,
    hasAnyRole,
    hasPermission,
    isAdmin,
    isStudent,
  };
}
