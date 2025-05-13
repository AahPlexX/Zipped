// src/hooks/useAnalytics.ts

// --- Import necessary React hooks and libraries ---
// React hooks for state management and performance optimizations.
import { useState, useEffect, useMemo, useCallback } from 'react';
// React Query (now TanStack Query) is a powerful library for managing server state.
// It handles fetching, caching, synchronizing, and updating asynchronous data in React applications.
import { useQuery, UseQueryOptions, QueryFunction } from '@tanstack/react-query';

// --- Import application-specific utilities and types ---
// Assuming existence of a robust API client library for fetching analytics data.
// This apiClient should handle base URLs, authentication headers, request/response interception, etc.
import { apiClient } from '@/lib/apiClient'; // Import the API client utility
// Import a standardized API error type. This helps in consistent error handling across the application.
import { ApiError } from '@/types/api'; // Import standardized API error type

// Assuming existence of types for different analytics data structures and query parameters.
// These types define the shape of data fetched and the parameters used to filter it.
import {
AnalyticsData, // Generic type for fetched analytics data specific to a metric
AnalyticsQueryFilters, // Type for filters specific to analytics queries (e.g., date range, course ID, user group)
AnalyticsMetric, // Enum or Union type for different types of analytics (e.g., 'userActivity', 'examStats', 'courseCompletion')
} from '@/types/analytics'; // Import necessary types

// Assuming a toast notification hook for providing user feedback, especially for errors.
import { useToast } from './useToast'; // Import the toast hook

// --- Define Hook Parameters Interface ---
// This interface strongly types the configuration options for the useAnalytics hook.
interface UseAnalyticsParams<TMetric extends AnalyticsMetric, TData extends AnalyticsData<TMetric>> {
/**
* The type of analytics metric to fetch.
* This string or enum value is typically used to construct the API endpoint path.
* Examples: 'userActivity', 'examStats', 'courseCompletion'.
*/
metric: TMetric;

/**
* Optional initial state for analytics query filters.
* These filters are used to narrow down the analytics data fetched (e.g., { startDate: '2023-01-01', endDate: '2023-12-31', courseId: 123 }).
* Defaults may vary based on the metric (e.g., last 30 days for user activity) and can be defined internally or via the API.
*/
initialFilters?: AnalyticsQueryFilters;

/**
* Optional parts to add to the React Query cache key.
* This is crucial for ensuring that different instances of the hook fetching the *same metric* but in *different contexts*
* (e.g., analytics for Course A vs. Course B, or overall analytics vs. user-specific analytics)
* have unique cache entries and do not overwrite each other's data.
* It should be an array of serializable values (strings, numbers, plain objects).
* Examples: ['course', courseId], ['user', userId].
*/
queryKeyParts?: (string | number | AnalyticsQueryFilters)[];

/**
* Whether the data fetching is enabled.
* This is a standard React Query option, useful for conditionally fetching data.
* For instance, delaying a fetch until a user ID is available, or until a modal is opened.
* @default true
*/
enabled?: boolean;

/**
* Additional configuration options to pass directly to React Query's useQuery hook.
* This allows consumers of this hook to override default behaviors like retries,
* refetching strategies, cache time, stale time, selectors, etc.
* The type is derived from React Query's UseQueryOptions, excluding options managed by this hook (like queryKey and queryFn).
*/
queryOptions?: Omit<UseQueryOptions<TData, ApiError, TData, (string | number | AnalyticsQueryFilters)[]>, 'queryKey' | 'queryFn' | 'enabled' | 'placeholderData' | 'onError'>;
}

