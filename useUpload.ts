// src/hooks/useUpload.ts

import { useState, useCallback } from 'react';
// Assuming existence of a robust API client library configured for file uploads.
// This might be a separate utility or a method on the main apiClient.
import { fileUploadClient } from '@/lib/upload'; // Import the file upload utility
import { ApiError } from '@/types/api'; // Import standardized API error type
// Assuming existence of a types file for upload response data.
import { UploadSuccessResponse } from '@/types/upload'; // Import necessary types
// Assuming a toast notification hook for user feedback
import { useToast } from './useToast'; // Import the toast hook

// Define the parameters for the useUpload hook
interface UseUploadParams {
  /**
   * The API endpoint URL to upload files to.
   * Example: '/api/upload/images'
   */
  uploadEndpoint?: string;
  /**
   * Optional callback function to execute on successful upload.
   */
  onUploadSuccess?: (responseData: UploadSuccessResponse) => void;
  /**
   * Optional callback function to execute on upload error.
   */
  onUploadError?: (error: ApiError) => void;
}

/**
 * A custom React hook for managing file upload state and initiating uploads.
 * It provides functionality to track upload progress, handle success and error states,
 * and reset the upload state.
 * Designed to be a general-purpose hook for various file upload needs (e.g., images, documents).
 *
 * @param {UseUploadParams} [params] - Optional parameters for the hook.
 * @returns {object} An object containing upload state, progress, error, and control functions.
 */
