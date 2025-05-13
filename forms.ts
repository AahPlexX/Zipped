// src/types/forms.ts
// Defines types related to HTML forms, form fields, validation schemas (e.g., from Zod),
// and form state management (e.g., for React Hook Form).
// Developed by Luccas A E | 2025

import { ZodSchema, ZodError, ZodIssue } from 'zod'; // As Zod is used for validations [cite: 34, 38, 292]
import { UseFormReturn, FieldError, Control } from 'react-hook-form'; // If React Hook Form is used

// --- General Form Field Definitions ---

export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface BaseFormFieldProps<TValue = any> {
  name: string; // Field name, used for form state and submission
  label?: string; // Display label for the field
  placeholder?: string;
  description?: string; // Helper text below the field
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: FieldError | ZodIssue | string; // Error object from react-hook-form or Zod, or simple string
  control?: Control<any>; // From react-hook-form, for controlled components
  value?: TValue;
  onChange?: (value: TValue) => void;
}

export interface TextInputFormFieldProps extends BaseFormFieldProps<string> {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'number';
  // ... other HTMLInputAttributes
}

export interface TextareaFormFieldProps extends BaseFormFieldProps<string> {
  rows?: number;
  // ... other HTMLTextareaAttributes
}

export interface SelectFormFieldProps extends BaseFormFieldProps<string | number> {
  options: FormFieldOption[];
  // ... other HTMLSelectAttributes
}

export interface CheckboxFormFieldProps extends BaseFormFieldProps<boolean> {
  // ... other HTMLInputAttributes for type="checkbox"
}

export interface RadioGroupFormFieldProps extends BaseFormFieldProps<string | number> {
  options: FormFieldOption[];
}

// --- Validation Schema Types ---

/**
 * A generic type for a function that validates form data using a Zod schema.
 * @template TFormValues The type of the form values.
 * @param data The form data to validate.
 * @returns An object indicating success or failure, with errors if any.
 */
export type ZodValidator<TFormValues> = (
  data: TFormValues
) =>
  | { success: true; data: TFormValues }
  | { success: false; errors: ZodError<TFormValues>['formErrors']['fieldErrors'] };

// --- Form State Interfaces ---

/**
 * General state for a form, often managed by libraries like React Hook Form.
 * @template TFormValues The type of the values contained in the form.
 */
export interface FormState<TFormValues> {
  isSubmitting: boolean;
  isSubmitted: boolean;
  isSubmitSuccessful: boolean;
  errors: Partial<Record<keyof TFormValues, string | string[] | FieldError | ZodIssue[]>>; // Can hold multiple errors per field
  isValid: boolean;
  // Values might be part of UseFormReturn from react-hook-form
}

/**
 * Props for a generic Form component wrapper.
 */
export interface GenericFormProps<TFieldValues extends Record<string, any>>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  formMethods: UseFormReturn<TFieldValues>; // From react-hook-form
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  zodSchema?: ZodSchema<TFieldValues>; // Optional Zod schema for resolver
  children: React.ReactNode;
  id?: string;
}

// --- Specific Form Value Types (examples) ---
// These would align with Zod schemas defined in `src/lib/validations.ts`

export interface LoginFormValues {
  email: string;
  password?: string; // Optional if supporting magic links prominently from same form
  rememberMe?: boolean;
}

export interface RegisterFormValues {
  name?: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: boolean;
}

export interface PasswordResetRequestFormValues {
  email: string;
}

export interface PasswordResetConfirmFormValues {
  // token is usually from URL params, not form field
  newPassword?: string;
  confirmNewPassword?: string;
}

export interface CoursePurchaseFormValues {
  // Typically, course ID is from URL. Form might be for payment details if not using Stripe Checkout directly.
  // For NSBS, Stripe Checkout is used, so form data might be minimal or handled by Stripe Elements.
  billingName?: string;
  billingAddress?: string;
  // ... etc. if Stripe Elements are used for custom form
}

// Add more specific form value types as needed for profile updates, admin forms, etc.