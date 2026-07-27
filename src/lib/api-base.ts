/**
 * Carsai Mozambique - API Base URL Resolver
 *
 * In web mode (Next.js SSR), API calls go to relative paths like /api/...
 * In Capacitor mobile app (static export), API calls must go to the
 * actual server URL since there's no local server running.
 *
 * This module resolves the correct base URL based on the environment.
 */

// The production server URL where the Next.js backend runs
// This MUST be set in .env for the mobile app to work
const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
 * - Capacitor (mobile app): NEXT_PUBLIC_API_URL (absolute URL to server)
 * - Electron: empty string (local server runs within Electron)
 */
export function getApiBaseUrl(): string {
  if (isElectronApp()) {
    // Electron runs the Next.js server locally, relative paths work
    return '';
  }

  if (isCapacitorApp()) {
    // Capacitor static export needs to call the external server
    if (!SERVER_URL) {
      console.warn('[API] NEXT_PUBLIC_API_URL not set - mobile app API calls will fail!');
      // Fallback: try relative paths (won't work for static export)
      return '';
    }
    return SERVER_URL.replace(/\/$/, ''); // Remove trailing slash
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