/**
* A custom React hook for fetching and managing analytics data from the API.
* It provides a standardized way to retrieve various types of analytics metrics
* and allows dynamic filtering based on parameters.
*
* Leveraging `@tanstack/react-query`, this hook handles data fetching, caching,
* background updates, error handling, and loading states efficiently, reducing boilerplate
* in components. It integrates with a global API client and a toast notification system.
*
* @template TMetric The specific type of analytics metric (e.g., 'userActivity').
* @template TData The expected data structure type for the chosen metric, extending AnalyticsData.
* @param {UseAnalyticsParams<TMetric, TData>} params - Configuration parameters for the hook.
* @returns {object} An object containing the fetched data, current filters, various loading/error states, and functions to interact with the data.
*
* @property {TData | undefined} data - The successfully fetched analytics data. Undefined if loading or an error occurred.
* @property {AnalyticsQueryFilters} filters - The current filter state used for the data query.
* @property {boolean} isLoading - True if the query is currently loading for the first time (no data in cache or initial fetch).
* @property {boolean} isFetching - True if the query is currently fetching data, including background refetches.
* @property {boolean} isInitialLoading - True only during the very first fetch of this specific query key instance.
* @property {boolean} isPlaceholderData - True if the data being shown is from a previous fetch while a new fetch is ongoing.
* @property {ApiError | null} error - An error object if the query failed, otherwise null.
* @property {(newFilters: AnalyticsQueryFilters) => void} setFilters - Function to update the filter state, which triggers a new data fetch.
* @property {() => Promise<void>} refetch - Function to manually trigger a data refetch.
*/
export function useAnalytics<TMetric extends AnalyticsMetric, TData extends AnalyticsData<TMetric>>({
metric,
initialFilters = {}, // Default to an empty filter object if none provided
queryKeyParts = [], // Default to an empty array for additional query key parts
enabled = true, // Default the enabled state to true
queryOptions, // Accept custom query options from the consumer
}: UseAnalyticsParams<TMetric, TData>) {

// --- State Management ---

// useState hook to manage the current filter parameters applied to the analytics query.
// This state is local to the hook instance and controls the `filters` part of the query key.
const [filters, setFilters] = useState<AnalyticsQueryFilters>(initialFilters);

// Integrate the useToast hook for displaying user-friendly error messages.
// The toast instance is stable across renders.
const { toast } = useToast();

// --- Query Key Construction and Memoization ---

// Define the core parts of the React Query key.
// React Query uses query keys to identify and cache query results.
// A query key should uniquely represent the data being fetched.
// Including the metric ensures different analytics types have separate caches.
// Including queryKeyParts allows context-specific caching (e.g., by course ID).
const baseQueryKey = ['analytics', metric, ...queryKeyParts];

// Memoize the *full* query key, which includes the dynamic filters state.
// useMemo ensures that the query key object is only recreated when `baseQueryKey`
// (which depends on `metric` and `queryKeyParts`) or the `filters` state changes.
// This is crucial for React Query to correctly identify when a new query needs to be fetched
// or if existing cached data can be used. Changing `filters` will change `queryKeyWithState`,
// triggering React Query to recognize this as a new query instance.
const queryKeyWithState = useMemo(
() => [
...baseQueryKey,
// Stringify the filters object for inclusion in the query key.
// This ensures that changes within the filters object itself (e.g., changing a date)
// correctly invalidate the cache and trigger a refetch. JSON.stringify provides a
// stable string representation for the same filter object content.
JSON.stringify(filters),
] as const, // 'as const' helps TypeScript infer the tuple type for better type safety with React Query keys.
[baseQueryKey, filters] // Dependencies for memoization. Recalculate only if these change.
);

// --- Data Fetching with React Query's useQuery hook ---

// useQuery is the primary tool for fetching and managing server state.
// It returns an object containing the query's state (data, loading status, error, etc.).
const {
data, // The fetched analytics data of type TData.
isLoading, // Boolean: true when the query is first loading AND there is no cached data.
isFetching, // Boolean: true whenever the query is fetching, including background refetches.
error, // Error object if the fetch failed, or null.
refetch, // A function to manually trigger a refetch of the query.
isPlaceholderData, // Boolean: true if data from `placeholderData` option is being shown.
status, // The status of the query: 'idle', 'loading', 'error', 'success'.
// We can also access other states like isSuccess, isError, etc., if needed.
} = useQuery<TData, ApiError>({
// The unique key for this query. React Query uses this for caching.
queryKey: queryKeyWithState,

// The function that performs the actual data fetching.
queryFn: useCallback<QueryFunction<TData, (string | number | AnalyticsQueryFilters)[]>>(async () => {
// Construct the API endpoint URL based on the metric.
// Assuming a RESTful endpoint structure like /api/analytics/{metricType}.
const endpoint = `/api/analytics/${metric}`;
// Create a URL object for easier handling of search parameters.
// Use window.location.origin to ensure a fully qualified URL if endpoint is relative.
const url = new URL(endpoint, window.location.origin);

// Add filter parameters to the URL's search parameters.
// Iterate over the current filters state object.
Object.entries(filters).forEach(([key, value]) => {
// Only add parameters that have a meaningful value (not null, undefined, or empty string).
if (value !== null && value !== undefined && String(value).trim() !== '') {
// Convert the value to a string before adding to URL search params.
// URLSearchParams automatically handles encoding.
url.searchParams.set(key, String(value));
}
});

try {
// Use the injected API client to perform the GET request to the constructed URL.
// The apiClient is expected to handle network errors, non-2xx status codes, etc.,
// and potentially throw an ApiError or similar custom error type.
const response = await apiClient.get(url.toString());

// The apiClient should return the parsed response body directly on success.
// Cast the response to the expected data type TData.
return response as TData;

} catch (apiError) {
// If an error is caught, throw it again so React Query's error handling is triggered.
// Ensure the thrown error is of type ApiError or compatible with the useQuery error type.
console.error(`API Error fetching ${metric} analytics:`, apiError);
// It's good practice to check if the caught error is an ApiError instance
// or wrap it in one if necessary, depending on apiClient implementation.
throw apiError as ApiError;
}
}, [metric, filters, apiClient]), // Dependencies for the queryFn useCallback. Recreate only if metric or filters change. apiClient is assumed stable.

// React Query option: Keep previous successful data visible while a new fetch is happening.
// This prevents the UI from flickering to an empty state during background refetches.
placeholderData: (previousData) => previousData,

// React Query option: Control whether the query is automatically enabled.
// Defaults to true, but can be set to false to manually trigger the fetch later (e.g., with refetch).
enabled: enabled,

// React Query option: Configure stale time. Data is considered "stale" after this duration.
// Stale queries will refetch in the background when a component using the hook mounts or window regains focus.
// Analytics data might not need to be real-time, so a longer stale time (e.g., 5 minutes) is often appropriate to reduce unnecessary requests.
staleTime: 5 * 60 * 1000, // 5 minutes in milliseconds

// React Query option: Configure cache time. Data is removed from the cache after this duration if it's not actively used (no active observers).
// A longer cache time means returning users might see cached data instantly even after closing and reopening the tab, depending on browser behavior.
cacheTime: 30 * 60 * 1000, // 30 minutes in milliseconds

// React Query option: Error handling callback. This function is called when the queryFn throws an error.
// We use this to show a user-friendly toast notification.
onError: useCallback((err: ApiError) => {
console.error(`Failed to fetch ${metric} analytics:`, err);
toast({
title: 'Analytics Error',
// Use the error message from the API if available, otherwise provide a generic one.
description: err.message || `Failed to fetch ${metric} analytics data. Please try again.`,
variant: 'destructive', // Assuming a 'destructive' variant for error toasts in the useToast hook.
// Add a duration for the toast visibility.
duration: 5000, // Show toast for 5 seconds
});
}, [toast, metric]), // Dependencies for the onError callback. Recreate if toast or metric change.

// Spread any additional query options provided by the hook consumer.
// This allows fine-tuning the query behavior from where the hook is used.
...queryOptions,
});

// --- Helper Functions and Callbacks ---

/**
* Callback function to update the filter state.
* This function is memoized using useCallback to ensure it's stable and doesn't cause unnecessary
* re-renders or trigger effect dependencies in consuming components.
* Updating the `filters` state will automatically cause the `queryKeyWithState` to change,
* which in turn tells React Query to execute the `queryFn` with the new filters.
* @param {AnalyticsQueryFilters} newFilters - The new filter state object to merge or replace the current filters.
*/
const updateFilters = useCallback((newFilters: AnalyticsQueryFilters | ((prevFilters: AnalyticsQueryFilters) => AnalyticsQueryFilters)) => {
// Use the functional update form of setFilters to ensure we are working with the latest state,
// especially if multiple updates happen in quick succession.
setFilters(prevFilters => {
// If newFilters is a function, call it with the previous state.
const resolvedFilters = typeof newFilters === 'function' ? newFilters(prevFilters) : newFilters;
// Deep comparison or structural equality might be needed here depending on filter complexity
// to prevent unnecessary state updates and queries if the filter content hasn't actually changed.
// For simplicity here, we assume setting the object is sufficient or filters are simple.
// A more robust solution might involve a deep equality check:
// import isEqual from 'lodash/isEqual';
// if (isEqual(prevFilters, resolvedFilters)) { return prevFilters; } else { return resolvedFilters; }
return resolvedFilters;
});
}, []); // Dependencies are empty because setFilters is guaranteed by React to be stable.

// --- Derived Loading States for Clarity ---
// Provide more granular loading states for better UI feedback.

// isInitialLoading is true only when the hook mounts and starts the very first fetch,
// and there is no data in the cache for this query key.
const isInitialLoading = isLoading && !isFetching;

// --- Return Values ---
// Return an object containing all relevant state, data, and control functions for the component.
return {
// --- Data and State ---
data, // The fetched analytics data (TData | undefined).
filters, // The current filter state (AnalyticsQueryFilters).

// --- Loading and Error Status ---
isLoading, // Basic loading state (true during initial fetch if no cached data).
isFetching, // Indicates *any* fetching activity (initial, background refetch). Useful for showing spinners.
isInitialLoading, // Specific state for the very first load. Useful for showing skeletons/placeholders.
isPlaceholderData, // Indicates if stale data is being shown while fetching. Useful for visual cues.
error, // Any error that occurred during fetching (ApiError | null).
status, // React Query's internal status ('idle', 'loading', 'error', 'success').

// --- Control Functions ---
setFilters: updateFilters, // Function to update filters and trigger a refetch.
refetch, // Function to manually trigger a refetch of the current query.
// Potentially add a function to reset filters to initial state?
// resetFilters: useCallback(() => setFilters(initialFilters), [initialFilters]),
};
}

