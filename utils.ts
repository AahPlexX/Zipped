// src/types/utils.ts
// This file defines various utility types, helper types for transformations,
// and advanced generic type utilities that can be used throughout the application
// to enhance type safety and code clarity.
// Developed by Luccas A E | 2025

// --- Basic Utility Types ---

/**
 * Makes specified keys of an interface optional.
 * @template T The original type.
 * @template K The keys to make optional.
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified keys of an interface required.
 * @template T The original type.
 * @template K The keys to make required.
 */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Makes all properties of T readonly, including nested objects.
 * @template T The type to make readonly.
 */
export type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * Makes all properties of T writable (removes readonly), including nested objects.
 * @template T The type to make writable.
 */
export type DeepWritable<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { -readonly [K in keyof T]: DeepWritable<T[K]> }
  : T;

/**
 * Makes all properties of T partial (optional), including nested objects.
 * @template T The type to make deeply partial.
 */
export type DeepPartial<T> = T extends (...args: any[]) => any
  ? T | undefined // Functions can be optional
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T | undefined;


// --- Strict Omit and Pick ---

/**
 * Stricter version of Omit. Ensures K is actually a key of T.
 * @template T The original type.
 * @template K The keys to omit.
 */
export type OmitStrict<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Stricter version of Pick. Ensures K is actually a key of T.
 * @template T The original type.
 * @template K The keys to pick.
 */
export type PickStrict<T, K extends keyof T> = Pick<T, K>;

// --- String Manipulation Types ---

/**
 * Creates a type with keys prefixed.
 * Example: PrefixKeys<{ a: string }, 'prefix_'> -> { prefix_a: string }
 */
export type PrefixKeys<TObj, TPrefix extends string> = {
  [K in keyof TObj as `${TPrefix}${K & string}`]: TObj[K];
};

// --- Array and Tuple Utilities ---

/**
 * Extracts the type of the elements of an array.
 * @template T An array type.
 */
export type ArrayElement<T> = T extends (infer E)[] ? E : never;

/**
 * Extracts the type of the elements of a readonly array.
 * @template T A readonly array type.
 */
export type ReadonlyArrayElement<T> = T extends readonly (infer E)[] ? E : never;

// --- Conditional Types ---

/**
 * If T is a string, returns T; otherwise, returns never.
 */
export type EnsureString<T> = T extends string ? T : never;

/**
 * If T is a number, returns T; otherwise, returns never.
 */
export type EnsureNumber<T> = T extends number ? T : never;

// --- Brand Types (Nominal Typing) ---
// Useful for creating distinct types that have the same underlying structure but are not interchangeable.
// Example: type UserID = Brand<string, 'UserID'>; type ProductID = Brand<string, 'ProductID'>;

export type Brand<T, B extends string> = T & { __brand: B };

// --- Function Utilities ---

/**
 * Extracts the return type of a function or a promise-returning function.
 * @template T A function type.
 */
export type AsyncReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : ReturnType<T>;


// --- Object Key Utilities ---

/**
 * Creates a union of the literal types of an object's values.
 * Example: ValueOf<{ a: 'A', b: 'B' }> -> 'A' | 'B'
 */
export type ValueOf<T> = T[keyof T];


// --- Type for ensuring an object has at least one of the specified keys ---
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];


// --- Path Types for Nested Objects (Advanced) ---
// Useful for type-safe access to nested properties, e.g., for i18n libraries or data selectors.

type PathImpl<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ? | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
      | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
      | Key
    : Key
  : never;

type PathImpl2<T> = PathImpl<T, keyof T> | keyof T;

/**
 * Creates a union of all possible dot-separated paths for keys in a nested object.
 * @template T The object type.
 * Example: Path<({ a: { b: string, c: number }})> -> "a" | "a.b" | "a.c"
 */
export type Path<T> = PathImpl2<T> extends string | keyof T ? PathImpl2<T> : keyof T;

/**
 * Get the type of a property at a given path in a nested object.
 * @template T The object type.
 * @template P The dot-separated path (string literal).
 */
export type TypeFromPath<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? TypeFromPath<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

// Add other advanced or project-specific utility types as needed.