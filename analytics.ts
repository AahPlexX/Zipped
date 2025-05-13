
// src/lib/analytics.ts

import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/dates';
import { AnalyticsQueryFilters, AnalyticsMetric } from '@/types/analytics';

/**
 * Generates user activity analytics over a specified time period
 * 
 * @param filters Query filters including date range
 * @returns User activity analytics data
 */
export async function getUserActivityAnalytics(filters: AnalyticsQueryFilters) {
  // Apply default date range if not specified
  const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  
  // Get user login activity
  const userLogins = await prisma.session.groupBy({
    by: ['userId'],
    _count: {
      id: true,
    },
    where: {
      expires: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  // Get new user registrations
  const newUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
  
  // Group new users by date
  const newUsersByDate = newUsers.reduce((acc, user) => {
    const dateKey = formatDate(user.createdAt, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = 0;
    }
    acc[dateKey]++;
    return acc;
  }, {} as Record<string, number>);
  
  // Get lesson completion activity
  const lessonCompletions = await prisma.lessonProgress.findMany({
    where: {
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      lesson: {
        select: {
          module: {
            select: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });
  
  // Group lesson completions by course
  const completionsByCourse: Record<string, { courseId: string; courseTitle: string; count: number }> = {};
  
  lessonCompletions.forEach(completion => {
    const courseId = completion.lesson.module.course.id;
    const courseTitle = completion.lesson.module.course.title;
    
    if (!completionsByCourse[courseId]) {
      completionsByCourse[courseId] = {
        courseId,
        courseTitle,
        count: 0,
      };
    }
    
    completionsByCourse[courseId].count++;
  });
  
  // Format engagement data by course
  const topEngagingCourses = Object.values(completionsByCourse)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(course => ({
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      engagementScore: course.count,
    }));
  
  // Calculate daily active users
  const dailyActiveUsers = await getDailyActiveUsers(startDate, endDate);
  
  // Calculate weekly active users
  const weeklyActiveUsers = await getWeeklyActiveUsers(startDate, endDate);
  
  // Calculate monthly active users
  const monthlyActiveUsers = await getMonthlyActiveUsers(startDate, endDate);
  
  return {
    metric: AnalyticsMetric.USER_ACTIVITY,
    timestamp: new Date().toISOString(),
    timeRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    appliedFilters: filters,
    dailyActiveUsers,
    newUserSignups: Object.entries(newUsersByDate).map(([date, count]) => ({
      date,
      value: count,
    })),
    topEngagingCourses,
    activeUserCounts: {
      dau: dailyActiveUsers,
      wau: weeklyActiveUsers,
      mau: monthlyActiveUsers,
    },
  };
}

/**
 * Generates exam statistics analytics
 * 
 * @param filters Query filters including course ID
 * @returns Exam statistics analytics data
 */
export async function getExamStatsAnalytics(filters: AnalyticsQueryFilters) {
  // Apply default date range if not specified
  const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  
  // Build the database query based on filters
  const whereClause: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };
  
  // Add course filter if specified
  if (filters.courseId) {
    whereClause.courseId = filters.courseId;
  }
  
  // Get all exam attempts in the period
  const examAttempts = await prisma.examAttempt.findMany({
    where: whereClause,
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
  
  // Calculate overall metrics
  const totalAttempts = examAttempts.length;
  const passingAttempts = examAttempts.filter(attempt => attempt.passed).length;
  const overallPassRate = totalAttempts > 0 ? (passingAttempts / totalAttempts) * 100 : 0;
  const totalScore = examAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const overallAverageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
  
  // Group attempts by course
  const attemptsByCourse: Record<string, {
    courseId: string;
    courseTitle: string;
    attempts: typeof examAttempts;
  }> = {};
  
  examAttempts.forEach(attempt => {
    const courseId = attempt.courseId;
    
    if (!attemptsByCourse[courseId]) {
      attemptsByCourse[courseId] = {
        courseId,
        courseTitle: attempt.course.title,
        attempts: [],
      };
    }
    
    attemptsByCourse[courseId].attempts.push(attempt);
  });
  
  // Calculate metrics by course
  const coursePerformance = Object.values(attemptsByCourse).map(course => {
    const courseAttempts = course.attempts;
    const totalCourseAttempts = courseAttempts.length;
    const passingCourseAttempts = courseAttempts.filter(attempt => attempt.passed).length;
    const coursePassRate = totalCourseAttempts > 0 ? (passingCourseAttempts / totalCourseAttempts) * 100 : 0;
    const totalCourseScore = courseAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const courseAverageScore = totalCourseAttempts > 0 ? totalCourseScore / totalCourseAttempts : 0;
    
    // Group attempts by user to calculate average attempts per user
    const attemptsByUser: Record<string, number> = {};
    courseAttempts.forEach(attempt => {
      if (!attemptsByUser[attempt.userId]) {
        attemptsByUser[attempt.userId] = 0;
      }
      attemptsByUser[attempt.userId]++;
    });
    
    const uniqueUsers = Object.keys(attemptsByUser).length;
    const averageAttemptsPerUser = uniqueUsers > 0 ? totalCourseAttempts / uniqueUsers : 0;
    
    return {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      totalAttempts: totalCourseAttempts,
      passRate: coursePassRate,
      averageScore: courseAverageScore,
      averageAttemptsPerUser,
    };
  });
  
  // Get most frequently missed questions
  const questionResults = await prisma.examQuestionResult.findMany({
    where: {
      examAttempt: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
      },
    },
    include: {
      question: true,
    },
  });
  
  const questionStats: Record<string, { questionId: string; attempts: number; correctCount: number }> = {};
  
  questionResults.forEach(result => {
    const questionId = result.questionId;
    
    if (!questionStats[questionId]) {
      questionStats[questionId] = {
        questionId,
        attempts: 0,
        correctCount: 0,
      };
    }
    
    questionStats[questionId].attempts++;
    if (result.isCorrect) {
      questionStats[questionId].correctCount++;
    }
  });
  
  // Calculate question difficulty
  const questionDifficulty = Object.values(questionStats).map(stat => ({
    questionId: stat.questionId,
    attempts: stat.attempts,
    correctRate: stat.attempts > 0 ? (stat.correctCount / stat.attempts) * 100 : 0,
  }));
  
  // Find the most challenging questions
  const mostChallengingQuestions = [...questionDifficulty]
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 10);
  
  return {
    metric: AnalyticsMetric.EXAM_STATS,
    timestamp: new Date().toISOString(),
    timeRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    appliedFilters: filters,
    overallPassRate,
    overallAverageScore,
    totalAttempts,
    coursePerformance,
    challengingQuestions: mostChallengingQuestions.map(q => ({
      questionId: q.questionId,
      failureRate: 100 - q.correctRate,
    })),
  };
}

/**
 * Generates revenue analytics
 * 
 * @param filters Query filters
 * @returns Revenue analytics data
 */
export async function getRevenueAnalytics(filters: AnalyticsQueryFilters) {
  // Apply default date range if not specified
  const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  
  // Get all payments in the period
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
  
  // Calculate total revenue
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Group payments by date
  const paymentsByDate: Record<string, number> = {};
  
  payments.forEach(payment => {
    const dateKey = formatDate(payment.createdAt, 'yyyy-MM-dd');
    if (!paymentsByDate[dateKey]) {
      paymentsByDate[dateKey] = 0;
    }
    paymentsByDate[dateKey] += payment.amount;
  });
  
  // Format revenue over time
  const revenueOverTime = Object.entries(paymentsByDate).map(([date, amount]) => ({
    date,
    value: amount,
  }));
  
  // Group payments by course
  const revenueByCourse: Record<string, { courseId: string; courseTitle: string; revenue: number }> = {};
  
  payments.forEach(payment => {
    if (payment.courseId) {
      const courseId = payment.courseId;
      
      if (!revenueByCourse[courseId]) {
        revenueByCourse[courseId] = {
          courseId,
          courseTitle: payment.course?.title || 'Unknown Course',
          revenue: 0,
        };
      }
      
      revenueByCourse[courseId].revenue += payment.amount;
    }
  });
  
  // Format revenue by course
  const formattedRevenueByCourse = Object.values(revenueByCourse)
    .sort((a, b) => b.revenue - a.revenue);
  
  // Group payments by type
  const coursePayments = payments.filter(p => p.type === 'COURSE_PURCHASE');
  const voucherPayments = payments.filter(p => p.type === 'EXAM_VOUCHER');
  
  const courseRevenue = coursePayments.reduce((sum, p) => sum + p.amount, 0);
  const voucherRevenue = voucherPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Count unique customers
  const uniqueCustomers = new Set(payments.map(p => p.userId)).size;
  
  // Calculate average revenue per user
  const averageRevenuePerUser = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
  
  // Track new customers over time
  const customerFirstPurchase: Record<string, Date> = {};
  
  payments.forEach(payment => {
    const userId = payment.userId;
    const purchaseDate = payment.createdAt;
    
    if (!customerFirstPurchase[userId] || purchaseDate < customerFirstPurchase[userId]) {
      customerFirstPurchase[userId] = purchaseDate;
    }
  });
  
  // Group new customers by date
  const newCustomersByDate: Record<string, number> = {};
  
  Object.entries(customerFirstPurchase).forEach(([userId, date]) => {
    if (date >= startDate && date <= endDate) {
      const dateKey = formatDate(date, 'yyyy-MM-dd');
      if (!newCustomersByDate[dateKey]) {
        newCustomersByDate[dateKey] = 0;
      }
      newCustomersByDate[dateKey]++;
    }
  });
  
  // Format new customers over time
  const newCustomers = Object.entries(newCustomersByDate).map(([date, count]) => ({
    date,
    value: count,
  }));
  
  return {
    metric: AnalyticsMetric.REVENUE,
    timestamp: new Date().toISOString(),
    timeRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    appliedFilters: filters,
    totalRevenue,
    revenueOverTime,
    revenueByCourse: formattedRevenueByCourse,
    revenueByType: [
      { type: 'course_purchase', amount: courseRevenue, percentage: (courseRevenue / totalRevenue) * 100 },
      { type: 'exam_voucher', amount: voucherRevenue, percentage: (voucherRevenue / totalRevenue) * 100 },
    ],
    newCustomers,
    averageRevenuePerUser,
    voucherSalesRevenue: voucherRevenue,
  };
}

// --- Helper Functions ---

/**
 * Gets daily active users for a date range
 */
async function getDailyActiveUsers(startDate: Date, endDate: Date) {
  // This is a simplified implementation - in production, you would need
  // more sophisticated tracking of user activity beyond just sessions
  
  // Get active sessions by day
  const dailyActiveSessions = await prisma.$queryRaw<{ date: string; users: number }[]>`
    SELECT 
      DATE(session."createdAt") as date,
      COUNT(DISTINCT session."userId") as users
    FROM "Session" session
    WHERE session."createdAt" >= ${startDate} AND session."createdAt" <= ${endDate}
    GROUP BY DATE(session."createdAt")
    ORDER BY date
  `;
  
  return dailyActiveSessions.map(day => ({
    date: day.date,
    value: Number(day.users),
  }));
}

/**
 * Gets weekly active users for a date range
 */
async function getWeeklyActiveUsers(startDate: Date, endDate: Date) {
  // Get active sessions by week
  const weeklyActiveSessions = await prisma.$queryRaw<{ week: string; users: number }[]>`
    SELECT 
      DATE_TRUNC('week', session."createdAt") as week,
      COUNT(DISTINCT session."userId") as users
    FROM "Session" session
    WHERE session."createdAt" >= ${startDate} AND session."createdAt" <= ${endDate}
    GROUP BY DATE_TRUNC('week', session."createdAt")
    ORDER BY week
  `;
  
  return weeklyActiveSessions.map(week => ({
    date: formatDate(week.week, 'yyyy-MM-dd'),
    value: Number(week.users),
  }));
}

/**
 * Gets monthly active users for a date range
 */
async function getMonthlyActiveUsers(startDate: Date, endDate: Date) {
  // Get active sessions by month
  const monthlyActiveSessions = await prisma.$queryRaw<{ month: string; users: number }[]>`
    SELECT 
      DATE_TRUNC('month', session."createdAt") as month,
      COUNT(DISTINCT session."userId") as users
    FROM "Session" session
    WHERE session."createdAt" >= ${startDate} AND session."createdAt" <= ${endDate}
    GROUP BY DATE_TRUNC('month', session."createdAt")
    ORDER BY month
  `;
  
  return monthlyActiveSessions.map(month => ({
    date: formatDate(month.month, 'yyyy-MM-dd'),
    value: Number(month.users),
  }));
}

/* Developed by Luccas A E | 2025 */
