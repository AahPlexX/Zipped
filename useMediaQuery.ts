// src/hooks/useMediaQuery.ts
// This hook provides a way to detect current screen size/breakpoint based on media queries.
// It helps in creating responsive UIs by allowing components to adapt to different screen sizes.
// Typically uses common breakpoints (e.g., sm, md, lg, xl from Tailwind CSS).
// Developed by Luccas A E | 2025

'use client'; // This hook relies on browser APIs (window.matchMedia)

import { useState, useEffect, useCallback } from 'react';

// Define standard breakpoints (align with Tailwind CSS defaults if possible)
// Tailwind defaults: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  // You can also add max-width queries or specific device features
  // e.g., print: 'print'
  // e.g., touch: '(hover: none) and (pointer: coarse)'
};

export type BreakpointKey = keyof typeof breakpoints;

/**
 * Custom hook that tracks the state of a CSS media query.
 * @param query - The media query string to match (e.g., '(min-width: 768px)').
 * @returns boolean - True if the media query matches, false otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Initial state based on current match (if window is available)
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return false; // Default for SSR or environments without window.matchMedia
  });

  useEffect(() => {
    // Ensure window and matchMedia are available (client-side only)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Handler for when the media query match state changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial state correctly after mount on client
    setMatches(mediaQueryList.matches);

    // Add event listener
    // Using addEventListener for modern browsers, with a fallback for older ones if needed (though unlikely by 2025)
    try {
      mediaQueryList.addEventListener('change', handleChange);
    } catch (e) {
      // Fallback for older browsers that use addListener/removeListener
      if (typeof mediaQueryList.addListener === 'function') {
        mediaQueryList.addListener(handleChange);
      }
    }

    // Cleanup function to remove the event listener on component unmount
    return () => {
      try {
        mediaQueryList.removeEventListener('change', handleChange);
      } catch (e) {
        if (typeof mediaQueryList.removeListener === 'function') {
          mediaQueryList.removeListener(handleChange);
        }
      }
    };
  }, [query]); // Re-run effect if the query string changes

  return matches;
}

/**
 * A more specific hook that returns boolean flags for common breakpoints.
 * @returns Object with boolean flags like isMobile, isTablet, isDesktop.
 */
export function useScreenSize() {
  const isSm = useMediaQuery(breakpoints.sm); // At least 'sm'
  const isMd = useMediaQuery(breakpoints.md); // At least 'md'
  const isLg = useMediaQuery(breakpoints.lg); // At least 'lg'
  const isXl = useMediaQuery(breakpoints.xl); // At least 'xl'
  const is2Xl = useMediaQuery(breakpoints['2xl']); // At least '2xl'

  // Define device categories based on breakpoints
  // These are common interpretations, adjust as needed for your design system.
  // isMobile: typically less than 'sm' or 'md'
  // isTablet: typically 'sm' or 'md' but less than 'lg'
  // isDesktop: typically 'lg' and above

  return {
    isMobile: !isSm, // Example: Screen is smaller than 'sm' (640px)
    isTablet: isSm && !isLg, // Example: Screen is 'sm' or 'md' but smaller than 'lg'
    isDesktop: isLg, // Example: Screen is 'lg' or larger

    // Individual breakpoint flags
    isSmAndUp: isSm,
    isMdAndUp: isMd,
    isLgAndUp: isLg,
    isXlAndUp: isXl,
    is2XlAndUp: is2Xl,

    // Flags for specific ranges (exclusive)
    // isOnlySm: isSm && !isMd,
    // isOnlyMd: isMd && !isLg,
    // isOnlyLg: isLg && !isXl,
    // isOnlyXl: isXl && !is2Xl,
  };
}

// Example usage in a component:
// const { isMobile, isDesktop } = useScreenSize();
// if (isMobile) { /* render mobile view */ }
// if (isDesktop) { /* render desktop view */ }

// const isCustomQueryMatch = useMediaQuery('(max-width: 500px)');