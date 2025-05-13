// src/types/admin.ts
// Defines types and interfaces specific to the admin panel, including
// data structures for dashboards, user management, and course management.
// Developed by Luccas A E | 2025

import { UserRole } from './better-auth.d'; // Assuming UserRole is defined here
import { CourseBlueprint, Course, Module, Lesson } from './course';
import { Enrollment, Certificate } from './enrollment';
import { Identifiable, Timestamped } from './index';

// --- Admin Dashboard Data Types ---
// Based on descriptions in "Nsbs official file list.txt" [cite: 274]

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  newUsersLast30Days: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number; // In cents
  pendingSupportTickets?: number; // If applicable (NSBS excludes help desk)
  recentActivities?: AdminActivityLog[];
}

export interface AdminActivityLog extends Identifiable, Timestamped {
  actorId: string; // User ID of the admin or system
  action: string; // e.g., 'USER_CREATED', 'COURSE_UPDATED', 'PAYMENT_RECEIVED'
  targetType?: string; // e.g., 'user', 'course'
  targetId?: string;
  details?: Record<string, unknown>;
}

// --- User Management Types ---

export interface UserProfile extends Identifiable, Timestamped {
  email: string;
  name?: string | null;
  role: UserRole;
  emailVerified?: Date | null;
  lastLoginAt?: Date | null;
  accountStatus: 'active' | 'suspended' | 'pending_verification' | 'deactivated';
  enrollments?: Pick<Enrollment, 'id' | 'courseId' | 'enrolledAt' | 'status'>[]; // Summary
  certificates?: Pick<Certificate, 'id' | 'courseId' | 'issuedAt'>[]; // Summary
  // Other admin-visible user details
  totalSpent?: number; // In cents
  notes?: string; // Admin-only notes for a user
}

export interface UserManagementFilters {
  role?: UserRole;
  status?: UserProfile['accountStatus'];
  searchQuery?: string; // For name or email
}

// --- Course Management Types (Admin View) ---

/**
 * Extended Course type for admin editing, might include unpublished data.
 */
export interface AdminCourse extends Course {
  isPublished: boolean;
  // Potentially draft versions of modules/lessons
  // modules: AdminModule[]; // If admin modules have different structure
}

export interface AdminModule extends Module {
  isPublished?: boolean; // If modules can be individually published
  // lessons: AdminLesson[];
}

export interface AdminLesson extends Lesson {
  isPublished?: boolean;
  // Additional metadata for admin, like version history or internal notes
}

// Form data for creating/editing courses, modules, lessons by admin
export type CourseEditFormData = Omit<CourseBlueprint, 'modules'> & {
  id?: string; // For updates
  isPublished?: boolean;
  // If modules are managed separately, this might not include modules directly
};

export type ModuleEditFormData = Omit<ModuleBlueprint, 'lessons'> & {
  id?: string; // For updates
  courseId: string;
  isPublished?: boolean;
};

export type LessonEditFormData = LessonBlueprint & {
  id?: string; // For updates
  moduleId: string;
  courseId: string;
  isPublished?: boolean;
};


// --- Financial / Enrollment Data for Admin ---
export interface AdminEnrollmentRecord extends Enrollment {
  userName?: string;
  userEmail?: string;
  courseTitle?: string;
  paymentId?: string; // From Stripe or payment processor
  amountPaid?: number; // In cents
}

export interface AdminTransactionRecord extends Identifiable, Timestamped {
  userId: string;
  userEmail?: string;
  type: 'course_purchase' | 'voucher_purchase' | 'refund';
  itemId: string; // e.g., courseId or voucherId
  itemName?: string;
  amount: number; // In cents
  currency: string; // e.g., 'usd'
  paymentGateway: 'stripe'; // Or others if used
  transactionId: string; // From payment gateway
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
}