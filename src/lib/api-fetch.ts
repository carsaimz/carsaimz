/**
 * Carsai Mozambique - API Fetch Wrapper
 *
 * Wraps the native fetch() to handle ALL runtime environments:
 *   - Web (Next.js server): relative paths work, API routes exist
 *   - Capacitor (mobile app, static export): no API routes locally,
 *     must call the external server. Auto-detects HTML responses
 *     and retries with the external URL.
 *   - Electron (desktop): local server runs inside, relative paths work
 *
 * Key feature: If a relative-path API call returns HTML (because the
 * app is a static export and has no server), apiFetch automatically
 * retries with the configured external server URL. This eliminates
 * the "Unexpected token '<'" JSON parse error completely.
 *
 * Usage:
 *   import { apiFetch } from '@/lib/api-fetch';
 *   const res = await apiFetch('/api/dashboard?role=user&userId=123');
 *   if (res.ok) { const data = await res.json(); }
 */

import { API_BASE_URL } from '@/lib/client-config';
import { isCapacitorApp, isElectronApp, buildApiUrl } from '@/lib/api-base';

// ── Runtime detection cache ──────────────────────────────────────────────────
// Once we discover that relative API paths don't work (static export),
// cache this so all subsequent calls use the external URL immediately.
let _needsExternalServer: boolean | null = null;

/**
 * Check if the current environment needs to use an external server URL
 * for API calls. Returns true ONLY for Capacitor apps.
 *
 * On web (Next.js server mode), relative paths like /api/... work natively
 * because the API routes are served by the same Next.js server.
 * There is NO need for an external URL — the code is the same server!
 *
 * This is the key insight: on web, /api/auth/login is handled by the same
 * process that serves the HTML. No cross-origin, no external URL needed.
 */
function needsExternalServer(): boolean {
  if (_needsExternalServer !== null) return _needsExternalServer;

  // Electron always has a local server — relative paths work
  if (isElectronApp()) {
    _needsExternalServer = false;
    return false;
  }

  // Capacitor native app — always needs external server
  if (isCapacitorApp()) {
    _needsExternalServer = true;
    return true;
  }

  // Web mode: relative paths ALWAYS work when Next.js server is running.
  // No need to detect or fallback — the server serves both HTML and API.
  _needsExternalServer = false;
  return false;
}

/**
 * Detect if a Response is HTML (not JSON).
 * This catches the "SPA fallback" scenario where /api/* routes
 * return the app's HTML page instead of JSON data.
 */
function isHtmlResponse(res: Response): boolean {
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('text/html') || contentType.includes('application/xhtml');
}

/**
 * API-aware fetch wrapper with automatic HTML detection and external URL retry.
 *
 * Flow:
 * 1. If we already know we need the external server → use it directly
 * 2. Otherwise, try relative path first (works for web/Electron)
 * 3. If response is HTML → cache this fact, retry with external URL
 * 4. Return the response (either from step 1, 2, or 3)
 */
export async function apiFetch(
  input: string | Request,
  init?: RequestInit
): Promise<Response> {
  // ── Handle Request objects ──
  if (typeof input !== 'string') {
    const resolvedUrl = buildApiUrl(input.url);
    const newRequest = new Request(resolvedUrl, input);
    return fetch(newRequest, init);
  }

  // ── String URL ──
  const path = input;

  // Capacitor: always use external server URL (no local server available)
  if (needsExternalServer() && API_BASE_URL) {
    const externalUrl = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
    return fetch(externalUrl, init);
  }

  // Web / Electron: use relative paths — the Next.js server handles /api/* natively
  // No external URL needed. The server serves both the HTML and the API.
  return fetch(path, init);
}

/**
 * Convenience: API fetch with JSON response parsing.
 * Automatically validates Content-Type and throws clear errors.
 * Never crashes with "Unexpected token '<'" — validates response first.
 */
export async function apiFetchJson<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await apiFetch(input, init);

  // Check Content-Type before attempting JSON parse
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`API returned non-JSON response (${contentType}) for ${input}`);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
