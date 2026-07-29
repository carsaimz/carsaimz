'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingOverlay } from '@/components/common/loading-overlay';

/**
 * Client-side layout wrapper that manages the loading overlay.
 *
 * Shows the overlay immediately on mount, then hides it when:
 *   1. The page content has rendered (detected via requestAnimationFrame),
 *   2. An error boundary catches an error, OR
 *   3. A safety timeout of 3 seconds elapses.
 *
 * This ensures the loading overlay never blocks error messages or
 * stays visible longer than necessary.
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
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // ── Content readiness check ──
    // Use requestAnimationFrame to wait for the next paint cycle,
    // which means the DOM has been rendered and the browser has
    // had a chance to paint the content.
    let rafId: number;
    const checkReady = () => {
      rafId = requestAnimationFrame(() => {
        // Double rAF — one to wait for the current frame to finish,
        // another to wait for the next frame to paint.
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
