// src/types/ui.ts
// Defines types for UI components, theming, and general UI states.
// This helps in creating consistent and type-safe UI elements.
// Developed by Luccas A E | 2025

import React from 'react';

// --- Component Prop Interfaces ---
// Based on shadcn/ui and common component patterns

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'success'; // Custom success variant example

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean; // From shadcn/ui for slotting
}

export interface IconProps extends React.SVGProps<SVGSVGElement>, BaseComponentProps {
  size?: number | string; // e.g., 24 or "1.5em"
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, BaseComponentProps {}
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement>, BaseComponentProps {}
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement>, BaseComponentProps {}
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement>, BaseComponentProps {}
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement>, BaseComponentProps {}
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement>, BaseComponentProps {}


export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, BaseComponentProps {
  label?: string;
  error?: string | boolean; // Error message or boolean flag
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}
// ... Add more prop types for other shadcn/ui components like Alert, Progress, DropdownMenu, etc.

// --- Theme Type Definitions ---
// Aligns with "Dark Theme" requirement [cite: 5] and tailwind.config.ts [cite: 266]

export type Theme = 'light' | 'dark' | 'system' | 'sepia' | 'high-contrast'; // Example themes
// 'sepia' for a unique theme, 'high-contrast' for accessibility

export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme?: 'light' | 'dark'; // Actual theme applied after 'system' is resolved
}

// Specific color palette types if needed for JS logic (though Tailwind handles most of this)
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  destructive: string;
  // ... other colors
}

// --- UI State Types ---

export type LoadingStatus = 'idle' | 'pending' | 'succeeded' | 'failed';

export interface ModalState {
  isOpen: boolean;
  modalType: string | null; // e.g., 'confirmDelete', 'editProfile'
  modalProps?: Record<string, unknown>; // Props to pass to the specific modal content
}

export interface NotificationToast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'default';
  title?: string;
  message: string;
  duration?: number; // Milliseconds
  icon?: React.ReactNode;
  onDismiss?: (id: string) => void;
}

// For navigation items
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ElementType<IconProps>; // Lucide icon component or similar
  matchPaths?: string[]; // For active state detection
  children?: NavItem[]; // For sub-menus
  disabled?: boolean;
  external?: boolean; // Opens in a new tab
  badge?: string | number; // Optional badge content
  permissions?: string[]; // For RBAC - roles/permissions required to see this item
}

// For breadcrumbs
export interface BreadcrumbItem {
  label: string;
  href?: string; // Optional: last item might not have a link
}