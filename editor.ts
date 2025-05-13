
// src/lib/editor.ts

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for the rich text editor
 */
export const editorConfig = {
  // Basic formatting options
  toolbar: [
    'heading',
    '|',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    '|',
    'bulletedList',
    'numberedList',
    '|',
    'blockQuote',
    '|',
    'undo',
    'redo',
  ],
  
  // Disable all other plugins that might include interactive elements
  // or elements not allowed by the platform requirements
  removePlugins: [
    'CKFinderUploadAdapter',
    'CKFinder',
    'EasyImage',
    'Image',
    'ImageCaption',
    'ImageStyle',
    'ImageToolbar',
    'ImageUpload',
    'MediaEmbed',
    'Table',
    'TableToolbar',
    'Link',
    'Markdown',
    'CodeBlock',
  ],
  
  // Style the editor to match the application design
  height: '400px',
  width: '100%',
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * and remove any disallowed elements
 * 
 * @param content The HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(content: string): string {
  // Configure DOMPurify to allow only specific elements and attributes
  const config = {
    ALLOWED_TAGS: [
      // Basic structure
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      // Text formatting
      'b', 'strong', 'i', 'em', 'u', 's', 'strike',
      // Lists
      'ol', 'ul', 'li',
      // Other content elements
      'blockquote', 'pre', 'code', 'div', 'span',
      // Containers
      'section', 'article', 'aside', 'header', 'footer',
    ],
    ALLOWED_ATTR: [
      'id', 'class', 'style',
    ],
    // Forbid any data or event attributes
    FORBID_ATTR: [
      'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown', 'onmouseup',
      'onkeydown', 'onkeypress', 'onkeyup', 'onfocus', 'onblur', 'oninput', 'onchange',
      'ondrag', 'ondrop', 'data-*',
    ],
    // Disallow any URI schemes except for http, https, mailto, and tel
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Additional options
    KEEP_CONTENT: true, // Keep content of disallowed elements
    ADD_TAGS: [], // No additional tags
    ADD_ATTR: [], // No additional attributes
    USE_PROFILES: {
      html: true, // Use the HTML profile
      mathMl: false, // Don't allow MathML
      svg: false, // Don't allow SVG
      svgFilters: false, // Don't allow SVG filters
    },
  };
  
  return DOMPurify.sanitize(content, config);
}

/**
 * Validates that the content meets requirements
 * 
 * @param content The content to validate
 * @returns Object with valid status and error message if invalid
 */
export function validateLessonContent(content: string): { valid: boolean; error?: string } {
  if (!content) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  
  // Strip HTML to get text content for length validation
  const textContent = content.replace(/<[^>]*>/g, '');
  
  if (textContent.trim().length < 50) {
    return { valid: false, error: 'Content must contain at least 50 characters of text' };
  }
  
  // Check for structure - needs at least a heading and paragraphs
  if (!content.includes('<h1') && !content.includes('<h2') && !content.includes('<h3')) {
    return { valid: false, error: 'Content must include at least one heading element' };
  }
  
  if (!content.includes('<p')) {
    return { valid: false, error: 'Content must include at least one paragraph element' };
  }
  
  return { valid: true };
}

/**
 * Creates default template for new lesson content
 * 
 * @param lessonTitle The title of the lesson
 * @returns HTML content for the new lesson
 */
export function createDefaultLessonTemplate(lessonTitle: string): string {
  return `
    <h1>${lessonTitle}</h1>
    
    <h2>Introduction</h2>
    <p>Enter an introduction to the lesson topic here. Establish the purpose and context for the lesson content.</p>
    
    <h2>Main Content</h2>
    <p>Develop the main concepts of the lesson here with clear explanations.</p>
    
    <h3>Key Concept 1</h3>
    <p>Explain the first key concept with examples.</p>
    
    <h3>Key Concept 2</h3>
    <p>Explain the second key concept with examples.</p>
    
    <h2>Real-World Application</h2>
    <p>Provide practical examples of how this knowledge applies in workplace settings.</p>
    
    <h2>Conclusion</h2>
    <p>Summarize the key points covered in this lesson and their significance.</p>
  `;
}

/* Developed by Luccas A E | 2025 */
