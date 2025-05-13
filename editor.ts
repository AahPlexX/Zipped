
// src/types/editor.ts

/**
 * Type representing the content structure in the editor.
 * This could be HTML, Markdown, or a more structured format
 * depending on the specific editor implementation.
 */
export type EditorContent = string;

/**
 * Payload structure for saving editor content via API.
 */
export interface SaveContentPayload {
  /**
   * The unique identifier for the content being edited (e.g., lesson ID).
   */
  contentId: string;
  
  /**
   * The content from the editor to be saved.
   */
  content: EditorContent;
  
  /**
   * Optional metadata about the content.
   */
  metadata?: Record<string, any>;
}

/**
 * Options for configuring the editor.
 */
export interface EditorOptions {
  /**
   * Whether the editor should be in read-only mode.
   */
  readonly?: boolean;
  
  /**
   * Whether the editor should display a toolbar.
   */
  showToolbar?: boolean;
  
  /**
   * The height of the editor.
   */
  height?: string | number;
  
  /**
   * Whether the editor should auto-focus on mount.
   */
  autoFocus?: boolean;
  
  /**
   * Placeholder text to display when the editor is empty.
   */
  placeholder?: string;
  
  /**
   * Custom CSS class names to apply to the editor container.
   */
  className?: string;
  
  /**
   * Whether to enable image uploads.
   */
  enableImageUpload?: boolean;
  
  /**
   * List of allowed formatting options in the toolbar.
   */
  allowedFormats?: string[];
}

/* Developed by Luccas A E | 2025 */
