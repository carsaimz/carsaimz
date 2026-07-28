/**
 * Carsai Mozambique — Client-Side Configuration
 *
 * Holds only values that are safe to expose in browser code.
 * No Supabase keys — auth is handled entirely via API routes + Prisma + MySQL.
 */

// ─── App version (embedded at build time) ───

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.2.1'
export const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD || '2'

// ─── API base URL ───
// For Capacitor mobile app, set NEXT_PUBLIC_API_URL to your deployed server.
// For local development, leave empty (relative URLs work on same-origin).

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// ─── Site URLs ───

export const SITE_URL = 'https://carsai.mz'
export const GITHUB_URL = 'https://github.com/carsaimz'

// ─── Feature flags ───

export const FEATURES = {
  chat: true,
  forum: true,
  blog: true,
  newsletter: true,
  affiliate: false,
}
