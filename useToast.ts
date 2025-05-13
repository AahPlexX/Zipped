
// src/hooks/useToast.ts

import { useCallback } from 'react';
import { ToastActionElement, toast as toastLib } from '@/components/ui/toast';

export type ToastProps = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive' | 'success';
};

/**
 * A custom React hook for managing toast notifications.
 * It provides a simple interface for showing different types of toast notifications.
 *
 * @returns {object} An object containing functions to display different types of toasts.
 */
export function useToast() {
  /**
   * Shows a toast notification with the provided properties.
   * @param {ToastProps} props - The properties for the toast notification.
   */
  const toast = useCallback(({ title, description, action, variant = 'default' }: ToastProps) => {
    toastLib({
      title,
      description,
      action,
      variant,
    });
  }, []);

  /**
   * Shows a success toast notification.
   * @param {string} title - The title of the toast.
   * @param {string} description - The description of the toast.
   */
  const success = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
      variant: 'success',
    });
  }, [toast]);

  /**
   * Shows an error toast notification.
   * @param {string} title - The title of the toast.
   * @param {string} description - The description of the toast.
   */
  const error = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    });
  }, [toast]);

  /**
   * Shows an info toast notification.
   * @param {string} title - The title of the toast.
   * @param {string} description - The description of the toast.
   */
  const info = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
    });
  }, [toast]);

  return {
    toast,
    success,
    error,
    info,
  };
}

/* Developed by Luccas A E | 2025 */