// --- Detailed Explanation of Concepts, Terms, and Usage ---

/*
### Concept: React Hooks

* **Definition:** Functions that let you "hook into" React features from function components. `useState`, `useEffect`, `useMemo`, `useCallback` are standard React hooks. Custom hooks (like `useAnalytics` or `useToast`) are functions that use other hooks to encapsulate reusable logic.
* **Purpose:** To manage state, side effects, performance optimizations, and reusable logic within functional components without using class components.
* **Real-World Use Cases:** Managing form input state, fetching data from an API, setting up subscriptions, performing animations, encapsulating complex UI logic.

### Concept: @tanstack/react-query (formerly React Query)

* **Definition:** A library for managing server state in React applications. Server state is data that lives outside your application (e.g., in a database via an API) and requires asynchronous operations to fetch, update, and synchronize.
* **Purpose:** Simplifies handling asynchronous data fetching, caching, background updates, error handling, loading states, and data synchronization, significantly reducing the complexity compared to manual fetching with `useEffect` and `useState`.
* **Key Features:**
    * **Caching:** Automatically caches fetched data with configurable stale and cache times.
    * **Background Refetching:** Refetches stale data in the background when components mount or the window regains focus.
    * **Automatic Retries:** Can automatically retry failed requests.
    * **Shared Data:** Components using the same query key share the same cached data, avoiding duplicate fetches.
    * **Devtools:** Provides excellent developer tools for inspecting cache, queries, and mutations.
* **Real-World Use Cases:** Fetching lists of items, retrieving user profiles, saving form data, managing real-time data subscriptions (though often combined with other tools like WebSockets).

### Concept: Query Keys (@tanstack/react-query)

* **Definition:** An array used by React Query to uniquely identify a specific data query.
* **Purpose:** React Query uses the query key to store, retrieve, and manage the cache entry for the data. If two components use the same query key, they will share the same cached data. The key should be serializable.
* **Convention:** Typically an array starting with a string identifier for the data type (e.g., ['todos', 'users', 'analytics']). Additional elements (like IDs, filters, parameters) are added to make the key specific. The order matters. Nested objects should be included carefully (like using `JSON.stringify` for filters) to ensure uniqueness based on content.
* **Real-World Use Cases:** `['todos', todoId]`, `['users', { status: 'active' }]`, `['analytics', metric, JSON.stringify(filters)]`.

### Concept: Query Function (@tanstack/react-query)

* **Definition:** An asynchronous function provided to `useQuery` that is responsible for fetching the actual data from the API or source.
* **Purpose:** Contains the logic to perform the data request (e.g., using `Workspace`, `axios`, or a custom `apiClient`). It should return the fetched data on success or throw an error on failure.
* **Real-World Use Cases:** `async () => { const response = await fetch('/api/data'); return response.json(); }`, `async () => apiClient.get('/users')`.

### Concept: Data Types (Typescript)

* **Definition:** Interfaces or types defining the structure and expected values of data.
* **Purpose:** Provide type safety during development, allowing TypeScript to catch potential errors related to incorrect data usage. They serve as documentation for the shape of data.
* **Real-World Use Cases:** `interface User { id: number; name: string; email: string; }`, `type AnalyticsMetric = 'userActivity' | 'examStats';`, `interface AnalyticsQueryFilters { startDate?: string; endDate?: string; courseId?: number; }`.

### Concept: API Client Utility (`apiClient`)

* **Definition:** A module or class that encapsulates the logic for making API requests.
* **Purpose:** Centralizes configuration (base URL, headers), handles request and response interception (logging, error formatting, token refresh), simplifies making different types of requests (GET, POST, PUT, DELETE), and provides consistent error handling.
* **Real-World Use Cases:** Using libraries like Axios or creating a wrapper around the native `Workspace` API.

### Concept: Toast Notifications (`useToast`)

* **Definition:** A UI pattern for displaying small, non-intrusive messages to the user, often used for feedback like success messages, warnings, or errors.
* **Purpose:** Provides asynchronous feedback without interrupting the user's workflow or requiring them to close a modal/dialog.
* **Real-World Use Cases:** "Item saved successfully!", "Failed to delete item.", "New message received.".

### Code Structure and Segmentation

* **`src/hooks/`:** Standard directory convention for placing custom React hooks that encapsulate reusable logic.
* **`useAnalytics.ts`:** File name clearly indicates its purpose and it's a React hook.
* **Imports:** Grouped logically (React, Library, App-specific).
* **Interfaces:** Defined before the hook implementation for clarity.
* **Hook Implementation (`export function useAnalytics(...)`)**: Contains the core logic using other hooks.
* **State Management (`useState`)**: Clearly identifies variables holding component/hook state.
* **Query Key Construction (`useMemo`)**: Logic for creating the unique key.
* **Data Fetching (`useQuery`, `useCallback`)**: Logic for performing the async operation. `useCallback` is used around `queryFn` to give `useQuery` a stable function reference if filters were managed externally, though in this case, `useMemo` on the key is the primary trigger. It's still good practice for potential external dependencies.
* **Helper Functions (`useCallback`)**: Memoized functions returned by the hook or used internally.
* **Return Value**: Clearly lists what the hook provides to consumers.
* **In-Code Comments**: Extensively explain each section, variable, function, and logic block.

### CSS Clamping (Not applicable to this file)

* **Definition:** A CSS technique using the `clamp()` function to define a responsive value that is "clamped" between a minimum and maximum size.
* **Syntax:** `clamp(min, preferred, max)` - the browser uses the `preferred` value as long as it's between `min` and `max`. If `preferred` is less than `min`, `min` is used. If `preferred` is greater than `max`, `max` is used.
* **Purpose:** To create fluid typography or spacing that scales with the viewport, but never gets too small or too large.
* **Real-World Use Cases:** `font-size: clamp(1rem, 2.5vw, 2rem);` (font size scales, but stays between 1rem and 2rem).

### CDN (Content Delivery Network) (Not applicable to this file)

* **Definition:** A geographically distributed network of servers used to deliver web content (like CSS, JavaScript, images) to users based on their location.
* **Purpose:** To improve website loading speed and reduce server load by serving static assets from a server closer to the user.
* **Real-World Use Cases:** Including popular libraries like React, Bootstrap, or jQuery via a public CDN like `cdnjs.com`, `unpkg.com`, or Google Hosted Libraries.

### Micro-Interaction Scripting (Supported by Hook Output)

* **Definition:** Small, often subtle, animations or visual feedback triggered by user actions or state changes (like loading data).
* **Purpose:** Enhance the user experience by providing immediate feedback and making the interface feel more responsive and intuitive.
* **How this hook supports it:** The hook provides `isLoading`, `isFetching`, `isInitialLoading`, and `error` states. A component consuming this hook can use these boolean flags to conditionally render:
    * Loading spinners (`isFetching`).
    * Skeletons or initial loading indicators (`isInitialLoading`).
    * Error messages or UI adjustments (`error`).
    * Disabled states for buttons that trigger refetches (`isFetching`).

### Optimal Logic Coding in this Hook

* **React Query:** Using a dedicated library for server state is optimal for handling async logic complexities.
* **Memoization (`useMemo`, `useCallback`)**: Prevents unnecessary recalculations and ensures stable function/object references, which is important for React's rendering and hook dependencies.
* **Query Key Design:** Including metric, context parts, and filters in the key ensures correct caching and refetching behavior. Using `JSON.stringify` for filters ensures structural changes trigger updates.
* **`placeholderData`:** Provides a better user experience by keeping old data visible during refetches.
* **`enabled` Option:** Allows conditional fetching, preventing unnecessary requests.
* **`onError` Callback:** Centralized error handling and user notification.
* **Functional State Updates:** Using `setFilters(prevFilters => ...)` is safer for updates that depend on the previous state.
* **Exposing Granular States:** Returning `isLoading`, `isFetching`, `isInitialLoading`, `isPlaceholderData` gives consuming components detailed control over UI feedback.
* **Extensibility (`queryOptions`):** Allowing consumers to pass custom React Query options makes the hook highly flexible without adding excessive internal complexity.

### Real-World Use Cases for `useAnalytics`

1.  **Dashboard Widgets:** Fetching and displaying various analytics charts or summaries (e.g., active users today, course completion rates, exam pass/fail stats) on a dashboard page. Each widget might use an instance of `useAnalytics` with a different `metric`.
2.  **Course Analytics Page:** Displaying detailed analytics for a specific course. The `queryKeyParts` would include the `courseId`, and filters might allow selecting date ranges or specific student groups.
3.  **User Profile - Activity Tab:** Showing a specific user's activity history or progress metrics. The `queryKeyParts` would include the `userId`, and filters might allow sorting or date range selection.
4.  **Reporting Module:** Powering dynamic reports where users can select metrics and apply filters (date ranges, courses, etc.). Updating the filter UI would call `setFilters`, automatically triggering a new data fetch via the hook.
5.  **Admin Panels:** Providing administrators with insights into platform usage, performance, or user behavior trends.

This hook encapsulates the complexity of data fetching and state management for analytics, providing a clean and reusable interface for components.

*/