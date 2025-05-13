// src/types/analytics.ts
// Defines types for analytics data structures, chart configurations, and report formats.
// These types support the visualization and reporting of platform metrics.
// Based on "Nsbs official file list.txt"
// Developed by Luccas A E | 2025

import { Identifiable, Timestamped } from './index';

// --- General Analytics Structures ---

/**
 * Represents a single data point in a time series chart.
 */
export interface TimeSeriesDataPoint {
  date: string; // ISO date string (e.g., "2025-05-13") or timestamp
  value: number;
  category?: string; // Optional category for stacked/grouped charts
}

/**
 * Configuration for a chart component.
 * This is generic; specific charting libraries might have their own detailed types.
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter';
  data: {
    labels: string[]; // X-axis labels or pie chart segment labels
    datasets: ChartDataset[];
  };
  options?: Record<string, unknown>; // Options specific to the charting library
}

export interface ChartDataset {
  label: string; // Legend label for the dataset
  data: number[] | TimeSeriesDataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  // Other dataset-specific properties (e.g., fill, tension for line charts)
}

export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

export interface AnalyticsQueryParameters {
  startDate?: string; // ISO Date
  endDate?: string;   // ISO Date
  datePreset?: DateRangePreset;
  granularity?: 'daily' | 'weekly' | 'monthly';
  courseId?: string; // Filter by specific course
  // Add other relevant filters
}

// --- User Activity Analytics ---
// As per `src/app/api/analytics/user-activity/route.ts`

export interface UserActivityReport extends Timestamped { // Report generation time
  queryParameters: AnalyticsQueryParameters;
  dau: TimeSeriesDataPoint[]; // Daily Active Users
  wau: TimeSeriesDataPoint[]; // Weekly Active Users
  mau: TimeSeriesDataPoint[]; // Monthly Active Users
  newUserSignups: TimeSeriesDataPoint[];
  averageSessionDuration?: TimeSeriesDataPoint[]; // In minutes/seconds
  topEngagingCourses?: { courseId: string; courseTitle: string; engagementScore: number }[];
}

// --- Exam Statistics Analytics ---
// As per `src/app/api/analytics/exam-stats/route.ts`

export interface ExamPerformanceMetrics {
  courseId: string;
  courseTitle: string;
  totalAttempts: number;
  passRate: number; // Percentage (0-100)
  averageScore: number; // Percentage (0-100)
  averageAttemptsPerUser?: number;
  questionDifficulty?: { questionId: string, attempts: number, correctRate: number }[];
}

export interface ExamStatsReport extends Timestamped {
  queryParameters: AnalyticsQueryParameters;
  overallPassRate: number;
  overallAverageScore: number;
  coursePerformance: ExamPerformanceMetrics[];
  commonFailurePoints?: { questionId: string; failCount: number }[];
}

// --- Revenue Analytics ---
// As per `src/app/api/analytics/revenue/route.ts`

export interface RevenueDataPoint extends TimeSeriesDataPoint {
  // value represents revenue in cents
}

export interface RevenueReport extends Timestamped {
  queryParameters: AnalyticsQueryParameters;
  totalRevenue: number; // In cents
  revenueOverTime: RevenueDataPoint[];
  revenueByCourse?: { courseId: string; courseTitle: string; revenue: number }[];
  newCustomers?: TimeSeriesDataPoint[];
  averageRevenuePerUser?: number;
  voucherSalesRevenue?: number; // Specific to exam voucher purchases
}

// --- Course Progress Analytics ---

export interface CourseCompletionStats {
  courseId: string;
  courseTitle: string;
  totalEnrolled: number;
  totalCompleted: number;
  completionRate: number; // Percentage (0-100)
  averageCompletionTime?: number; // In days/hours (if tracked, NSBS is self-paced)
  lessonDropOffRates?: { lessonId: string; lessonTitle: string; dropOffCount: number }[];
}

export interface ProgressAnalyticsReport extends Timestamped {
  queryParameters: AnalyticsQueryParameters;
  overallCompletionRate: number;
  courseCompletionStats: CourseCompletionStats[];
}
// src/types/analytics.ts

/**
 * Enum for different types of analytics metrics that can be queried.
 */
export enum AnalyticsMetric {
  USER_ACTIVITY = 'userActivity',
  ENROLLMENT = 'enrollment',
  EXAM_STATS = 'examStats',
  REVENUE = 'revenue',
  LESSON_COMPLETION = 'lessonCompletion',
  CERTIFICATE_ISSUANCE = 'certificateIssuance',
}

/**
 * Base interface for analytics query filters.
 * These are common parameters that can be used to filter analytics data.
 */
export interface AnalyticsQueryFilters {
  /**
   * Start date for the analytics time range.
   */
  startDate?: string;
  
  /**
   * End date for the analytics time range.
   */
  endDate?: string;
  
  /**
   * Optional course ID to filter analytics data for a specific course.
   */
  courseId?: string;
  
  /**
   * Optional user ID to filter analytics data for a specific user.
   */
  userId?: string;
  
  /**
   * Optional grouping parameter (e.g., 'day', 'week', 'month').
   */
  groupBy?: 'day' | 'week' | 'month' | 'year';
  
