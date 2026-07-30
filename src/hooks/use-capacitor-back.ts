/**
 * Carsai Mozambique - Capacitor Back Button Handler
 *
 * In a Capacitor app, the hardware back button on Android defaults to
 * closing the app. This hook intercepts the back button press and
 * navigates to the previous page instead.
 *
 * Uses a manual navigation history stack because window.history.length
 * is unreliable in Capacitor (always 1 on fresh app start).
 *
 * Only activates when running inside a Capacitor native app.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ── Navigation history stack (module-level, persists across renders) ──
const navStack: string[] = [];
const MAX_STACK_SIZE = 50;

function pushToStack(path: string) {
  // Don't push duplicates (same route visited twice consecutively)
  if (navStack.length > 0 && navStack[navStack.length - 1] === path) return;
  navStack.push(path);
  // Limit stack size
  if (navStack.length > MAX_STACK_SIZE) {
    navStack.shift();
  }
}

export function useCapacitorBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const hasSetupRef = useRef(false);

  // ── Track navigation history ──
  useEffect(() => {
    pushToStack(pathname);
  }, [pathname]);

  const handleBackPress = useCallback(() => {
    // Pop the current page from the stack
    if (navStack.length > 1) {
      navStack.pop(); // Remove current page
      const previousRoute = navStack[navStack.length - 1];
      router.push(previousRoute);
    } else if (navStack.length === 1) {
      // We're at the "root" of our navigation stack
      // If current path is not home, go home; otherwise stay
      if (pathname !== '/home' && pathname !== '/') {
        router.push('/home');
      }
      // If already at home, do nothing (don't close the app)
    }
  }, [router, pathname]);

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
          coreApp.addListener('backButton', handleBackPress);
          cleanup = () => coreApp.removeAllListeners('backButton');
          return;
        }

        // Try @capacitor/app package (dynamic import)
        try {
          const appModule = await import('@capacitor/app');
          const appPlugin = appModule.App;
          if (appPlugin) {
            appPlugin.addListener('backButton', handleBackPress);
            cleanup = () => appPlugin.removeAllListeners();
          }
        } catch {
          console.warn('[Capacitor] @capacitor/app plugin not available');
        }
      } catch (err) {
        console.warn('[Capacitor] Back button setup failed:', err);
      }
    };

    // Avoid duplicate setup on re-renders
    if (!hasSetupRef.current) {
      hasSetupRef.current = true;
      setupBackButton();
    }

    return () => {
      cleanup?.();
      hasSetupRef.current = false;
    };
  }, [handleBackPress]);
}
