
// src/lib/rbac.ts

import { UserRole } from '@prisma/client';
import { Session } from '@better-auth/core';

/**
 * Permission types for role-based access control
 */
export enum Permission {
  // General user permissions
  VIEW_DASHBOARD = 'view_dashboard',
  UPDATE_PROFILE = 'update_profile',
  
  // Course access permissions
  VIEW_COURSE = 'view_course',
  ENROLL_IN_COURSE = 'enroll_in_course',
  COMPLETE_LESSON = 'complete_lesson',
  TAKE_EXAM = 'take_exam',
  VIEW_CERTIFICATE = 'view_certificate',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_COURSES = 'manage_courses',
  MANAGE_MODULES = 'manage_modules',
  MANAGE_LESSONS = 'manage_lessons',
  MANAGE_EXAMS = 'manage_exams',
  VIEW_ANALYTICS = 'view_analytics',
  
  // Super admin permissions
  MANAGE_ADMINS = 'manage_admins',
  SYSTEM_SETTINGS = 'system_settings',
}

/**
 * Map of role to permissions
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  USER: [
    Permission.VIEW_DASHBOARD,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_COURSE,
    Permission.ENROLL_IN_COURSE,
    Permission.COMPLETE_LESSON,
    Permission.TAKE_EXAM,
    Permission.VIEW_CERTIFICATE,
  ],
  ADMIN: [
    Permission.VIEW_DASHBOARD,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_COURSE,
    Permission.ENROLL_IN_COURSE,
    Permission.COMPLETE_LESSON,
    Permission.TAKE_EXAM,
    Permission.VIEW_CERTIFICATE,
    
    Permission.MANAGE_USERS,
    Permission.MANAGE_COURSES,
    Permission.MANAGE_MODULES,
    Permission.MANAGE_LESSONS,
    Permission.MANAGE_EXAMS,
    Permission.VIEW_ANALYTICS,
  ],
  SUPER_ADMIN: [
    Permission.VIEW_DASHBOARD,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_COURSE,
    Permission.ENROLL_IN_COURSE,
    Permission.COMPLETE_LESSON,
    Permission.TAKE_EXAM,
    Permission.VIEW_CERTIFICATE,
    
    Permission.MANAGE_USERS,
    Permission.MANAGE_COURSES,
    Permission.MANAGE_MODULES,
    Permission.MANAGE_LESSONS,
    Permission.MANAGE_EXAMS,
    Permission.VIEW_ANALYTICS,
    
    Permission.MANAGE_ADMINS,
    Permission.SYSTEM_SETTINGS,
  ],
};

/**
 * Checks if a user has a specific permission based on their role
 * 
 * @param userRole The user's role
 * @param permission The permission to check
 * @returns Boolean indicating if user has the permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  if (!rolePermissions[userRole]) {
    return false;
  }
  
  return rolePermissions[userRole].includes(permission);
}

/**
 * Checks if a user has any of the specified permissions
 * 
 * @param userRole The user's role
 * @param permissions Array of permissions to check
 * @returns Boolean indicating if user has any of the permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  if (!rolePermissions[userRole]) {
    return false;
  }
  
  return permissions.some(permission => rolePermissions[userRole].includes(permission));
}

/**
 * Checks if a user has all of the specified permissions
 * 
 * @param userRole The user's role
 * @param permissions Array of permissions to check
 * @returns Boolean indicating if user has all of the permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  if (!rolePermissions[userRole]) {
    return false;
  }
  
  return permissions.every(permission => rolePermissions[userRole].includes(permission));
}

/**
 * Checks if the current user session has a specific permission
 * 
 * @param session The user session
 * @param permission The permission to check
 * @returns Boolean indicating if user has the permission
 */
export function sessionHasPermission(
  session: Session | null,
  permission: Permission
): boolean {
  if (!session?.user?.role) {
    return false;
  }
  
  return hasPermission(session.user.role as UserRole, permission);
}

/**
 * Gets all permissions for a specific role
 * 
 * @param role The user role
 * @returns Array of permissions for the role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return [...rolePermissions[role]];
}

/**
 * Gets friendly display name for a role
 * 
 * @param role The user role
 * @returns User-friendly role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    USER: 'Student',
    ADMIN: 'Administrator',
    SUPER_ADMIN: 'Super Administrator',
  };
  
  return displayNames[role] || role;
}

/* Developed by Luccas A E | 2025 */
