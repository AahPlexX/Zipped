// src/hooks/useEditor.ts

import { useState, useEffect, useCallback } from 'react';
// Assuming existence of a types file for editor content structure and potential saving payloads.
import { EditorContent, SaveContentPayload } from '@/types/editor'; // Import necessary types
// Assuming existence of a robust API client library for saving content.
import { apiClient } from '@/lib/apiClient'; // Import the API client utility
import { ApiError } from '@/types/api'; // Import standardized API error type
// Assuming existence of a custom hook for file uploads, specifically for images in the editor.
import { useUpload } from './useUpload'; // Import the file upload hook
// Assuming a toast notification hook for user feedback
import { useToast } from './useToast'; // Import the toast hook

// Define the parameters for the useEditor hook
interface UseEditorParams {
  /**
   * The API endpoint URL to save the editor content to.
   * Example: '/api/admin/lessons/:lessonId'
   */
  saveEndpoint: string;
  /**
   * The unique identifier for the content being edited (e.g., lesson ID).
   * This will likely be used in the saveEndpoint URL or payload.
   */
  contentId: string;
  /**
   * The initial content to load into the editor.
   * Can be a string (HTML, Markdown, etc.) or a structured object.
   */
  initialContent: EditorContent;
  /**
   * Optional callback function to execute on successful content save.
   */
  onSaveSuccess?: (responseData: any) => void;
  /**
   * Optional callback function to execute on content save error.
   */
  onSaveError?: (error: ApiError) => void;
}

/**
 * A custom React hook for managing the state and actions of a rich text editor.
 * It handles editor content state, saving content via an API,
 * and integrating image uploads within the editor context.
 * It does NOT contain the actual rich text editor implementation,
 * but provides the logic and state management for a component that does.
 *
 * @param {UseEditorParams} params - The parameters for the hook.
 * @returns {object} An object containing editor state, saving status, error, and control functions.
 */
