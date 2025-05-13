// src/types/enrollment.ts
// Defines types related to user enrollments in courses, progress tracking,
// and certificates. Aligns with Prisma schema and NSBS platform logic.
// Developed by Luccas A E | 2025

import { Identifiable, Timestamped } from './index';
import { Course } from './course'; // For Course information in certificate

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'expired'; // Add more if needed

/**
 * Represents a user's enrollment in a course.
 * Created upon successful payment/purchase.
 */
export interface Enrollment extends Identifiable, Timestamped {
  userId: string;
  courseId: string;
  enrolledAt: Date; // Date of enrollment
  status: EnrollmentStatus;
  completedAt?: Date | null; // Date when all lessons and exam are completed
  currentLessonId?: string | null; // Last viewed lesson ID for resuming
  course?: Pick<Course, 'id' | 'title' | 'courseAcronym' | 'lessonCount'>; // Optional, for context
  examAttemptsCount?: number; // Number of exam attempts made for this enrollment
  canAttemptExam?: boolean; // Determined by lesson completion and attempt limits
  canPurchaseVoucher?: boolean; // If eligible for purchasing an additional exam attempt
}

/**
 * Represents the progress of a user on a single lesson within an enrollment.
 * As seen in Nsbs essentials .txt.
 */
export interface LessonProgress extends Identifiable {
  enrollmentId: string;
  lessonId: string;
  completedAt: Date;
  // Any other specific progress data, e.g., lastAccessedAt
}

/**
 * Represents the overall progress of a user in an enrolled course.
 * As seen in Nsbs essentials .txt.
 */
export interface EnrollmentProgress {
  enrollmentId: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number; // Overall completion percentage (0-100)
  completedLessonIds: string[]; // Array of completed lesson IDs
  allLessonsCompleted: boolean; // True if all lessons in the course are marked complete
  isEligibleForExam: boolean; // Based on allLessonsCompleted and available attempts
}

/**
 * Response type when a lesson is marked as complete.
 * As seen in Nsbs essentials .txt[cite: 49].
 */
export interface LessonProgressUpdateResponse {
  id: string; // ID of the LessonProgress record
  completedAt: Date;
  completedCount: number;
  totalCount: number;
  percentage: number;
  allCompleted: boolean;
}


/**
 * Represents a certificate awarded to a user upon successful course completion.
 * Details based on "Nsbs dos and donts .txt".
 */
export interface Certificate extends Identifiable, Timestamped {
  userId: string;
  courseId: string;
  enrollmentId: string; // The enrollment that led to this certificate
  issuedAt: Date; // Date the certificate was issued
  uniqueCertificateId: string; // A unique, verifiable ID for the certificate
  studentName: string; // Name of the student as it appears on the certificate
  courseName: string; // Name of the course as it appears on the certificate
  downloadUrl?: string; // URL to the PDF certificate (can be generated on demand)
}

/**
 * Data required to generate a PDF certificate.
 */
export interface CertificateGenerationData {
  studentName: string;
  courseName: string;
  issueDate: string; // Formatted date string
  certificateId: string; // Unique ID for display on certificate
  // Potentially other details like course duration (if allowed), instructor (not for NSBS), etc.
  // NSBS logo/template details would be handled by the PDF generator.
}