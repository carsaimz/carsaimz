/**
 * Carsai Mozambique - Capacitor Back Button Handler
 *
 * In a Capacitor app, the hardware back button on Android defaults to
 * closing the app. This hook intercepts the back button press and
 * navigates to the previous page instead (using browser history).
 *
 * Only activates when running inside a Capacitor native app.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useCapacitorBackButton() {
  const router = useRouter();

  useEffect(() => {
    // Only register in Capacitor native environment
    if (typeof window === 'undefined') return;
    const isCapacitor = !!(
      (window as any).Capacitor ||
      (window as any).capacitor
    );

    if (!isCapacitor) return;

    let cleanup: (() => void) | null = null;

    const setupBackButton = async () => {
      try {
        // Try Capacitor Core plugin first
        const coreApp = (window as any).Capacitor?.Plugins?.App;

        if (coreApp) {
          coreApp.addListener('backButton', () => {
            handleBackPress(router);
          });
          cleanup = () => coreApp.removeAllListeners('backButton');
          return;
        }

        // Try @capacitor/app package (dynamic import without destructuring alias)
        try {
          const appModule = await import('@capacitor/app');
          const appPlugin = appModule.App;
          if (appPlugin) {
            appPlugin.addListener('backButton', () => {
              handleBackPress(router);
            });
            cleanup = () => appPlugin.removeAllListeners('backButton');
          }
        } catch {
          console.warn('[Capacitor] @capacitor/app plugin not available');
        }
      } catch (err) {
        console.warn('[Capacitor] Back button setup failed:', err);
      }
    };

    setupBackButton();

    return () => {
      cleanup?.();
    };
  }, [router]);
}

function handleBackPress(router: ReturnType<typeof useRouter>) {
  // Check if there's history to go back to
  if (window.history.length > 1) {
    router.back();
  } else {
    // If we're at the first page (home), go home instead of closing
    router.push('/home');
  }
}
