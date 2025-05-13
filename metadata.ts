
// src/lib/metadata.ts

import { Metadata } from 'next';

/**
 * Default metadata for the application
 */
const defaultMetadata = {
  title: 'NSBS Learning Platform',
  description: 'Self-paced business courses with comprehensive certification',
  keywords: ['education', 'learning', 'business', 'courses', 'certification'],
  creator: 'NSBS Learning Platform',
};

/**
 * Creates metadata for the dashboard
 * @returns Metadata object for the dashboard
 */
export function getDashboardMetadata(): Metadata {
  return {
    title: 'Dashboard | NSBS Learning Platform',
    description: 'Access your courses and track your learning progress',
  };
}

/**
 * Creates metadata for a course page
 * @param title Course title
 * @param description Course description
 * @returns Metadata object for the course page
 */
export function getCourseMetadata(title: string, description: string): Metadata {
  return {
    title: `${title} | NSBS Learning Platform`,
    description: description || 'Learn at your own pace with our comprehensive course materials',
  };
}

/**
 * Creates metadata for a lesson page
 * @param courseTitle Course title
 * @param lessonTitle Lesson title
 * @returns Metadata object for the lesson page
 */
export function getLessonMetadata(courseTitle: string, lessonTitle: string): Metadata {
  return {
    title: `${lessonTitle} - ${courseTitle} | NSBS Learning Platform`,
    description: `Learn about ${lessonTitle} in our self-paced course ${courseTitle}`,
  };
}

/**
 * Creates metadata for the exam page
 * @param courseTitle Course title
 * @returns Metadata object for the exam page
 */
export function getExamMetadata(courseTitle: string): Metadata {
  return {
    title: `Final Exam - ${courseTitle} | NSBS Learning Platform`,
    description: `Demonstrate your knowledge with the final assessment for ${courseTitle}`,
  };
}

/**
 * Creates metadata for the certificates page
 * @returns Metadata object for the certificates page
 */
export function getCertificatesMetadata(): Metadata {
  return {
    title: 'Your Certificates | NSBS Learning Platform',
    description: 'View and download your earned course completion certificates',
  };
}

/**
 * Creates metadata for the payment page
 * @param courseTitle Course title
 * @returns Metadata object for the payment page
 */
export function getPaymentMetadata(courseTitle?: string): Metadata {
  if (courseTitle) {
    return {
      title: `Enroll in ${courseTitle} | NSBS Learning Platform`,
      description: `Complete your purchase to gain access to ${courseTitle}`,
    };
  }
  
  return {
    title: 'Course Enrollment | NSBS Learning Platform',
    description: 'Complete your purchase to gain access to your selected course',
  };
}

/**
 * Creates metadata for a profile page
 * @returns Metadata object for the profile page
 */
export function getProfileMetadata(): Metadata {
  return {
    title: 'Your Profile | NSBS Learning Platform',
    description: 'View and update your personal information',
  };
}

/**
 * Creates metadata for the admin dashboard
 * @returns Metadata object for the admin dashboard
 */
export function getAdminMetadata(): Metadata {
  return {
    title: 'Admin Dashboard | NSBS Learning Platform',
    description: 'Manage courses, users, and platform content',
  };
}

/**
 * Creates metadata for a 404 page
 * @returns Metadata object for the 404 page
 */
export function getNotFoundMetadata(): Metadata {
  return {
    title: 'Page Not Found | NSBS Learning Platform',
    description: 'The page you are looking for cannot be found',
  };
}

/**
 * Creates metadata for a specific page, with fallbacks to defaults
 * @param title Page title
 * @param description Page description
 * @returns Metadata object for the page
 */
export function createMetadata(title?: string, description?: string): Metadata {
  return {
    title: title ? `${title} | NSBS Learning Platform` : defaultMetadata.title,
    description: description || defaultMetadata.description,
    keywords: defaultMetadata.keywords,
    creator: defaultMetadata.creator,
    openGraph: {
      type: 'website',
      title: title || defaultMetadata.title,
      description: description || defaultMetadata.description,
      siteName: 'NSBS Learning Platform',
    },
    twitter: {
      card: 'summary_large_image',
      title: title || defaultMetadata.title,
      description: description || defaultMetadata.description,
    },
  };
}

/* Developed by Luccas A E | 2025 */
