'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingOverlay } from '@/components/common/loading-overlay';

/**
 * Client-side layout wrapper that manages the loading overlay.
 *
 * Shows the overlay immediately on mount (before content renders),
 * then hides it when the page content has painted.
 *
 * IMPORTANT: The overlay is ALWAYS hidden after the page paints,
 * even if there are errors. This ensures errors are never hidden
 * behind a loading spinner. The user can see what went wrong.
 *
 * Flow:
 *   1. Mount → show overlay immediately (isLoading = true by default)
 *   2. Content renders → double rAF detects paint → hide overlay
 *   3. Safety timeout (3s) → hide overlay regardless
 *   4. If there's an error, the overlay is already hidden → error visible
 */
export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // ── Safety timeout: maximum 3 seconds ──
    // Ensures the overlay never stays visible indefinitely,
    // even if content rendering is slow or errors occur.
    // This is the KEY: errors should never be hidden behind loading.
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // ── Content readiness check ──
    // Use double requestAnimationFrame to wait for the next paint cycle.
    // This means the DOM has been rendered and the browser has painted.
    // Once painted, we hide the overlay — errors will be visible.
    let rafId: number;
    const checkReady = () => {
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsLoading(false);
        });
      });
    };

    checkReady();

    return () => {
      clearTimeout(safetyTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <LoadingOverlay isVisible={isLoading} />
      {children}
    </>
  );
}
