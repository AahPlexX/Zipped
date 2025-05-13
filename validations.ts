
// src/lib/validations.ts

import * as z from 'zod';

// --- User and Authentication Schemas ---

/**
 * Schema for user profile data validation
 */
export const userProfileSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }).max(100, {
    message: 'Name must not exceed 100 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

/**
 * Schema for user login validation
 */
export const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
});

/**
 * Schema for user registration validation
 */
export const registerSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }).max(100, {
    message: 'Name must not exceed 100 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

/**
 * Schema for magic link email validation
 */
export const magicLinkSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

// --- Course and Content Schemas ---

/**
 * Schema for course creation/editing validation
 */
export const courseSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }).max(100, {
    message: 'Title must not exceed 100 characters.',
  }),
  description: z.string().min(20, {
    message: 'Description must be at least 20 characters.',
  }).max(500, {
    message: 'Description must not exceed 500 characters.',
  }),
  price: z.coerce.number().int().min(0, {
    message: 'Price must be a non-negative integer (in cents).',
  }),
  published: z.boolean().optional(),
});

/**
 * Schema for module creation/editing validation
 */
export const moduleSchema = z.object({
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters.',
  }).max(100, {
    message: 'Title must not exceed 100 characters.',
  }),
  description: z.string().max(200, {
    message: 'Description must not exceed 200 characters.',
  }).optional(),
  order: z.coerce.number().int().min(0),
  courseId: z.string().uuid(),
});

/**
 * Schema for lesson creation/editing validation
 */
export const lessonSchema = z.object({
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters.',
  }).max(100, {
    message: 'Title must not exceed 100 characters.',
  }),
  content: z.string().min(10, {
    message: 'Content must be at least 10 characters.',
  }),
  order: z.coerce.number().int().min(0),
  moduleId: z.string().uuid(),
});

// --- Exam and Question Schemas ---

/**
 * Schema for multiple-choice question validation
 */
export const examQuestionSchema = z.object({
  content: z.string().min(5, {
    message: 'Question must be at least 5 characters.',
  }),
  options: z.array(z.object({
    text: z.string().min(1, { 
      message: 'Option text cannot be empty.' 
    }),
    isCorrect: z.boolean(),
  })).min(4, {
    message: 'Question must have at least 4 options.',
  }).max(4, {
    message: 'Question must have exactly 4 options.',
  }).refine(
    (options) => options.filter(option => option.isCorrect).length === 1,
    {
      message: 'Question must have exactly one correct answer.',
    }
  ),
  courseId: z.string().uuid(),
});

/**
 * Schema for exam attempt validation
 */
export const examAttemptSchema = z.object({
  courseId: z.string().uuid(),
  answers: z.record(z.string(), z.string()),
});

// --- Payment and Enrollment Schemas ---

/**
 * Schema for course purchase validation
 */
export const purchaseCourseSchema = z.object({
  courseId: z.string().uuid(),
});

/**
 * Schema for exam voucher purchase validation
 */
export const purchaseVoucherSchema = z.object({
  enrollmentId: z.string().uuid(),
});

// --- Admin and Operations Schemas ---

/**
 * Schema for analytics date range validation
 */
export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Start date must be in format YYYY-MM-DD',
  }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'End date must be in format YYYY-MM-DD',
  }),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
);

/* Developed by Luccas A E | 2025 */
