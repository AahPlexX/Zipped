// src/hooks/useRBAC.ts
// This hook provides Role-Based Access Control (RBAC) functionalities.
// It uses the current user's session data (specifically their role) to determine
// if they have the necessary permissions for certain actions or UI elements.
// Developed by Luccas A E | 2025

'use client'; // This hook is for client-side components

import { useCallback } from 'react';
import { useBetterAuthSession } from './useBetterAuthSession';
import { UserRole, User } from '@/types/better-auth.d'; // Import UserRole enum and User type

// --- Define Permission Structure (Optional, for more granular control) ---
// For NSBS, roles (STUDENT, ADMIN) are primary. If more granular permissions
// were needed, they could be defined here and potentially associated with roles.
// Example:
// export enum Permission {
//   VIEW_ADMIN_DASHBOARD = 'admin:dashboard:view',
//   MANAGE_USERS = 'admin:users:manage',
//   EDIT_COURSES = 'admin:courses:edit',
//   ENROLL_IN_COURSE = 'student:course:enroll',
//   ACCESS_LESSON = 'student:lesson:view',
// }

// // Mapping roles to permissions (this logic would typically be on the backend or a central config)
// const rolePermissions: Record<UserRole, Permission[]> = {
//   [UserRole.ADMIN]: [
//     Permission.VIEW_ADMIN_DASHBOARD,
//     Permission.MANAGE_USERS,
//     Permission.EDIT_COURSES,
//   ],
//   [UserRole.STUDENT]: [
//     Permission.ENROLL_IN_COURSE,
//     Permission.ACCESS_LESSON,
//   ],
// };

export interface UseRBACReturn {
  /** The current authenticated user object. */
  user: User | undefined;
  /** The role of the current authenticated user. */
  userRole: UserRole | undefined;
  /** A boolean indicating if the user session is currently loading. */
  isLoading: boolean;
  /**
   * Checks if the current user has a specific role.
   * @param role The role to check against.
   * @returns True if the user has the specified role, false otherwise.
   */
  hasRole: (role: UserRole) => boolean;
  /**
   * Checks if the current user has any of the specified roles.
   * @param roles An array of roles to check against.
   * @returns True if the user has at least one of the specified roles, false otherwise.
   */
  hasAnyRole: (roles: UserRole[]) => boolean;
  /**
   * Checks if the current user has a specific permission.
   * (Placeholder for a more granular permission system if implemented)
   * @param _permission The permission string to check.
   * @returns True if the user has the permission, false otherwise. For now, maps to role checks.
   */
  hasPermission: (permission: string /* Permission enum if defined */) => boolean;
  /**
   * A boolean indicating if the current user is an Administrator.
   */
  isAdmin: boolean;
  /**
   * A boolean indicating if the current user is a Student.
   */
  isStudent: boolean;
}

/**
 * Custom hook for Role-Based Access Control (RBAC).
 * Provides utility functions to check user roles and permissions.
 *
 * @returns {UseRBACReturn} An object with RBAC utility functions and user role information.
 */
export function useRBAC(): UseRBACReturn {
  const { user, isLoading, userRole: roleFromSession } = useBetterAuthSession();

  const userRole = roleFromSession; // Already extracted from useBetterAuthSession

  /**
   * Checks if the current authenticated user has the specified role.
   */
  const hasRole = useCallback(
    (roleToCheck: UserRole): boolean => {
      return !!userRole && userRole === roleToCheck;
    },
    [userRole]
  );

  /**
   * Checks if the current authenticated user has any of the roles in the provided array.
   */
  const hasAnyRole = useCallback(
    (rolesToCheck: UserRole[]): boolean => {
      return !!userRole && rolesToCheck.includes(userRole);
    },
    [userRole]
  );

  /**
   * Placeholder for a more granular permission check.
   * For NSBS, permissions can be directly inferred from roles initially.
   * This function can be expanded if a more detailed permission system is added.
   */
  const hasPermission = useCallback(
    (permissionToCheck: string /* Permission */): boolean => {
      if (!userRole) return false;

      // Simple mapping of permissions to roles for NSBS (as an example)
      // A more robust system might involve fetching permissions or having a detailed mapping.
      switch (userRole) {
        case UserRole.ADMIN:
          // Admin has all permissions or specific admin permissions
          if (permissionToCheck.startsWith('admin:')) return true;
          if (permissionToCheck === 'course:viewAny' || permissionToCheck === 'user:list') return true; // Example permissions
          return true; // Or, more simply, admins have broad access.

        case UserRole.STUDENT:
          if (permissionToCheck.startsWith('student:')) return true;
          if (permissionToCheck === 'course:viewEnrolled' || permissionToCheck === 'lesson:access') return true;
          return false; // Students have limited permissions.

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

// Example Usage in a component:
// const SomeAdminFeature = () => {
//   const { isAdmin, isLoading, hasPermission } = useRBAC();
//
//   if (isLoading) return <p>Checking permissions...</p>;
//
//   // Using role check
//   if (!isAdmin) {
//     return <p>You do not have permission to view this admin feature.</p>;
//   }
//
//   // Using granular permission check (if implemented)
//   // if (!hasPermission(Permission.VIEW_ADMIN_DASHBOARD)) {
//   //   return <p>Insufficient permissions for admin dashboard.</p>;
//   // }
//
//   return <div>Admin Content Here</div>;
// };

// const SomeStudentFeature = () => {
//   const { isStudent, isLoading } = useRBAC();
//
//   if (isLoading) return <p>Loading...</p>;
//
//   if (!isStudent) return null; // Or redirect, or show message
//
//   return <div>Student Specific Content</div>;
// };