// This is a modified version of the shadcn/ui toaster component

"use client"; // Mark this component as a Client Component

import { Toast, ToastClose, ToastDescription, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

// The Toaster component is responsible for rendering all currently active toasts
export function Toaster() {
  // Use the useToast hook to get the list of toasts and the dismiss function
  const { toasts } = useToast();

  return (
    // ToastProvider is needed to manage the state and lifecycle of toasts
    <ToastProvider>
      {/* Map over the array of toasts and render each one */}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          // Render the individual Toast component
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {/* Render the ToastTitle if a title exists */}
              {title && <ToastTitle>{title}</ToastTitle>}
              {/* Render the ToastDescription if a description exists */}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {/* Render the ToastAction if an action button exists */}
            {action}
            {/* Render the ToastClose button to dismiss the toast */}
            <ToastClose />
          </Toast>
        );
      })}
      {/* The ToastViewport is the container where toasts are visually positioned */}
      <ToastViewport />
    </ToastProvider>
  );
}