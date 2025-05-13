
// src/lib/apiClient.ts

import { ApiError } from '@/types/api';

/**
 * Configuration for API requests.
 */
interface RequestConfig extends RequestInit {
  /**
   * Optional query parameters to be appended to the URL.
   */
  params?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * API client for making HTTP requests to the application's API endpoints.
 * Handles common request patterns, error handling, and response formatting.
 */
class ApiClient {
  /**
   * Base URL for API requests. If not provided, requests will be made relative to the current origin.
   */
  private baseUrl: string;

  /**
   * Creates a new ApiClient instance.
   * @param {string} [baseUrl] - Optional base URL for all requests.
   */
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '';
  }

  /**
   * Builds a URL by combining the base URL, path, and query parameters.
   * @param {string} path - The API endpoint path.
   * @param {Record<string, string | number | boolean | undefined | null>} [params] - Optional query parameters.
   * @returns {string} The complete URL string.
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    // Ensure path starts with a slash if it's not an absolute URL
    const normalizedPath = path.startsWith('http') ? path : path.startsWith('/') ? path : `/${path}`;
    const url = new URL(normalizedPath, this.baseUrl || window.location.origin);

    // Add query parameters if they exist
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Makes an HTTP request to the specified endpoint.
   * @param {string} path - The API endpoint path.
   * @param {RequestConfig} [config] - Optional request configuration.
   * @returns {Promise<any>} A promise that resolves to the response data or rejects with an ApiError.
   */
  private async request<T>(path: string, config?: RequestConfig): Promise<T> {
    try {
      const { params, ...fetchConfig } = config || {};
      const url = this.buildUrl(path, params);

      // Ensure headers object exists
      const headers = new Headers(fetchConfig.headers || {});
      
      // Set default headers if not already set
      if (!headers.has('Content-Type') && !(fetchConfig.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
      }

      // Add CSRF token header if it exists in the document
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
      }

      const response = await fetch(url, {
        ...fetchConfig,
        headers,
      });

      // Check if the response is OK (status 200-299)
      if (!response.ok) {
        // Try to parse error response as JSON
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If parsing fails, use a generic error message
          errorData = {
            message: response.statusText || 'An error occurred',
          };
        }

        // Throw a standardized API error
        throw {
          status: response.status,
          message: errorData.message || 'An error occurred',
          details: errorData.details || null,
          data: errorData,
        } as ApiError;
      }

      // For 204 No Content responses, return null
      if (response.status === 204) {
        return null as unknown as T;
      }

      // For all other successful responses, try to parse as JSON
      return await response.json();
    } catch (error) {
      // If error is already an ApiError, rethrow it
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }

      // Otherwise, create a new ApiError
      throw {
        status: 0, // 0 indicates network error or other non-HTTP error
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error,
      } as ApiError;
    }
  }

  /**
   * Makes a GET request to the specified endpoint.
   * @param {string} path - The API endpoint path.
   * @param {RequestConfig} [config] - Optional request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  public async get<T = any>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: 'GET' });
  }

  /**
   * Makes a POST request to the specified endpoint.
   * @param {string} path - The API endpoint path.
   * @param {any} [data] - Optional data to send in the request body.
   * @param {RequestConfig} [config] - Optional request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  public async post<T = any>(path: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: 'POST',
      body: data !== undefined ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    });
  }

  /**
   * Makes a PUT request to the specified endpoint.
   * @param {string} path - The API endpoint path.
   * @param {any} [data] - Optional data to send in the request body.
   * @param {RequestConfig} [config] - Optional request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  public async put<T = any>(path: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: 'PUT',
      body: data !== undefined ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    });
  }

  /**
   * Makes a PATCH request to the specified endpoint.
   * @param {string} path - The API endpoint path.
   * @param {any} [data] - Optional data to send in the request body.
   * @param {RequestConfig} [config] - Optional request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  public async patch<T = any>(path: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: 'PATCH',
      body: data !== undefined ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    });
  }

  /**
   * Makes a DELETE request to the specified endpoint.
   * @param {string} path - The API endpoint path.
   * @param {RequestConfig} [config] - Optional request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  public async delete<T = any>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: 'DELETE' });
  }
}

// Create and export a singleton instance of the ApiClient
export const apiClient = new ApiClient();

/* Developed by Luccas A E | 2025 */
