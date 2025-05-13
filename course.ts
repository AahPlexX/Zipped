// src/types/course.ts
// Defines the data structures for courses, modules, and lessons.
// These types align with the Prisma schema and are used throughout the application
// for managing and displaying educational content.
// Course content structure must align with "Nsbs dos and donts .txt".
// Developed by Luccas A E | 2025

import { Identifiable, Timestamped } from './index';

/**
 * Represents the structure of a lesson's textual content.
 * Content format constraints as per "Nsbs dos and donts .txt"
 * (e.g., key concept boxes, important notes, practical examples).
 * The string itself would contain HTML or Markdown processed for these elements.
 */
export type LessonContent = string; // HTML string after processing special tags like [KEY CONCEPT]

/**
 * Represents an individual lesson within a module.
 */
export interface Lesson extends Identifiable, Timestamped {
  title: string;
  lessonNumber: number; // Sequential number within the module
  overview?: string; // Brief introduction or summary of the lesson
  content: LessonContent; // The main textual content of the lesson
  keywords?: string[]; // For searchability or tagging
  estimatedReadingTime?: number; // In minutes (optional, as per "MUST EXCLUDE: Time estimates")
                                 // However, reading time is different from completion estimate.
                                 // If this is also excluded, remove it.
  moduleId: string; // Foreign key to Module
  courseId: string; // Foreign key to Course (denormalized for easier queries)

  // Client-side specific, potentially added dynamically
  isCompleted?: boolean; // For tracking user progress on the client
  moduleTitle?: string; // Denormalized for display
}

/**
 * Represents a module, which is a collection of lessons.
 */
export interface Module extends Identifiable, Timestamped {
  title: string;
  moduleNumber: number; // Sequential number within the course
  description?: string; // Optional overview of the module
  lessons: Lesson[]; // Array of lessons in this module, ordered by lessonNumber
  courseId: string; // Foreign key to Course
  lessonCount?: number; // Calculated or stored count of lessons
}

/**
 * Represents an overview of a module, typically without full lesson details.
 * Useful for displaying course structures without fetching all lesson content.
 */
export interface ModuleOverview extends Omit<Module, 'lessons'> {
  lessons: Pick<Lesson, 'id' | 'title' | 'lessonNumber' | 'isCompleted'>[]; // Only essential lesson info
}

/**
 * Represents a course, the highest level in the content hierarchy.
 * Courses consist of multiple modules.
 * Course structure: 54-150 lessons per course.
 */
export interface Course extends Identifiable, Timestamped {
  title: string;
  courseAcronym: string; // e.g., "SPE" for "Strategic Planning and Execution"
  description: string; // Detailed description of the course
  longDescription?: LessonContent; // Potentially a more detailed "about this course" section formatted like a lesson
  price: number; // Price in cents (e.g., 14900 for $149.00)
  imageUrl?: string; // URL for the course's promotional image/thumbnail
  modules: Module[]; // Array of modules in this course, ordered by moduleNumber
  moduleCount: number; // Total number of modules in the course
  lessonCount: number; // Total number of lessons in the course (must be 54-150)
  keywords?: string[]; // For searchability and categorization
  objectives?: string[]; // Learning objectives for the course
  targetAudience?: string; // Description of who the course is for

  // Fields related to user's interaction, potentially added dynamically on client or in specific queries
  isEnrolled?: boolean;
  enrollmentId?: string;
  progressPercentage?: number;
  isCertified?: boolean;
}

// --- Course Blueprint Types for Seeding (prisma/seed.ts) ---

/**
 * Blueprint for a lesson when seeding the database.
 * Content will be raw text/markdown before processing for HTML.
 */
export interface LessonBlueprint extends Omit<Lesson, 'id' | 'moduleId' | 'courseId' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'moduleTitle'> {
  // No 'id', 'createdAt', 'updatedAt' as these are auto-generated
}

/**
 * Blueprint for a module when seeding the database.
 */
export interface ModuleBlueprint extends Omit<Module, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'lessons' | 'lessonCount'> {
  lessons: LessonBlueprint[];
}

/**
 * Blueprint for a course when seeding the database.
 */
export interface CourseBlueprint extends Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules' | 'moduleCount' | 'lessonCount' | 'isEnrolled' | 'enrollmentId' | 'progressPercentage' | 'isCertified'> {
  modules: ModuleBlueprint[];
}

// Example of specific tags for rich text content processing as per Nsbs essentials .txt
export const KeyConceptTagStart = "[KEY CONCEPT]";
export const KeyConceptTagEnd = "[/KEY CONCEPT]";
export const ImportantNoteTagStart = "[IMPORTANT]";
export const ImportantNoteTagEnd = "[/IMPORTANT]";
export const PracticalExampleTagStart = "[EXAMPLE]";
export const PracticalExampleTagEnd = "[/EXAMPLE]";