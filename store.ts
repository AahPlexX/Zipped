
// src/lib/store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Theme Store ---

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'nsbs-theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// --- User Preferences Store ---

interface UserPreferences {
  contentFontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reduceMotion: boolean;
  [key: string]: any;
}

interface UserPreferencesState {
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  contentFontSize: 'medium',
  highContrast: false,
  reduceMotion: false,
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      preferences: { ...defaultPreferences },
      setPreference: (key, value) => set((state) => ({
        preferences: {
          ...state.preferences,
          [key]: value,
        },
      })),
      resetPreferences: () => set({ preferences: { ...defaultPreferences } }),
    }),
    {
      name: 'nsbs-user-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// --- Lesson Progress Store ---

interface LessonProgress {
  courseId: string;
  moduleId: string;
  lessonId: string;
  completed: boolean;
  lastVisited: string; // ISO date string
}

interface CourseProgressData {
  [lessonId: string]: LessonProgress;
}

interface ProgressState {
  progress: CourseProgressData;
  markLessonCompleted: (lessonProgress: LessonProgress) => void;
  markLessonVisited: (courseId: string, moduleId: string, lessonId: string) => void;
  resetCourseProgress: (courseId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      progress: {},
      markLessonCompleted: (lessonProgress) => set((state) => ({
        progress: {
          ...state.progress,
          [lessonProgress.lessonId]: {
            ...lessonProgress,
            completed: true,
            lastVisited: new Date().toISOString(),
          },
        },
      })),
      markLessonVisited: (courseId, moduleId, lessonId) => set((state) => ({
        progress: {
          ...state.progress,
          [lessonId]: {
            ...state.progress[lessonId],
            courseId,
            moduleId,
            lessonId,
            lastVisited: new Date().toISOString(),
          },
        },
      })),
      resetCourseProgress: (courseId) => set((state) => {
        const newProgress = { ...state.progress };
        Object.keys(newProgress).forEach((lessonId) => {
          if (newProgress[lessonId].courseId === courseId) {
            delete newProgress[lessonId];
          }
        });
        return { progress: newProgress };
      }),
    }),
    {
      name: 'nsbs-lesson-progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// --- Exam State Store ---

interface ExamAnswer {
  questionId: string;
  selectedOptionId: string;
}

interface ExamState {
  courseId: string | null;
  isActive: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number | null; // in seconds, null if no time limit
  answers: Record<string, string>; // questionId -> selectedOptionId
  questionIds: string[];
}

interface ExamStoreState {
  examState: ExamState;
  startExam: (courseId: string, questionIds: string[], totalQuestions: number) => void;
  endExam: () => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  goToQuestion: (index: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
}

const initialExamState: ExamState = {
  courseId: null,
  isActive: false,
  currentQuestionIndex: 0,
  totalQuestions: 0,
  timeRemaining: null,
  answers: {},
  questionIds: [],
};

export const useExamStore = create<ExamStoreState>()((set) => ({
  examState: { ...initialExamState },
  startExam: (courseId, questionIds, totalQuestions) => set({
    examState: {
      ...initialExamState,
      courseId,
      isActive: true,
      totalQuestions,
      questionIds,
      // No time constraint in NSBS requirements
    },
  }),
  endExam: () => set({
    examState: { ...initialExamState },
  }),
  answerQuestion: (questionId, optionId) => set((state) => ({
    examState: {
      ...state.examState,
      answers: {
        ...state.examState.answers,
        [questionId]: optionId,
      },
    },
  })),
  goToQuestion: (index) => set((state) => ({
    examState: {
      ...state.examState,
      currentQuestionIndex: Math.max(0, Math.min(index, state.examState.totalQuestions - 1)),
    },
  })),
  goToNextQuestion: () => set((state) => ({
    examState: {
      ...state.examState,
      currentQuestionIndex: Math.min(
        state.examState.currentQuestionIndex + 1,
        state.examState.totalQuestions - 1
      ),
    },
  })),
  goToPreviousQuestion: () => set((state) => ({
    examState: {
      ...state.examState,
      currentQuestionIndex: Math.max(state.examState.currentQuestionIndex - 1, 0),
    },
  })),
}));

/* Developed by Luccas A E | 2025 */
