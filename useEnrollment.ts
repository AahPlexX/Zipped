// src/hooks/useEnrollment.ts
// This hook manages enrollment data, verifies enrollment status, and checks
// eligibility for course purchases and additional exam attempt vouchers.
// It utilizes TanStack Query for fetching and managing server state related to enrollments.
// Developed by Luccas A E | 2025

'use client'; // This hook may be used in client components

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  Enrollment,
  EnrollmentProgress,
  Course,
  ApiErrorResponse,
  CreateVoucherPurchaseSessionRequestPayload,
  CreateVoucherPurchaseSessionResponse,
  // Assuming an API client is set up, e.g., apiClient
  // For now, using fetch directly for demonstration
} from '@/types'; // Adjust path as per your type definitions
import { useToast } from './useToast'; // Using the toast hook for notifications
import { useBetterAuthSession } from './useBetterAuthSession'; // To get authenticated user info

// --- Constants ---
const ENROLLMENT_QUERY_KEY_PREFIX = 'enrollment';
const USER_ENROLLMENTS_QUERY_KEY = [ENROLLMENT_QUERY_KEY_PREFIX, 'userEnrollments'];

// --- API Interaction Functions ---
// These would typically reside in an API client service (e.g., src/lib/apiClient.ts)

/**
 * Fetches all enrollments for the currently authenticated user.
 * @returns Promise<Enrollment[]>
 */
const fetchUserEnrollments = async (): Promise<Enrollment[]> => {
  const response = await fetch('/api/enrollments/me'); // Example API endpoint
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message || 'Failed to fetch user enrollments');
  }
  const successData = await response.json();
  return successData.data;
};

/**
 * Fetches a specific enrollment by its ID.
 * @param enrollmentId The ID of the enrollment to fetch.
 * @returns Promise<Enrollment & { progress?: EnrollmentProgress }>
 */
const fetchEnrollmentById = async (enrollmentId: string): Promise<Enrollment & { progress?: EnrollmentProgress }> => {
  if (!enrollmentId) throw new Error('Enrollment ID is required.');
  const response = await fetch(`/api/enrollments/${enrollmentId}`); // Example API endpoint
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message || `Failed to fetch enrollment ${enrollmentId}`);
  }
  const successData = await response.json();
  return successData.data;
};

/**
 * Creates a Stripe checkout session for purchasing an additional exam voucher.
 * @param payload - The request payload including enrollmentId.
 * @returns Promise<{ checkoutUrl: string; sessionId: string }>
 */
const purchaseExamVoucher = async (payload: CreateVoucherPurchaseSessionRequestPayload): Promise<{ checkoutUrl: string; sessionId: string }> => {
  const response = await fetch('/api/payments/create-voucher-purchase-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message || 'Failed to create voucher purchase session.');
  }
  const successData: CreateVoucherPurchaseSessionResponse = await response.json();
  return successData.data; // Assuming data contains checkoutUrl and sessionId
};


// --- Hook Definition ---

export interface UseEnrollmentOptions {
  enrollmentId?: string; // Optional: if provided, fetches a specific enrollment
  courseId?: string;     // Optional: to find enrollment for a specific course
  fetchForAllCourses?: boolean; // Optional: to fetch all user enrollments
}

/**
 * Custom hook for managing course enrollment data and actions.
 * @param options - Configuration options for the hook.
 */
