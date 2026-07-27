'use client';

import { useCapacitorBackButton } from '@/hooks/use-capacitor-back';

/**
 * Capacitor Back Button Handler Component
 *
 * Registers the hardware back button interceptor when running
 * inside a Capacitor native app (Android).
 * On web/Electron, this component does nothing (no-op).
 */
export function CapacitorBackButtonHandler() {
  useCapacitorBackButton();
  return null; // No visual output - just registers the hook
}
