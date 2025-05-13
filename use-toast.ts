// This is a modified version of the shadcn/ui toast component

import { useState, useEffect, useCallback } from "react";

// Import necessary types from the toast component file
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

// Define the maximum number of toasts to display concurrently
const TOAST_LIMIT = 10;
// Define the delay before a dismissed toast is removed from the state
const TOAST_REMOVE_DELAY = 1000000; // Set to a large number if you handle dismissal via UI

// Define the structure of a toast object managed by this hook
type ToasterToast = ToastProps & {
  id: string; // Unique identifier for each toast
  title?: React.ReactNode; // Optional title for the toast
  description?: React.ReactNode; // Optional description for the toast
  action?: ToastActionElement; // Optional action button for the toast
};

// Define action types for the reducer
const actionTypes = {
  ADD_TOAST: "ADD_TOAST", // Add a new toast
  UPDATE_TOAST: "UPDATE_TOAST", // Update an existing toast
  DISMISS_TOAST: "DISMISS_TOAST", // Mark a toast as dismissed (starts fade-out)
  REMOVE_TOAST: "REMOVE_TOAST", // Remove a toast entirely from the state
} as const; // Use `as const` for type safety with string literals

// Define the types for the actions
type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>; // Allow partial updates
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string; // Dismiss a specific toast or all if toastId is undefined
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string; // Remove a specific toast or all if toastId is undefined
    };

// Define the state shape
interface State {
  toasts: ToasterToast[]; // Array of currently active toasts
}

// Map to store timeouts for dismissing toasts
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// Simple counter for generating unique IDs
let count = 0;

// Function to generate a unique ID for each toast
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

// Reducer function to manage the state based on actions
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      // Add new toast to the beginning of the array, respecting the limit
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      // Update an existing toast by mapping over the toasts and replacing the matching one
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      // If a specific toastId is provided, set a timeout to remove it later
      if (toastId) {
        toastTimeouts.set(
          toastId,
          setTimeout(() => {
            toastTimeouts.delete(toastId); // Clean up the timeout map
            dispatch({
              type: actionTypes.REMOVE_TOAST,
              toastId,
            });
          }, TOAST_REMOVE_DELAY)
        );
      }

      // Mark the specified toast(s) as not open, triggering the exit animation
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false, // Set open to false to trigger dismissal animation
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      // Remove a toast entirely from the state
      if (action.toastId === undefined) {
        // If no toastId is provided, remove all toasts
        return {
          ...state,
          toasts: [],
        };
      }
      // Remove the specific toast by filtering the array
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// Array to hold listener functions that will be called when the state changes
const listeners: Array<(state: State) => void> = [];

// In-memory state initialized with an empty toasts array
let memoryState: State = { toasts: [] };

// Dispatch function to send actions to the reducer and notify listeners
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action); // Update state using the reducer
  // Call all registered listeners with the new state
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Define the structure for the toast function arguments
interface Toast extends Omit<ToasterToast, "id"> {}

// Function to create and display a new toast
function toast({ ...props }: Toast) {
  const id = genId(); // Generate a unique ID for the new toast

  // Define update and dismiss functions for the newly created toast
  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  // Dispatch the ADD_TOAST action to add the toast to the state
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true, // Mark the toast as open initially
      // When the toast's open state changes (e.g., user clicks close), dismiss it
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Return the toast's id and dismiss/update functions for external control
  return {
    id,
    dismiss,
    update,
  };
}

// Custom hook to access the toast state and functions
function useToast() {
  const [state, setState] = useState<State>(memoryState); // Initialize state with the current memory state

  // Effect to subscribe to state changes and clean up the subscription
  useEffect(() => {
    // Add the setState function as a listener
    listeners.push(setState);
    // Return a cleanup function that removes the listener when the component unmounts
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]); // Re-run effect if state reference changes (though typically won't with this implementation)

  // Return the current state and the toast/dismiss functions
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

// Export the useToast hook and the toast function for use in components
export { useToast, toast };