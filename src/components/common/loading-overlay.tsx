'use client';

/**
 * Carsai Mozambique - Loading Overlay Component
 *
 * Full-screen overlay displayed during app initialization/loading.
 * Features the Carsai logo, animated spinner, and localized loading text.
 * Uses the app's red gradient theme with a Mozambique flag stripe at the top.
 *
 * Usage:
 *   <LoadingOverlay isVisible={isInitializing} />
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';

// ============================================================================
// Props
// ============================================================================

interface LoadingOverlayProps {
  /** Whether the overlay is currently visible */
  isVisible: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  const { t } = useLanguage();
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Handle fade-in/fade-out transitions
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsFadingOut(false);
    } else if (shouldRender) {
      setIsFadingOut(true);
      // Wait for fade-out animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsFadingOut(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      role="alert"
      aria-live="polite"
      aria-label={t('common.loading')}
    >
      {/* Mozambique flag stripe - top bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-yellow-400 to-green-600" />

      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-700" />

      {/* Subtle radial glow behind content */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="relative">
          <img
            src="/logo.png"
            alt="Carsai"
            className="h-24 w-auto drop-shadow-2xl"
          />
          {/* Subtle glow behind logo */}
          <div className="absolute inset-0 -z-10 blur-2xl bg-white/10 scale-150" />
        </div>

        {/* Animated spinner dots */}
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="loading-dot inline-block h-3 w-3 rounded-full bg-white/80 animate-[loading-bounce_1.4s_ease-in-out_infinite]" />
          <span className="loading-dot inline-block h-3 w-3 rounded-full bg-white/80 animate-[loading-bounce_1.4s_ease-in-out_0.2s_infinite]" />
          <span className="loading-dot inline-block h-3 w-3 rounded-full bg-white/80 animate-[loading-bounce_1.4s_ease-in-out_0.4s_infinite]" />
        </div>

        {/* Loading text */}
        <p className="text-white text-lg font-medium tracking-wide">
          {t('common.loading')}
        </p>
      </div>

      {/* Inline keyframes for the bounce animation */}
      <style jsx>{`
        @keyframes loading-bounce {
          0%,
          80%,
          100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
