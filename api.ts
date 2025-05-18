import { ZodIssue } from 'zod'; // For detailed validation errors, as seen in Nsbs essentials
import { Course, Lesson, ModuleOverview } from './course';
import { EnrollmentProgress, LessonProgressUpdateResponse } from './enrollment';
import { ExamQuestion, ExamSubmissionRequest, ExamResult } from './exam';
import { UserProfile } from './admin'; // Assuming UserProfile might be fetched/updated via API

// --- Generic API Response Structures ---

/**
 * Generic structure for a successful API response.
 * @template TData The type of the data payload.
 */
export interface ApiSuccessResponse<TData = unknown> {
  success: true;
  message?: string; // Optional success message
  data: TData;
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Generic structure for a failed API response.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string; // User-friendly error message
    code?: string;    // Optional error code (e.g., 'AUTH_REQUIRED', 'VALIDATION_ERROR')
    details?: Record<string, unknown> | ZodIssue[]; // Additional error details or Zod validation issues
  };
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Union type for any API response.
 * @template TData The type of the data payload for success responses.
 */
export type ApiResponse<TData = unknown> = ApiSuccessResponse<TData> | ApiErrorResponse;

// --- Endpoint-Specific Payload Types ---

// Better Auth related types (Placeholder, actual types depend on Better Auth library)
export interface LoginRequestPayload {
  email: string;
  password?: string; // Password may be optional for magic links
  provider?: 'credentials' | 'google' | 'github' | 'facebook' | 'linkedin'; // Example providers
}
export interface RegisterRequestPayload {
  email: string;
  password?: string; // Required for credentials registration
  name?: string; // Optional name field
}
export interface PasswordResetRequestPayload {
  email: string;
}
export interface PasswordResetConfirmPayload {
  token: string;
  newPassword?: string;
}
export interface MagicLinkRequestPayload {
  email: string;
}

// User Profile API
export type GetUserProfileResponse = ApiSuccessResponse<UserProfile>;
export type UpdateUserProfileRequest = Partial<UserProfile>; // Allow partial updates
export type UpdateUserProfileResponse = ApiSuccessResponse<UserProfile>;


// Course and Lesson API Payloads (referencing Nsbs essentials .txt)
export type GetCoursesResponse = ApiSuccessResponse<Course[]>; // For course catalog
export type GetCourseDetailsResponse = ApiSuccessResponse<Course & { modules: ModuleOverview[] }>; // Single course with module structure
export type GetLessonContentResponse = ApiSuccessResponse<Lesson & {
  moduleTitle: string;
  moduleNumber: number;
  courseId: string;
  courseTitle: string;
  courseAcronym: string;
  enrollmentId: string;
  isCompleted: boolean;
  completedAt: Date | null;
}>;

// Progress API Payloads (referencing Nsbs essentials .txt)
export interface MarkLessonCompleteRequestPayload {
  lessonId: string;
  enrollmentId: string;
}
export type MarkLessonCompleteResponse = ApiSuccessResponse<LessonProgressUpdateResponse>;

export type GetEnrollmentProgressResponse = ApiSuccessResponse<EnrollmentProgress>;

// Payment API Payloads (referencing Nsbs official file list.txt)
export interface CreateCheckoutSessionRequestPayload {
  courseId: string;
  redirectUrlBase?: string; // For success/cancel URLs
}
export interface CreateCheckoutSessionResponsePayload {
  sessionId: string;
  checkoutUrl: string; // Stripe checkout URL
}
export type StripeWebhookEventPayload = Record<string, unknown>; // Actual type from Stripe library, e.g., Stripe.Event

export interface CreateVoucherPurchaseSessionRequestPayload {
  enrollmentId: string; // To verify eligibility and associate voucher
  redirectUrlBase?: string;
}
export type CreateVoucherPurchaseSessionResponse = ApiSuccessResponse<CreateCheckoutSessionResponsePayload>;


// Exam API Payloads (referencing Nsbs official file list.txt)
export type StartExamResponse = ApiSuccessResponse<{
  attemptId: string;
  questions: ExamQuestion[]; // Questions without correct answers
}>;
export type SubmitExamResponse = ApiSuccessResponse<ExamResult & { attemptId: string }>;


// Certificate API Payloads (referencing Nsbs official file list.txt)
export type GenerateCertificateResponse = ApiSuccessResponse<{
  certificateUrl: string; // URL to the generated PDF certificate
  certificateId: string;
}>; // Could also be a direct PDF stream

// Analytics API Payloads (Placeholder types, to be detailed further)
export interface UserActivityAnalyticsResponsePayload {
  dailyActiveUsers: number[];
  weeklyActiveUsers: number[];
  monthlyActiveUsers: number[];
  // ... other relevant metrics
}
export interface ExamStatsAnalyticsResponsePayload {
  averageScore: number;
  passRate: number;
  // ... course specific breakdowns
}
export interface RevenueAnalyticsResponsePayload {
  totalRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  // ... course specific revenue
}

// Standard pagination query parameters
export interface PaginationQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: string; // Generic filter string
}
