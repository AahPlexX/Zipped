
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price from cents to dollars with currency symbol
 */
export function formatPrice(price: number, options: { currency?: string } = {}) {
  const { currency = 'USD' } = options;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price / 100);
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generates a unique ID with an optional prefix
 */
export function generateId(prefix = '') {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Safely access a nested object property via string path
 */
export function getNestedValue<T = any>(
  obj: Record<string, any>,
  path: string,
  defaultValue: T
): T {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined && current !== null ? current : defaultValue;
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Checks if a URL is external
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
