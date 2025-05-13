// src/components/features/exam/QuestionNavigation.tsx
// This component provides an interface for navigating through exam questions.
// It displays question numbers, indicates their status (unanswered, answered, current),
// and allows users to jump directly to a specific question.
// Developed by Luccas A E | 2025

'use client';

import React from 'react';
import { cn } from '@/lib/utils'; // For conditional class names
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // For handling many questions
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // For better UX

// Define possible statuses for a question in the navigation
export type QuestionNavStatus = 'unanswered' | 'answered' | 'current' | 'flagged'; // Added 'flagged' as a common exam feature

export interface QuestionNavigationProps {
  /** Total number of questions in the exam. */
  totalQuestions: number;
  /** Index of the currently active question (0-based). */
  currentQuestionIndex: number;
  /**
   * Array representing the status of each question.
   * The length of this array should be equal to `totalQuestions`.
   * Example: `['answered', 'current', 'unanswered', ..., 'flagged']`
   */
  questionStatuses: QuestionNavStatus[];
  /** Callback function invoked when a user clicks to jump to a specific question. */
  onJumpToQuestion: (questionIndex: number) => void;
  /** Optional: className for custom styling of the container. */
  className?: string;
}

/**
 * ExamQuestionNavigation component provides a UI for navigating exam questions.
 * It shows the status of each question and allows direct navigation.
 */
export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  totalQuestions,
  currentQuestionIndex,
  questionStatuses,
  onJumpToQuestion,
  className,
}) => {
  // Ensure questionStatuses array has the correct length, defaulting to 'unanswered' if not provided
  const normalizedStatuses = Array.from({ length: totalQuestions }, (_, i) =>
    questionStatuses[i] || 'unanswered'
  );

  // Define base and status-specific styles using Tailwind CSS for clarity and maintainability
  // Adhering to "High contrast for readability" from NSBS guidelines.
  const getStatusStyles = (status: QuestionNavStatus, index: number): string => {
    const baseStyles =
      'h-10 w-10 p-0 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const isCurrent = index === currentQuestionIndex;

    switch (status) {
      case 'answered':
        return cn(
          baseStyles,
          isCurrent
            ? 'bg-blue-600 text-blue-foreground hover:bg-blue-700/90 border-blue-700 ring-offset-background ring-2 ring-blue-500' // Current and answered
            : 'bg-green-500 text-green-foreground hover:bg-green-600/90 border-green-600 dark:bg-green-600 dark:text-white dark:hover:bg-green-700' // Answered
        );
      case 'current':
        return cn(
          baseStyles,
          'bg-primary text-primary-foreground hover:bg-primary/90 border-primary ring-offset-background ring-2 ring-primary' // Current and (potentially) unanswered
        );
      case 'flagged':
        return cn(
          baseStyles,
          isCurrent
            ? 'bg-yellow-500 text-yellow-foreground hover:bg-yellow-600/90 border-yellow-600 ring-offset-background ring-2 ring-yellow-400' // Current and flagged
            : 'bg-yellow-400 text-yellow-foreground hover:bg-yellow-500/90 border-yellow-500 dark:bg-yellow-500 dark:text-black dark:hover:bg-yellow-600' // Flagged
        );
      case 'unanswered':
      default:
        return cn(
          baseStyles,
          'bg-background hover:bg-accent hover:text-accent-foreground border-input dark:border-slate-700 dark:hover:bg-slate-800' // Default for unanswered
        );
    }
  };

  // Tooltip content for each status
  const getStatusTooltip = (status: QuestionNavStatus, index: number): string => {
    const questionNumber = index + 1;
    if (index === currentQuestionIndex) {
      return `Current: Question ${questionNumber} (${status})`;
    }
    return `Question ${questionNumber} (${status})`;
  };


  if (totalQuestions <= 0) {
    return null; // Don't render if there are no questions
  }

  return (
    <div className={cn('p-4 border rounded-lg bg-card shadow', className)} role="navigation" aria-label="Exam Question Navigation">
      <h3 className="mb-3 text-md font-semibold text-card-foreground">Question Navigator</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
          {Array.from({ length: totalQuestions }).map((_, index) => {
            const status = normalizedStatuses[index];
            return (
              <TooltipProvider key={index} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline" // Base variant, specific styles applied by getStatusStyles
                      className={cn('shrink-0', getStatusStyles(status, index))}
                      onClick={() => onJumpToQuestion(index)}
                      aria-label={`Jump to question ${index + 1}, status: ${status}${index === currentQuestionIndex ? ', current question' : ''}`}
                      aria-current={index === currentQuestionIndex ? 'page' : undefined}
                    >
                      {index + 1}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getStatusTooltip(status, index)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {/* Optional: Legend for statuses */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center"><span className="mr-1.5 h-3 w-3 rounded-full bg-primary"></span>Current</div>
        <div className="flex items-center"><span className="mr-1.5 h-3 w-3 rounded-full bg-green-500 dark:bg-green-600"></span>Answered</div>
        <div className="flex items-center"><span className="mr-1.5 h-3 w-3 rounded-full border bg-background dark:border-slate-700"></span>Unanswered</div>
        <div className="flex items-center"><span className="mr-1.5 h-3 w-3 rounded-full bg-yellow-400 dark:bg-yellow-500"></span>Flagged</div>
      </div>
      {/* Developed by Luccas A E | 2025 */}
    </div>
  );
};