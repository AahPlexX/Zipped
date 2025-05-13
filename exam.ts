// src/types/exam.ts
// Defines types related to exams, questions, answers, attempts, and results.
// Aligns with the NSBS assessment system: 100 MCQs, 4 options, 80% pass[cite: 3].
// Developed by Luccas A E | 2025

import { Identifiable, Timestamped } from './index';

/**
 * Represents a single option for a multiple-choice question.
 */
export interface ExamQuestionOption extends Identifiable { // id could be 'A', 'B', 'C', 'D' or a numeric index
  text: string; // The text content of the option
}

/**
 * Represents a single multiple-choice question in an exam.
 * As per NSBS rules, 4 answer options per question[cite: 3].
 */
export interface ExamQuestion extends Identifiable, Timestamped {
  text: string; // The question text itself
  options: ExamQuestionOption[]; // Array of 4 options
  correctOptionId?: string; // ID of the correct option (only available on server/admin side, not sent to client during exam)
  explanation?: string; // Explanation for the correct answer (shown after submission, if applicable)
  courseId: string; // Which course this question belongs to
  moduleNum?: number; // Optional: which module this question relates to for analysis
  difficulty?: 'easy' | 'medium' | 'hard'; // Optional: for analysis or adaptive exams (NSBS is not adaptive)
}

/**
 * Represents a user's selected answer for a single exam question.
 */
export interface UserExamAnswer {
  questionId: string;
  selectedOptionId: string; // The ID of the option chosen by the user
}

/**
 * Represents an attempt made by a user for a specific exam.
 * Users get 2 initial attempts; can purchase 1 additional attempt[cite: 3].
 */
export interface ExamAttempt extends Identifiable, Timestamped {
  enrollmentId: string; // Links to the user's enrollment in the course
  userId: string;
  courseId: string;
  attemptNumber: number; // 1, 2, or 3 (after purchase)
  questions: ExamQuestion[]; // The specific set of questions presented in this attempt (ids usually)
  userAnswers: UserExamAnswer[]; // Array of answers submitted by the user
  score: number; // Percentage score, e.g., 85 for 85%
  passed: boolean; // True if score >= 80% (passing threshold [cite: 3])
  startedAt: Date;
  submittedAt?: Date; // When the exam was submitted
  durationSeconds?: number; // Time taken in seconds
  isVoucherUsed?: boolean; // If this attempt was made using a purchased voucher
}

/**
 * Represents the result of an exam attempt.
 */
export interface ExamResult {
  attemptId: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  submittedAt: Date;
  feedback?: QuestionFeedback[]; // Optional detailed feedback per question
  certificateId?: string | null; // ID of the certificate if passed and issued
}

/**
 * Detailed feedback for a single question after an exam.
 */
export interface QuestionFeedback {
  questionId: string;
  questionText: string;
  userSelectedOptionId?: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation?: string;
}

/**
 * Payload for submitting exam answers.
 */
export interface ExamSubmissionRequest {
  attemptId: string;
  answers: UserExamAnswer[];
}

/**
 * Represents an exam voucher.
 */
export interface ExamVoucher extends Identifiable, Timestamped {
  userId: string;
  courseId: string;
  purchaseDate: Date;
  usedAt?: Date | null;
  examAttemptId?: string | null; // Which attempt used this voucher
  orderId?: string; // From payment system
}