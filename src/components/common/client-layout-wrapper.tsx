'use client';

import { useState, useEffect } from 'react';
import { LoadingOverlay } from '@/components/common/loading-overlay';

/**
 * Client-side layout wrapper that manages the loading overlay.
 * Shows the overlay for 2-3 seconds on initial page load, then fades out.
 */
export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading overlay for ~2.5 seconds on initial load, then fade out
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LoadingOverlay isVisible={isLoading} />
      {children}
    </>
  );
}
