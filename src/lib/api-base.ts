/**
 * Carsai Mozambique - API Base URL Resolver
 *
 * All API calls use relative paths (same server) by default.
 * No external API URL needed — the app is its own server.
 *
 * For Capacitor mobile apps (static export), the site URL is used
 * as the API server since there's no local server running.
 */

import { SITE_URL } from '@/lib/client-config';

/**
 * Detect if we're running inside a Capacitor native app
 * Capacitor injects a global object when running natively
 */
export function isCapacitorApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).Capacitor ||
    (window as any).capacitor ||
    (window as any).webkit?.messageHandlers?.capacitor
  );
}

/**
 * Detect if we're running inside an Electron desktop app
 */
export function isElectronApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).electronAPI ||
    (window as any).process?.type ||
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

/**
 * Get the API base URL for fetch calls
 * - Web (Next.js server): empty string (relative paths work)
 * - Capacitor (mobile app): SITE_URL (the production server)
 * - Electron: empty string (local server runs within Electron)
 */
export function getApiBaseUrl(): string {
  if (isElectronApp()) {
    // Electron runs the Next.js server locally, relative paths work
    return '';
  }

  if (isCapacitorApp()) {
    // Capacitor static export needs to call the production server
    return SITE_URL.replace(/\/$/, ''); // Remove trailing slash
  }

  // Web (Next.js server running) - relative paths work
  return '';
}

/**
 * Build a full API URL from a relative path
 * Example: buildApiUrl('/api/auth/register') → '/api/auth/register' (web)
 *                                     → 'https://carsai.mz/api/auth/register' (mobile)
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) return path; // Relative path for web/Electron
  return `${base}${path}`;
}
