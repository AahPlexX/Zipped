// src/hooks/useExamState.ts
// This hook manages the state of a specific exam attempt, including tracking
// question responses and timer functionality.
// NSBS rules: Self-paced learning, no enforced time limits for course completion.
// The exam timer mentioned here should be informational if strict time limits are against NSBS philosophy.
// Developed by Luccas A E | 2025

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ExamQuestion, UserExamAnswer, ApiErrorResponse } from '@/types';
import { useQuery } from '@tanstack/react-query'; // For potentially fetching attempt details or questions

// --- API Interaction (Example: could be for fetching questions if not passed in) ---
/**
 * Fetches exam questions for a specific attempt ID if not provided initially.
 * @param attemptId The ID of the exam attempt.
 * @returns Promise<ExamQuestion[]>
 */
const fetchExamAttemptQuestions = async (attemptId: string): Promise<ExamQuestion[]> => {
  if (!attemptId) throw new Error("Attempt ID is required to fetch questions.");
  const response = await fetch(`/api/exam/attempt/${attemptId}/questions`); // Example API endpoint
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message || 'Failed to fetch exam questions for attempt.');
  }
  const successData = await response.json();
  return successData.data;
};


export interface ExamTimerState {
  initialDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isFinished: boolean;
}

/**
 * Manages the state for a single exam attempt.
 * @param attemptId The unique identifier for this exam attempt.
 * @param initialQuestions Optional: Questions can be passed in directly.
 * @param examDurationSeconds Optional: Duration for the exam timer in seconds.
 * If not provided, no timer functionality will be active.
 */
export function useExamState(
  attemptId: string,
  initialQuestions?: ExamQuestion[],
  examDurationSeconds?: number // e.g., 3600 for 1 hour
) {
  // --- State for Questions ---
  // If initialQuestions are not provided, they could be fetched.
  const {
    data: questionsFromQuery,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useQuery<ExamQuestion[], Error>({
    queryKey: ['examAttemptQuestions', attemptId],
    queryFn: () => fetchExamAttemptQuestions(attemptId),
    enabled: !initialQuestions && !!attemptId, // Fetch only if not provided and attemptId exists
    staleTime: Infinity, // Questions for an attempt typically don't change
  });

  const questions = initialQuestions || questionsFromQuery || [];

  // --- State for User Answers ---
  const [userAnswers, setUserAnswers] = useState<UserExamAnswer[]>([]);

  const updateAnswer = useCallback((questionId: string, selectedOptionId: string) => {
    setUserAnswers((prevAnswers) => {
      const existingAnswerIndex = prevAnswers.findIndex(ans => ans.questionId === questionId);
      if (existingAnswerIndex > -1) {
        // Update existing answer
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = { questionId, selectedOptionId };
        return updatedAnswers;
      } else {
        // Add new answer
        return [...prevAnswers, { questionId, selectedOptionId }];
      }
    });
  }, []);

  const clearAnswers = useCallback(() => {
    setUserAnswers([]);
  }, []);

  // --- State for Timer ---
  const [timer, setTimer] = useState<ExamTimerState | null>(() => {
    if (!examDurationSeconds || examDurationSeconds <= 0) return null;
    return {
      initialDurationSeconds: examDurationSeconds,
      remainingSeconds: examDurationSeconds,
      isRunning: false,
      isFinished: false,
    };
  });
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (!timer || timer.isRunning || timer.isFinished) return;
    setTimer(prev => prev ? { ...prev, isRunning: true } : null);

    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (!prev || !prev.isRunning) return prev;
        if (prev.remainingSeconds <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return { ...prev, remainingSeconds: 0, isRunning: false, isFinished: true };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
  }, [timer]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setTimer(prev => prev ? { ...prev, isRunning: false } : null);
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    if (examDurationSeconds && examDurationSeconds > 0) {
      setTimer({
        initialDurationSeconds: examDurationSeconds,
        remainingSeconds: examDurationSeconds,
        isRunning: false,
        isFinished: false,
      });
    } else {
      setTimer(null);
    }
  }, [examDurationSeconds, stopTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Effect to auto-start timer if exam loads and timer is configured (optional behavior)
  // useEffect(() => {
  //   if (questions.length > 0 && timer && !timer.isRunning && !timer.isFinished) {
  //     startTimer();
  //   }
  // }, [questions, timer, startTimer]);


  return {
    attemptId,
    questions,
    isLoadingQuestions: initialQuestions ? false : isLoadingQuestions,
    questionsError,

    userAnswers,
    updateAnswer,
    clearAnswers,

    timer, // Contains remainingSeconds, isRunning, isFinished
    startTimer: examDurationSeconds ? startTimer : () => {}, // No-op if no duration
    stopTimer: examDurationSeconds ? stopTimer : () => {},
    resetTimer: examDurationSeconds ? resetTimer : () => {},
  };
}