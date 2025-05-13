// src/types/index.ts
// This file serves as the central hub for re-exporting types from other files
// within the src/types directory. It also defines common utility types and
// potentially type guard functions used across the application.
// Developed by Luccas A E | 2025

// --- Re-exports from other type definition files ---
export * from './api';
export * from './course';
// Note: '.d.ts' files like 'better-auth.d.ts' are typically not re-exported directly
// as they provide ambient declarations or module augmentations recognized globally by TypeScript.
// However, if 'better-auth.d.ts' were to export specific named types intended for direct import,
// you could re-export them here if desired. For now, we assume it's primarily for augmentation.
export * from './exam';
export * from './enrollment';
export * from './admin';
export * from './analytics';
export * from './ui';
export * from './forms';
export * from './utils';

// --- Common Utility Types ---

/**
 * Represents a value that might be null or undefined.
 * Useful for optional fields or data that may not always be present.
 */
export type Maybe<T> = T | null | undefined;

/**
 * Represents the result of a query or data fetching operation,
 * often used with libraries like React Query.
 * @template TData The type of the data returned on success.
 * @template TError The type of the error returned on failure.
 */
export type QueryResult<TData, TError = Error> =
  | { status: 'pending'; data: undefined; error: undefined; isLoading: true; isSuccess: false; isError: false; }
  | { status: 'success'; data: TData; error: undefined; isLoading: false; isSuccess: true; isError: false; }
  | { status: 'error'; data: undefined; error: TError; isLoading: false; isSuccess: false; isError: true; };

/**
 * Represents a paginated list of items.
 * @template TItem The type of items in the list.
 */
export interface PaginatedResponse<TItem> {
  items: TItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

/**
 * A generic type for an entity that has an ID.
 */
export interface Identifiable {
  id: string; // Assuming UUIDs or string-based IDs from Prisma
}

/**
 * A generic type for an entity that has timestamps.
 */
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

// --- Type Guard Functions ---
// Type guards are functions that perform a runtime check to guarantee the type of a value within a certain scope.

/**
 * Example: Type guard to check if an object is an error with a message property.
 * @param error The value to check.
 * @returns True if the value is an error object with a message, false otherwise.
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Example: Type guard to check if a value is a specific type of Identifiable entity.
 * This is a placeholder; specific type guards would be more concrete.
 * @param entity The value to check.
 * @returns True if the value is an Identifiable entity, false otherwise.
 */
export function isIdentifiable(entity: unknown): entity is Identifiable {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'id' in entity &&
    typeof (entity as { id: unknown }).id === 'string'
  );
}

// Add other widely used utility types or type guards as the application evolves.
// For example, for specific domain entities if needed across multiple modules.