export function useUpload({
  uploadEndpoint,
  onUploadSuccess,
  onUploadError,
}: UseUploadParams = {}) { // Provide default empty object for optional params
  // --- State Management ---

  // State to indicate if a file upload is currently in progress.
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // State to track the progress of the current upload (0 to 100).
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // State to store any error that occurred during the upload.
  const [uploadError, setUploadError] = useState<ApiError | null>(null);
  // State to store the response data on successful upload.
  const [uploadResponse, setUploadResponse] = useState<UploadSuccessResponse | null>(null);

  // Integrate the toast notification hook for user feedback
  const { toast } = useToast();

  // --- Helper Functions and Callbacks ---

  /**
   * Initiates the file upload process to the configured API endpoint.
   * @param {File} file - The file object to upload.
   * @param {string} [endpointOverride] - Optional endpoint URL to override the hook's default.
   * @returns {Promise<UploadSuccessResponse>} A promise that resolves with the upload response data on success.
   */
  const uploadFile = useCallback(async (
    file: File,
    endpointOverride?: string
  ): Promise<UploadSuccessResponse> => {
    // Validate inputs
    if (!file) {
      const error = new Error('No file provided for upload.') as ApiError; // Cast to ApiError shape
      setUploadError(error);
      toast({
        title: 'Upload Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error; // Re-throw the error
    }

    const targetEndpoint = endpointOverride || uploadEndpoint;

    if (!targetEndpoint) {
      const error = new Error('Upload endpoint is not configured.') as ApiError;
      setUploadError(error);
      toast({
        title: 'Upload Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error; // Re-throw the error
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResponse(null); // Clear previous response

    try {
      // Use the dedicated file upload client utility
      const response = await fileUploadClient.upload(
        targetEndpoint,
        file,
        (progressEvent: ProgressEvent) => {
          // Calculate and update the upload progress
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      setIsUploading(false);
      setUploadProgress(100); // Ensure progress reaches 100% on success
      setUploadError(null);
      setUploadResponse(response); // Store the successful response

      // Trigger success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }

      // Show success toast notification
      toast({
        title: 'Upload Complete',
        description: `${file.name} uploaded successfully.`,
        variant: 'success',
      });

      return response; // Return the response data
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0); // Reset progress on error
      const apiError: ApiError = err; // Assuming error is an ApiError type
      setUploadError(apiError);
      setUploadResponse(null); // Clear successful response on error

      // Trigger error callback if provided
      if (onUploadError) {
        onUploadError(apiError);
      }

      // Show error toast notification
      toast({
        title: 'Upload Failed',
        description: apiError.message || `Failed to upload ${file.name}.`,
        variant: 'destructive',
      });

      // Rethrow the error so consuming code can handle it if needed
      throw apiError;
    }
  }, [uploadEndpoint, onUploadSuccess, onUploadError, toast]); // Include dependencies

  /**
   * Resets the upload state to its initial values.
   * Useful for clearing status after an upload completes or fails.
   */
  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResponse(null);
  }, []); // Dependencies are empty as state setters are stable

  // --- Return Values ---

  return {
    // State
    isUploading, // Whether an upload is in progress
    uploadProgress, // Current upload progress percentage
    uploadError, // Any error during upload
    uploadResponse, // Response data on successful upload
    isUploadComplete: uploadResponse !== null, // Convenience flag

    // Control Functions
    uploadFile, // Function to initiate an upload
    resetUploadState, // Function to reset the upload state
  };
}

/* Developed by Luccas A E | 2025 */
// src/hooks/useUpload.ts

import { useState, useCallback } from 'react';
// Assuming existence of a robust API client library for file uploading.
import { apiClient } from '@/lib/apiClient'; // Import the API client utility
import { ApiError } from '@/types/api'; // Import standardized API error type
// Assuming a toast notification hook for user feedback
import { useToast } from './useToast'; // Import the toast hook

// Interface for the hook return value
interface UseUploadReturn {
  /**
   * Function to upload a file to the server.
   * @param {File} file - The file to upload.
   * @param {string} [endpoint='/api/upload'] - The API endpoint to upload to.
   * @returns {Promise<any>} The server response with the uploaded file information.
   */
  uploadFile: (file: File, endpoint?: string) => Promise<any>;
  
  /**
   * Whether a file is currently being uploaded.
   */
  isLoading: boolean;
  
  /**
   * The current progress of the file upload (0-100).
   */
  uploadProgress: number;
  
  /**
   * Any error that occurred during the file upload.
   */
  error: ApiError | null;
  
  /**
   * Function to reset the upload state to its initial values.
   */
  resetUploadState: () => void;
}

/**
 * A custom React hook for managing file uploads.
 * It handles file upload state, progress tracking, and error handling.
 * 
 * @returns {UseUploadReturn} An object containing upload state, error, and control functions.
 */
export function useUpload(): UseUploadReturn {
  // --- State Management ---
  
  // State to indicate if a file is currently being uploaded.
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to track the progress of the current file upload (0-100).
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // State to store any error that occurred during the upload.
  const [error, setError] = useState<ApiError | null>(null);
  
  // Integrate the toast notification hook for user feedback
  const { toast } = useToast();
  
  /**
   * Resets the upload state to its initial values.
   * This is useful after a successful upload or when an error occurs.
   */
  const resetUploadState = useCallback(() => {
    setIsLoading(false);
    setUploadProgress(0);
    setError(null);
  }, []);
  
  /**
   * Uploads a file to the server, tracking progress and handling errors.
   * @param {File} file - The file to upload.
   * @param {string} [endpoint='/api/upload'] - The API endpoint to upload to.
   * @returns {Promise<any>} The server response with the uploaded file information.
   */
  const uploadFile = useCallback(async (file: File, endpoint = '/api/upload'): Promise<any> => {
    // Reset any previous state
    resetUploadState();
    // Set loading state to true
    setIsLoading(true);
    
    try {
      // Create a FormData object to hold the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Create an XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      // Use a Promise to handle the asynchronous nature of XMLHttpRequest
      const uploadPromise = new Promise<any>((resolve, reject) => {
        // Set up progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        // Set up load event (successful completion)
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (err) {
              // Handle parsing error
              reject({
                message: 'Failed to parse server response',
                status: xhr.status,
                details: err,
              });
            }
          } else {
            // Handle HTTP error
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(errorResponse);
            } catch (err) {
              // If parsing fails, use a generic error
              reject({
                message: 'Upload failed',
                status: xhr.status,
                details: xhr.statusText,
              });
            }
          }
        });
        
        // Set up error event
        xhr.addEventListener('error', () => {
          reject({
            message: 'Network error occurred during upload',
            status: 0,
            details: 'Network error',
          });
        });
        
        // Set up abort event
        xhr.addEventListener('abort', () => {
          reject({
            message: 'Upload was aborted',
            status: 0,
            details: 'Aborted',
          });
        });
        
        // Open and send the request
        xhr.open('POST', endpoint);
        xhr.setRequestHeader('Accept', 'application/json');
        // Don't set Content-Type header, the browser will set it with the correct boundary for FormData
        xhr.send(formData);
      });
      
      // Await the completion of the upload
      const response = await uploadPromise;
      
      // Update state for successful upload
      setIsLoading(false);
      setUploadProgress(100);
      
      // Show success toast notification
      toast({
        title: 'Upload Successful',
        description: 'Your file has been uploaded successfully.',
        variant: 'success',
      });
      
      return response;
    } catch (err: any) {
      // Handle upload error
      setIsLoading(false);
      const apiError: ApiError = err;
      setError(apiError);
      
      // Show error toast notification
      toast({
        title: 'Upload Failed',
        description: apiError.message || 'An unexpected error occurred during upload.',
        variant: 'destructive',
      });
      
      // Rethrow the error so consuming code can handle it if needed
      throw apiError;
    }
  }, [resetUploadState, toast]);
  
  // --- Return Values ---
  
  return {
    // Functions
    uploadFile,
    resetUploadState,
    
    // State
    isLoading,
    uploadProgress,
    error,
  };
}

/* Developed by Luccas A E | 2025 */
