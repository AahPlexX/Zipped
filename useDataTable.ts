// src/hooks/useDataTable.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
// Assuming existence of a robust API client library, potentially built upon fetch or a dedicated library like axios,
// configured for the NSBS platform's API endpoints and error handling.
// It should handle authentication headers automatically.
import { apiClient } from '@/lib/apiClient'; // Import the API client utility
// Assuming existence of types for pagination, sorting, filtering, and the data records themselves.
import {
  PaginationState, // Type for current page and page size
  SortingState, // Type for sort column and direction
  FilterState, // Type for filter parameters (string, object, etc.)
  DataTableResponse, // Generic type for API responses from data tables
  ApiError, // Standardized API error type
} from '@/types/api'; // Import necessary types

// Define the parameters for the useDataTable hook
interface UseDataTableParams<TData, TFilters = Record<string, unknown>> {
  /**
   * The API endpoint URL to fetch data from.
   * This endpoint is expected to support pagination, sorting, and filtering via query parameters.
   * Example: '/api/admin/users'
   */
  endpoint: string;
  /**
   * Optional initial state for filtering.
   * @default {}
   */
  initialFilters?: TFilters;
  /**
   * Optional initial state for sorting.
   * @default []
   */
  initialSorting?: SortingState;
  /**
   * Optional initial state for pagination.
   * @default { pageIndex: 0, pageSize: 10 }
   */
  initialPagination?: PaginationState;
  /**
   * Optional query key parts to make the React Query cache key unique.
   * Useful if the same hook is used for different tables or contexts.
   */
  queryKey?: (string | number | TFilters)[];
  /**
   * Whether the data fetching is enabled. Useful for dependent queries.
   * @default true
   */
  enabled?: boolean;
}

/**
 * A custom React hook for managing data table state and fetching data from an API.
 * It provides functionality for pagination, sorting, filtering, and row selection.
 * Leverages React Query for efficient data fetching, caching, and state management.
 *
 * @template TData The type of the data records in the table.
 * @template TFilters The type of the filter object.
 * @param {UseDataTableParams<TData, TFilters>} params - The parameters for the hook.
 * @returns {object} An object containing table data, state, loading/error status, and control functions.
 */