export function useEditor({
  saveEndpoint,
  contentId,
  initialContent,
  onSaveSuccess,
  onSaveError,
}: UseEditorParams) {
  // --- State Management ---

  // State for the current editor content.
  // This state should mirror the content within the actual rich text editor component.
  const [editorContent, setEditorContent] = useState<EditorContent>(initialContent);
  // State to indicate if the content is currently being saved.
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // State to store any error that occurred during saving.
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  // State to track if the content has been modified since the last save.
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // --- Hooks Integration ---

  // Integrate the file upload hook, specifically for handling image uploads
  // that might occur within the rich text editor (e.g., drag-and-drop, paste, or upload button).
  // The `useUpload` hook will manage the upload process state.
  const {
    uploadFile, // Function to initiate a file upload
    isLoading: isUploading, // Uploading status
    uploadProgress, // Upload progress percentage
    error: uploadError, // Upload error
    resetUploadState, // Function to reset the upload state
  } = useUpload(); // Assuming useUpload does not require immediate parameters

  // Integrate the toast notification hook for user feedback
  const { toast } = useToast();

  // --- Effects ---

  // Effect to update the editor content when the initialContent prop changes.
  // This is important if the hook is reused for different contentIds within the same component lifecycle.
  useEffect(() => {
    setEditorContent(initialContent);
    setIsDirty(false); // Reset dirty state when content changes
  }, [initialContent]);

  // --- Helper Functions and Callbacks ---

  /**
   * Updates the internal editor content state. This function should be called
   * by the actual rich text editor component whenever its content changes.
   * It also sets the `isDirty` state to true.
   * @param {EditorContent} newContent - The new content from the editor.
   */
  const handleContentChange = useCallback((newContent: EditorContent) => {
    setEditorContent(newContent);
    setIsDirty(true); // Content has been modified
  }, []); // Dependencies are empty as setEditorContent and setIsDirty are stable

  /**
   * Initiates the process of saving the current editor content to the API.
   * @returns {Promise<any>} A promise that resolves with the API response data on success.
   */
  const saveContent = useCallback(async (): Promise<any> => {
    setIsSaving(true);
    setSaveError(null);

    // Construct the payload to send to the save endpoint.
    // This structure depends on the server-side API expectation.
    const payload: SaveContentPayload = {
      contentId: contentId,
      content: editorContent, // Send the current editor content
      // Add any other relevant data needed for saving (e.g., lesson title, metadata)
      // based on the specific content type (lesson, etc.).
      // For this generic hook, we only include contentId and content.
      // Specific implementations (e.g., useLessonEditor) would extend this payload.
    };

    try {
      // Determine the actual save URL, potentially substituting contentId
      const finalSaveEndpoint = saveEndpoint.replace(':contentId', contentId);

      // Use the platform's API client to perform the PUT or POST request to save content
      // Assumes PUT for updates and POST for creation, but endpoint path is provided.
      const response = await apiClient.put(finalSaveEndpoint, payload); // Or apiClient.post if creating

      setIsSaving(false);
      setIsDirty(false); // Content is no longer dirty after successful save
      setSaveError(null); // Clear any previous errors

      // Trigger success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess(response);
      }

      // Show success toast notification
      toast({
        title: 'Content Saved',
        description: 'Your changes have been successfully saved.',
        variant: 'success',
      });

      return response; // Return the response data
    } catch (err: any) {
      setIsSaving(false);
      setIsDirty(true); // Content is still dirty if save failed
      const apiError: ApiError = err; // Assuming error is an ApiError type
      setSaveError(apiError);

      // Trigger error callback if provided
      if (onSaveError) {
        onSaveError(apiError);
      }

      // Show error toast notification
      toast({
        title: 'Error Saving Content',
        description: apiError.message || 'An unexpected error occurred while saving.',
        variant: 'destructive',
      });

      // Rethrow the error so consuming code can handle it if needed
      throw apiError;
    }
  }, [saveEndpoint, contentId, editorContent, onSaveSuccess, onSaveError, toast]); // Include dependencies

  /**
   * Handles image uploads initiated within the editor.
   * This function would be passed to the rich text editor component
   * as a callback for image upload events.
   * It uses the `useUpload` hook to perform the actual upload.
   * @param {File} file - The image file to upload.
   * @returns {Promise<string>} A promise that resolves with the URL of the uploaded image on success.
   */
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      // Use the uploadFile function from the useUpload hook
      const result = await uploadFile(file); // useUpload is expected to return the URL or identifier on success

      // Assuming the result contains the URL of the uploaded image
      // Adjust based on the actual return type of useUpload.uploadFile
      const imageUrl = result?.url; // Example: result might be { url: '...' }

      if (!imageUrl) {
        // Handle cases where uploadFile succeeds but doesn't return a usable URL
        throw new Error('Image upload succeeded, but no URL was returned.');
      }

      // Reset upload state after successful upload
      resetUploadState();

      // Return the image URL, which the editor component can then use to insert the image.
      return imageUrl;
    } catch (err: any) {
      // uploadFile is expected to handle its own error reporting (e.g., via toast),
      // but we catch here to re-throw for the editor component to handle if needed.
      // Reset upload state after error
      resetUploadState();
      throw err; // Re-throw the upload error
    }
  }, [uploadFile, resetUploadState]); // Include dependencies

  // --- Return Values ---

  return {
    // State
    editorContent, // Current content of the editor
    isSaving, // Whether content is currently being saved
    saveError, // Any error during saving
    isDirty, // Whether content has unsaved changes

    // Upload State (from useUpload hook)
    isUploading, // Whether an image is currently being uploaded
    uploadProgress, // Progress of the current image upload
    uploadError, // Any error during image upload

    // Control Functions
    setEditorContent: handleContentChange, // Function to update editor content (call from editor component)
    saveContent, // Function to initiate saving
    handleImageUpload, // Function to handle image uploads from the editor
  };
}

/* Developed by Luccas A E | 2025 */