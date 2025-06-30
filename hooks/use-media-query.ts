// hooks/use-media-query.ts
"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for responsive design that detects when a media query is matched
 * 
 * @param query The media query to check against (e.g. "(max-width: 768px)")
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false to avoid hydration mismatch
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Create the media query
    const media = window.matchMedia(query);
    
    // Initial check
    setMatches(media.matches);
    
    // Define callback for media query changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add event listener
    media.addEventListener("change", listener);
    
    // Cleanup function
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  // Return false during SSR to prevent hydration mismatch
  return mounted ? matches : false;
}