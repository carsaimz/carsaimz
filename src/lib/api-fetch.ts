/**
 * Carsai Mozambique - API Fetch Wrapper
 *
 * Wraps the native fetch() to automatically prepend the correct API base URL
 * based on the runtime environment (web, Capacitor mobile, Electron desktop).
 *
 * Usage: Just import apiFetch instead of using raw fetch for API calls:
 *   import { apiFetch } from '@/lib/api-fetch';
 *   const res = await apiFetch('/api/auth/register', { method: 'POST', ... });
 *
 * For web and Electron, this behaves exactly like normal fetch (relative paths).
 * For Capacitor (mobile), it prepends the NEXT_PUBLIC_API_URL server address.
 */

import { buildApiUrl } from '@/lib/api-base';

/**
 * API-aware fetch wrapper.
 * Same API as native fetch(), but automatically resolves the URL
 * to the correct base (relative for web/Electron, absolute for mobile).
 */
export async function apiFetch(
  input: string | Request,
  init?: RequestInit
): Promise<Response> {
  // If it's already a Request object, we need to reconstruct it with the new URL
  if (typeof input !== 'string') {
    // Request object - reconstruct with new URL
    const newUrl = buildApiUrl(input.url);
    const newRequest = new Request(newUrl, input);
    return fetch(newRequest, init);
  }

  // String URL - resolve and fetch
  const resolvedUrl = buildApiUrl(input);
  return fetch(resolvedUrl, init);
}

/**
 * Convenience: API fetch with JSON response parsing
 * Throws on non-2xx status codes
 */
export async function apiFetchJson<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await apiFetch(input, init);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
