'use client';

/**
 * Carsai Mozambique - Loading Overlay Component
 *
 * Full-screen overlay displayed during app initialization/loading.
 * Features the Carsai logo image, animated spinner, localized loading text,
 * and Mozambique flag stripe. Uses framer-motion for fade in/out animation.
 *
 * Usage:
 *   <LoadingOverlay isVisible={isInitializing} />
 */

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' as const }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-auto"
          role="alert"
          aria-live="polite"
          aria-label={t('loading.title')}
        >
          {/* Mozambique flag stripe - top bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-yellow-400 to-green-600" />

          {/* Semi-transparent background */}
          <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-950/80 backdrop-blur-sm" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo image */}
            <div className="relative flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Carsai Mozambique"
                width={180}
                height={180}
                priority
                className="object-contain drop-shadow-lg"
              />
              {/* Subtle glow behind logo */}
              <div className="absolute inset-0 -z-10 blur-2xl bg-blue-600/20 dark:bg-blue-500/20 scale-150" />
            </div>

            {/* Animated spinner */}
            <div className="relative flex items-center justify-center">
              <div className="size-12 rounded-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
            </div>

            {/* Loading text - localized */}
            <p className="text-lg font-medium text-blue-700 dark:text-blue-300 tracking-wide">
              {t('loading.title')}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
