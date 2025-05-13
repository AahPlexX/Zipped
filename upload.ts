
// src/lib/upload.ts

/**
 * Client-side file upload utility
 * Handles file uploads with progress tracking and error handling
 */

// Define types for upload responses
export interface UploadSuccessResponse {
  url: string;
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

// Progress callback type
export type ProgressCallback = (progress: number) => void;

/**
 * Class for handling file uploads
 */
class FileUploadClient {
  /**
   * Uploads a file to the specified endpoint
   * 
   * @param file The file to upload
   * @param endpoint The API endpoint to upload to
   * @param onProgress Optional callback to report upload progress
   * @returns Promise resolving to upload response
   */
  async upload(
    file: File,
    endpoint: string = '/api/upload',
    onProgress?: ProgressCallback
  ): Promise<UploadSuccessResponse> {
    return new Promise((resolve, reject) => {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Set up XMLHttpRequest for upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
      
      // Handle successful completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (err) {
            reject({
              message: 'Failed to parse server response',
              status: xhr.status,
            });
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(errorResponse);
          } catch (err) {
            reject({
              message: 'Upload failed',
              status: xhr.status,
            });
          }
        }
      });
      
      // Handle network errors
      xhr.addEventListener('error', () => {
        reject({
          message: 'Network error occurred during upload',
          status: 0,
        });
      });
      
      // Handle aborted uploads
      xhr.addEventListener('abort', () => {
        reject({
          message: 'Upload was aborted',
          status: 0,
        });
      });
      
      // Initialize request
      xhr.open('POST', endpoint);
      
      // Set auth header (if user is authenticated)
      try {
        const token = this.getAuthToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
      } catch (err) {
        // Continue without auth header if getting token fails
      }
      
      // Send the request
      xhr.send(formData);
    });
  }
  
  /**
   * Get authentication token from local storage or cookie
   * @returns Authentication token if available
   */
  private getAuthToken(): string | null {
    // Check for token in local storage
    const token = localStorage.getItem('auth-token');
    if (token) return token;
    
    // Alternatively, look for token in cookie
    return this.getCookieValue('auth-token');
  }
  
  /**
   * Helper to extract value from a cookie by name
   * @param name Cookie name
   * @returns Cookie value if found, null otherwise
   */
  private getCookieValue(name: string): string | null {
    const matches = document.cookie.match(new RegExp(
      `(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
  }
}

// Create and export a singleton instance
export const fileUploadClient = new FileUploadClient();

/* Developed by Luccas A E | 2025 */
