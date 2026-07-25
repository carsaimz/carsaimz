'use client';

import { useEffect, useRef } from 'react';
import { Car } from 'lucide-react';

/**
 * Full-page loader overlay that shows during initial page load.
 * Uses CSS-based hiding to avoid hydration mismatches and
 * React effect setState warnings.
 */
export function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide loader after 1.5 seconds using CSS opacity
    const timer = setTimeout(() => {
      if (loaderRef.current) {
        loaderRef.current.style.opacity = '0';
        loaderRef.current.style.pointerEvents = 'none';
        // Remove from DOM after transition
        setTimeout(() => {
          if (loaderRef.current?.parentNode) {
            loaderRef.current.style.display = 'none';
          }
        }, 300);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-300"
      role="alert"
      aria-label="Loading application"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <Car className="size-12 text-primary animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-semibold">Carsai Moçambique</span>
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    </div>
  );
}