export function useEnrollment(options: UseEnrollmentOptions = {}) {
  const { enrollmentId, courseId, fetchForAllCourses } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: session, status: authStatus } = useBetterAuthSession(); // Get user session
  const isAuthenticated = authStatus === 'authenticated' && !!session?.user;

  // Query to fetch all enrollments for the current user
  const {
    data: userEnrollments,
    isLoading: isLoadingUserEnrollments,
    error: userEnrollmentsError,
    refetch: refetchUserEnrollments,
  } = useQuery<Enrollment[], Error>({
    queryKey: USER_ENROLLMENTS_QUERY_KEY,
    queryFn: fetchUserEnrollments,
    enabled: isAuthenticated && (fetchForAllCourses || !!courseId) && !enrollmentId, // Enable if fetching all or finding by courseId
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: useCallback((allEnrollments: Enrollment[] | undefined) => {
      if (!allEnrollments) return [];
      if (courseId) {
        // Filter for a specific course if courseId is provided
        return allEnrollments.filter(en => en.courseId === courseId);
      }
      return allEnrollments;
    }, [courseId]),
  });

  // Query to fetch a specific enrollment by ID
  const {
    data: specificEnrollment,
    isLoading: isLoadingSpecificEnrollment,
    error: specificEnrollmentError,
    refetch: refetchSpecificEnrollment,
  } = useQuery<Enrollment & { progress?: EnrollmentProgress }, Error>({
    queryKey: [ENROLLMENT_QUERY_KEY_PREFIX, enrollmentId],
    queryFn: () => fetchEnrollmentById(enrollmentId!),
    enabled: isAuthenticated && !!enrollmentId, // Only run if enrollmentId is provided and user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for purchasing an exam voucher
  const { mutate: purchaseVoucher, isLoading: isPurchasingVoucher } = useMutation<
    { checkoutUrl: string; sessionId: string }, // Success type
    Error, // Error type
    CreateVoucherPurchaseSessionRequestPayload // Variables type
  >(purchaseExamVoucher, {
    onSuccess: (data) => {
      toast({
        title: 'Redirecting to Checkout',
        description: 'You will be redirected to Stripe to complete your voucher purchase.',
        variant: 'success',
      });
      // Redirect to Stripe checkout URL
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
      queryClient.invalidateQueries(USER_ENROLLMENTS_QUERY_KEY); // Invalidate related queries
      if (enrollmentId) {
        queryClient.invalidateQueries([ENROLLMENT_QUERY_KEY_PREFIX, enrollmentId]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Voucher Purchase Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  // --- Derived Data & Helper Functions ---

  const currentEnrollment = enrollmentId ? specificEnrollment : (courseId && userEnrollments ? userEnrollments[0] : undefined);
  const isLoading = enrollmentId ? isLoadingSpecificEnrollment : isLoadingUserEnrollments;
  const error = enrollmentId ? specificEnrollmentError : userEnrollmentsError;

  /**
   * Checks if the user is enrolled in a specific course.
   * @param courseIdToCheck The ID of the course to check enrollment for.
   * @returns boolean - True if enrolled, false otherwise.
   */
  const isEnrolledInCourse = useCallback((courseIdToCheck: string): boolean => {
    if (!userEnrollments && !specificEnrollment) return false;
    const enrollmentsToCheck = specificEnrollment ? [specificEnrollment] : userEnrollments || [];
    return enrollmentsToCheck.some(en => en.courseId === courseIdToCheck && en.status === 'active');
  }, [userEnrollments, specificEnrollment]);


  /**
   * Determines if the user is eligible to purchase an exam voucher for a given enrollment.
   * This logic depends on NSBS rules (e.g., 2 initial attempts, course progress).
   * This is a simplified example; more detailed logic based on exam attempts from `useExamState` might be needed.
   * @param enrollment The enrollment to check eligibility for.
   * @returns boolean - True if eligible, false otherwise.
   */
  const checkVoucherPurchaseEligibility = useCallback((enrollment?: Enrollment): boolean => {
    if (!enrollment || !enrollment.progress) return false;
    // NSBS: 2 initial attempts allowed
    const maxInitialAttempts = 2;
    const attemptsMade = enrollment.examAttemptsCount || 0; // This needs to come from Enrollment type or related exam state
    const allLessonsCompleted = enrollment.progress.allLessonsCompleted;

    // Eligible if all lessons completed, made at least maxInitialAttempts, and hasn't purchased a voucher yet for this course
    // (or if NSBS rules allow multiple voucher purchases, this logic would change)
    // This requires `examAttemptsCount` on the enrollment object or fetched from exam history.
    return allLessonsCompleted && attemptsMade >= maxInitialAttempts && (enrollment.canPurchaseVoucher ?? true);
    // `canPurchaseVoucher` might be a flag set by the backend based on more complex rules.
  }, []);


  return {
    // Data for a specific enrollment or the first found for a courseId
    enrollment: currentEnrollment,
    isLoadingEnrollment: isLoading,
    enrollmentError: error,
    refetchEnrollment: enrollmentId ? refetchSpecificEnrollment : refetchUserEnrollments,

    // Data for all user enrollments (if `WorkspaceForAllCourses` or `courseId` was true)
    userEnrollments: fetchForAllCourses || courseId ? userEnrollments : undefined,
    isLoadingUserEnrollments: fetchForAllCourses || courseId ? isLoadingUserEnrollments : false,
    userEnrollmentsError: fetchForAllCourses || courseId ? userEnrollmentsError : null,
    refetchUserEnrollments: fetchForAllCourses || courseId ? refetchUserEnrollments : async () => {},

    // Actions
    purchaseExamVoucher,
    isPurchasingVoucher,

    // Helper functions
    isEnrolledInCourse,
    checkVoucherPurchaseEligibility,
  };
}