  /**
   * Additional custom filters specific to the query.
   */
  [key: string]: any;
}

/**
 * Generic interface for analytics data.
 * Each specific metric type will extend this with its own data structure.
 * 
 * @template T - The specific analytics metric type
 */
export interface AnalyticsData<T extends AnalyticsMetric> {
  /**
   * The type of analytics metric.
   */
  metric: T;
  
  /**
   * Timestamp when the analytics data was generated.
   */
  timestamp: string;
  
  /**
   * The time range covered by the analytics data.
   */
  timeRange: {
    start: string;
    end: string;
  };
  
  /**
   * Filters applied to generate the analytics data.
   */
  appliedFilters: AnalyticsQueryFilters;
}

/**
 * Interface for user activity analytics data.
 */
export interface UserActivityAnalyticsData extends AnalyticsData<AnalyticsMetric.USER_ACTIVITY> {
  /**
   * Daily active users data.
   */
  dailyActiveUsers: {
    date: string;
    count: number;
  }[];
  
  /**
   * User engagement metrics.
   */
  engagement: {
    averageSessionDuration: number;
    averageLessonsPerSession: number;
  };
  
  /**
   * Total user count.
   */
  totalUsers: number;
  
  /**
   * New user registrations.
   */
  newUsers: {
    date: string;
    count: number;
  }[];
}

/**
 * Interface for enrollment analytics data.
 */
export interface EnrollmentAnalyticsData extends AnalyticsData<AnalyticsMetric.ENROLLMENT> {
  /**
   * Total enrollment count.
   */
  totalEnrollments: number;
  
  /**
   * New enrollments over time.
   */
  newEnrollments: {
    date: string;
    count: number;
  }[];
  
  /**
   * Course popularity metrics.
   */
  coursesPopularity: {
    courseId: string;
    courseTitle: string;
    enrollmentCount: number;
    percentage: number;
  }[];
  
  /**
   * Conversion rate from views to enrollments.
   */
  conversionRate: number;
}

/**
 * Interface for exam statistics analytics data.
 */
export interface ExamStatsAnalyticsData extends AnalyticsData<AnalyticsMetric.EXAM_STATS> {
  /**
   * Average exam score.
   */
  averageScore: number;
  
  /**
   * Passing rate for exams.
   */
  passRate: number;
  
  /**
   * Distribution of exam scores.
   */
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  
  /**
   * Average number of attempts per user.
   */
  averageAttempts: number;
  
  /**
   * Questions with highest failure rates.
   */
  challengingQuestions: {
    questionId: string;
    failureRate: number;
  }[];
}

/**
 * Interface for revenue analytics data.
 */
export interface RevenueAnalyticsData extends AnalyticsData<AnalyticsMetric.REVENUE> {
  /**
   * Total revenue.
   */
  totalRevenue: number;
  
  /**
   * Revenue over time.
   */
  revenueByPeriod: {
    period: string;
    amount: number;
  }[];
  
  /**
   * Revenue breakdown by course.
   */
  revenueByCourse: {
    courseId: string;
    courseTitle: string;
    amount: number;
    percentage: number;
  }[];
  
  /**
   * Revenue breakdown by transaction type.
   */
  revenueByType: {
    type: 'course_purchase' | 'exam_voucher';
    amount: number;
    percentage: number;
  }[];
  
  /**
   * Average transaction value.
   */
  averageTransactionValue: number;
}

/**
 * Interface for lesson completion analytics data.
 */
export interface LessonCompletionAnalyticsData extends AnalyticsData<AnalyticsMetric.LESSON_COMPLETION> {
  /**
   * Overall completion rate.
   */
  overallCompletionRate: number;
  
  /**
   * Completion rates by course.
   */
  completionByCourse: {
    courseId: string;
    courseTitle: string;
    completionRate: number;
  }[];
  
  /**
   * Average time spent per lesson.
   */
  averageTimePerLesson: number;
  
  /**
   * Lessons with lowest completion rates.
   */
  lowCompletionLessons: {
    lessonId: string;
    lessonTitle: string;
    moduleId: string;
    moduleTitle: string;
    courseId: string;
    courseTitle: string;
    completionRate: number;
  }[];
  
  /**
   * User progress distribution.
   */
  progressDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Interface for certificate issuance analytics data.
 */
export interface CertificateIssuanceAnalyticsData extends AnalyticsData<AnalyticsMetric.CERTIFICATE_ISSUANCE> {
  /**
   * Total certificates issued.
   */
  totalCertificates: number;
  
  /**
   * Certificate issuance over time.
   */
  issuanceByPeriod: {
    period: string;
    count: number;
  }[];
  
  /**
   * Certificate issuance by course.
   */
  issuanceByCourse: {
    courseId: string;
    courseTitle: string;
    count: number;
    percentage: number;
  }[];
  
  /**
   * Average time from enrollment to certification.
   */
  averageTimeToCompletion: number;
  
  /**
   * Certification success rate (enrollments that lead to certification).
   */
  certificationRate: number;
}

/* Developed by Luccas A E | 2025 */
