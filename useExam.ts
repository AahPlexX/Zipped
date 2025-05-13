// src/hooks/useExam.ts
// This hook manages the overall state and interactions during an active exam session.
// It handles question navigation, answer collection, and final submission.
// It may coordinate with useExamState for granular attempt details.
// Developed by Luccas A E | 2025

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExamQuestion,
  UserExamAnswer,
  ExamResult,
  ExamSubmissionRequest,
  ApiErrorResponse,
  // Assuming an API client
} from '@/types';
import { useToast } from './useToast';
import { useRouter } from 'next/navigation'; // For redirecting after exam submission
import { useExamState } from './useExamState'; // To manage attempt-specific state

export interface UseExamParams {
  attemptId: string; // The current exam attempt ID
  initialQuestions: ExamQuestion[]; // Questions for this attempt (without answers)
  courseId: string; // To redirect after exam
  enrollmentId: string;
}

/**
 * Custom hook to manage the active exam-taking process.
 * @param attemptId - The ID of the current exam attempt.
 * @param initialQuestions - The array of questions for this exam attempt.
 * @param courseId - The ID of the course this exam belongs to.
 */
export function useExam({ attemptId, initialQuestions, courseId, enrollmentId }: UseExamParams) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  // Use useExamState to manage answers and potentially timer for this specific attempt
  const {
    userAnswers,
    updateAnswer,
    // timer, // if useExamState manages a timer
    // startTimer,
    // stopTimer,
  } = useExamState(attemptId, initialQuestions); // Pass questions if useExamState initializes with them

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const totalQuestions = initialQuestions.length;
  const currentQuestion = initialQuestions[currentQuestionIndex];

  // --- Navigation ---
  const goToNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prevIndex) => Math.min(prevIndex + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goToPreviousQuestion = useCallback(() => {
    setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  }, [totalQuestions]);

  // --- Answer Handling ---
  /**
   * Handles selecting an answer for the current question.
   * Delegates to useExamState's updateAnswer.
   * @param questionId - The ID of the question.
   * @param selectedOptionId - The ID of the selected option.
   */
  const handleSelectAnswer = useCallback((questionId: string, selectedOptionId: string) => {
    updateAnswer(questionId, selectedOptionId);
  }, [updateAnswer]);

  const getSelectedOptionForQuestion = useCallback((questionId: string): string | undefined => {
    return userAnswers.find(ans => ans.questionId === questionId)?.selectedOptionId;
  }, [userAnswers]);

  // --- Exam Submission ---

  /**
   * Submits the exam answers to the backend.
   * @param payload - The submission payload.
   * @returns Promise<ExamResult>
   */
  const submitExamAnswers = async (payload: ExamSubmissionRequest): Promise<ExamResult> => {
    const response = await fetch(`/api/exam/submit/${payload.attemptId}`, { // Example API
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.answers), // Backend might just need answers for the attemptId
    });
    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error.message || 'Failed to submit exam.');
    }
    const successData = await response.json();
    return successData.data;
  };

  const submissionMutation = useMutation<ExamResult, Error, UserExamAnswer[]>(
    (answersToSubmit) => submitExamAnswers({ attemptId, answers: answersToSubmit }), {
    onMutate: () => {
      setIsSubmitting(true);
      setSubmissionError(null);
    },
    onSuccess: (data: ExamResult) => {
      toast({
        title: 'Exam Submitted Successfully!',
        description: `Your score: ${data.score}%. ${data.passed ? 'Congratulations, you passed!' : 'Please review your results.'}`,
        variant: data.passed ? 'success' : 'default',
        duration: 7000,
      });
      // Invalidate queries related to exam attempts, progress, certificates
      queryClient.invalidateQueries(['examAttempt', attemptId]);
      queryClient.invalidateQueries(['enrollmentProgress', enrollmentId]); // Assuming enrollmentId available
      if (data.passed) {
        queryClient.invalidateQueries(['certificates', courseId]);
      }
      // Redirect to results page or course page
      // For now, let's assume a results page: /courses/[courseId]/exam/results/[attemptId]
      router.push(`/courses/${courseId}/exam/results/${attemptId}`);
    },
    onError: (error: Error) => {
      setSubmissionError(error.message);
      toast({
        title: 'Exam Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmitExam = useCallback(() => {
    // Optionally, check if all questions are answered
    const unansweredQuestions = initialQuestions.filter(q => !userAnswers.find(a => a.questionId === q.id));
    if (unansweredQuestions.length > 0) {
      if (!window.confirm(`You have ${unansweredQuestions.length} unanswered question(s). Are you sure you want to submit?`)) {
        return;
      }
    }
    submissionMutation.mutate(userAnswers);
  }, [userAnswers, initialQuestions, submissionMutation]);


  useEffect(() => {
    // Example: if a timer was managed by useExamState and it runs out
    // if (timer && timer.isFinished) {
    //   handleSubmitExam();
    // }
  }, [/* timer, */ handleSubmitExam]);


  return {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    userAnswers, // The answers managed by useExamState
    isSubmitting,
    submissionError,

    // Navigation functions
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,

    // Answer functions
    handleSelectAnswer,
    getSelectedOptionForQuestion,

    // Submission function
    handleSubmitExam,

    // Potentially timer state if useExamState manages it and useExam exposes it
    // timerRemaining: timer?.remainingSeconds,
    // isTimerRunning: timer?.isRunning,
  };
}