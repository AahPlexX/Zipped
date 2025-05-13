
// src/components/ui/toast.tsx

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the Toast type
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

// Define the ToastContext type
export interface ToastContextType {
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
}

// Create the Toast Context
export const ToastContext = createContext<ToastContextType | null>(null);

// Define the toast variants using class-variance-authority
const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'bg-background border',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
        success: 'success group border-green-500 bg-green-500 text-white',
        warning: 'warning group border-yellow-500 bg-yellow-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define props for the Toast component
interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  toast: Toast;
  onDismiss: (id: string) => void;
}

// Toast component
function Toast({ toast, onDismiss, className, variant, ...props }: ToastProps) {
  // Auto-dismiss after specified duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className="pt-2"
    >
      <div
        className={cn(toastVariants({ variant: toast.variant }), className)}
        {...props}
      >
        <div className="flex-1">
          {toast.title && <h3 className="font-medium">{toast.title}</h3>}
          {toast.description && <p className="text-sm opacity-90">{toast.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md p-1 text-foreground/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </motion.div>
  );
}

// ToastContainer component for rendering toasts
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col p-4 max-w-md gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ToastProvider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  // Set mounted state on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Add a new toast
  const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...newToast }]);
  }, []);

  // Dismiss a toast by ID
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismissToast, dismissAllToasts }}>
      {children}
      {mounted &&
        createPortal(
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />,
          document.body
        )}
    </ToastContext.Provider>
  );
}

/* Developed by Luccas A E | 2025 */
