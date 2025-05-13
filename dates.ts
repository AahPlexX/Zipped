
// src/lib/dates.ts

import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';

/**
 * Formats a date string or Date object to a human-readable string
 * @param date The date to format
 * @param formatString The format string (using date-fns format patterns)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, formatString: string = 'PPP'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) return 'Invalid date';
  
  return format(dateObj, formatString);
}

/**
 * Returns a relative time string (e.g., "2 hours ago")
 * @param date The date to format
 * @param baseDate The base date to compare against (defaults to now)
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string | number, baseDate: Date = new Date()): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) return 'Invalid date';
  
  return formatDistance(dateObj, baseDate, { addSuffix: true });
}

/**
 * Formats a date relative to the current date (e.g., "yesterday", "last Friday")
 * @param date The date to format
 * @param baseDate The base date to compare against (defaults to now)
 * @returns Formatted relative date
 */
export function getRelativeDateString(date: Date | string | number, baseDate: Date = new Date()): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) return 'Invalid date';
  
  return formatRelative(dateObj, baseDate);
}

/**
 * Validates if a string is a valid ISO date string
 * @param dateString The date string to validate
 * @returns Boolean indicating if the date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  return isValid(parseISO(dateString));
}

/**
 * Gets the current date as an ISO string without time information
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getCurrentDateISOString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Adds a specified number of days to a date
 * @param date The base date
 * @param days Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return new Date(dateObj.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Calculates the difference in days between two dates
 * @param dateA First date
 * @param dateB Second date
 * @returns Number of days between the dates
 */
export function getDaysBetween(dateA: Date | string, dateB: Date | string): number {
  const dateObjA = typeof dateA === 'string' ? parseISO(dateA) : new Date(dateA);
  const dateObjB = typeof dateB === 'string' ? parseISO(dateB) : new Date(dateB);
  
  const diffTime = Math.abs(dateObjB.getTime() - dateObjA.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/* Developed by Luccas A E | 2025 */