export function useDataTable<TData, TFilters = Record<string, unknown>>({
  endpoint,
  initialFilters = {} as TFilters, // Use type assertion for default empty object
  initialSorting = [],
  initialPagination = { pageIndex: 0, pageSize: 10 },
  queryKey = [],
  enabled = true,
}: UseDataTableParams<TData, TFilters>) {
  // --- State Management ---

  // State for the current pagination parameters (page index and page size)
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  // State for the current sorting parameters (column id and direction)
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  // State for the current filter parameters
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  // State for selected row IDs
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // --- Data Fetching with React Query ---

  // Construct the base query key for React Query
  const baseQueryKey = ['dataTable', endpoint, ...queryKey];

  // Memoize the query key including state dependencies (pagination, sorting, filters)
  // This ensures the query only refetches when these dependencies change.
  const queryKeyWithState = useMemo(
    () => [...baseQueryKey, pagination, sorting, filters],
    [baseQueryKey, pagination, sorting, filters]
  );

  // Use React Query's useQuery hook to fetch data
  const {
    data, // The fetched data from the API
    isLoading, // Boolean indicating if the data is currently being fetched for the first time
    isFetching, // Boolean indicating if the data is currently being fetched (includes background refetches)
    error, // Any error that occurred during fetching
    refetch, // Function to manually refetch the data
    isPlaceholderData, // Indicates if the data is from the cache while a new fetch is in progress
  } = useQuery<DataTableResponse<TData>, ApiError>({
    queryKey: queryKeyWithState, // Use the memoized query key
    // The query function responsible for fetching data from the API
    queryFn: async () => {
      // Construct the URL with query parameters for pagination, sorting, and filtering
      const url = new URL(endpoint, window.location.origin); // Use window.location.origin for robust URL construction

      // Add pagination parameters
      url.searchParams.set('page', pagination.pageIndex.toString());
      url.searchParams.set('pageSize', pagination.pageSize.toString());

      // Add sorting parameters
      if (sorting.length > 0) {
        // Assuming sorting state is an array of { id: string, desc: boolean }
        url.searchParams.set('sortBy', sorting[0].id);
        url.searchParams.set('sortDirection', sorting[0].desc ? 'desc' : 'asc');
      }

      // Add filter parameters
      // Assumes filters is an object where keys are filter names and values are filter values.
      // Adjust this logic based on the actual API filter parameter format.
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Convert non-string values to string for URL search params
          url.searchParams.set(key, String(value));
        }
      });

      // Use the platform's API client to perform the GET request
      const response = await apiClient.get(url.toString());

      // apiClient is expected to throw an error for non-OK responses,
      // which will be caught by React Query and available in the 'error' state.
      return response as DataTableResponse<TData>; // Cast the response to the expected type
    },
    placeholderData: previousData => previousData, // Keep previous data visible while fetching new data
    enabled: enabled, // Control whether the query is enabled
    // Configure stale time and cache time based on data freshness requirements
    // For frequently changing data, a shorter stale time might be appropriate.
    // For less volatile data, longer times can improve performance.
    staleTime: 60 * 1000, // Data is considered stale after 60 seconds
    cacheTime: 5 * 60 * 1000, // Data remains in cache for 5 minutes
  });

  // --- Helper Functions for State Updates ---

  /**
   * Updates the pagination state.
   * @param {PaginationState} newPagination - The new pagination state.
   */
  const updatePagination = useCallback((newPagination: PaginationState) => {
    setPagination(newPagination);
    // Reset row selection when pagination changes, as selected rows might no longer be visible.
    setRowSelection({});
  }, []); // Dependencies are empty as setPagination is stable

  /**
   * Updates the sorting state.
   * @param {SortingState} newSorting - The new sorting state.
   */
  const updateSorting = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    // Reset row selection when sorting changes.
    setRowSelection({});
  }, []); // Dependencies are empty as setSorting is stable

  /**
   * Updates the filter state.
   * @param {TFilters} newFilters - The new filter state.
   */
  const updateFilters = useCallback((newFilters: TFilters) => {
    // When filters change, reset pagination to the first page
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    setFilters(newFilters);
    // Reset row selection when filters change.
    setRowSelection({});
  }, []); // Dependencies are empty as setPagination and setFilters are stable

  /**
   * Updates the row selection state.
   * @param {Record<string, boolean>} newSelection - The new row selection state.
   */
  const updateRowSelection = useCallback((newSelection: Record<string, boolean>) => {
    setRowSelection(newSelection);
  }, []); // Dependencies are empty as setRowSelection is stable

  // --- Return Values ---

  return {
    // Data and State
    data: data?.data || [], // The fetched data records, default to empty array
    pagination, // Current pagination state
    sorting, // Current sorting state
    filters, // Current filter state
    rowSelection, // Current row selection state
    pageCount: data?.meta?.pageCount ?? -1, // Total number of pages from the API response metadata, default to -1 if not available
    totalRecords: data?.meta?.totalRecords ?? -1, // Total number of records from the API response metadata, default to -1

    // Loading and Error Status
    isLoading: isLoading && isFetching, // Primary loading state (initial fetch or background refetch)
    isInitialLoading: isLoading && !isFetching, // Only true during the first data fetch
    isFetching, // Indicates any fetching activity
    error, // Any error that occurred
    isPlaceholderData, // True if showing cached data while fetching new

    // Control Functions
    setPagination: updatePagination, // Function to change pagination
    setSorting: updateSorting, // Function to change sorting
    setFilters: updateFilters, // Function to change filters
    setRowSelection: updateRowSelection, // Function to change row selection
    refetch, // Function to manually refetch data
  };
}

/* Developed by Luccas A E | 2025 */
