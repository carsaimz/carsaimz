/**
 * Carsai Mozambique - Client-Side Configuration
 *
 * Centralizes all public-facing configuration values that are safe
 * to embed in client-side code. These are NOT secrets — they are
 * public endpoints and identifiers.
 *
 * Strategy:
 * - Try NEXT_PUBLIC_* env vars first (for CI/deployment flexibility)
 * - Fall back to hardcoded defaults (so the app works without env vars)
 *
 * ⚠️ NEVER put secrets (service role keys, database passwords) here.
 * ⚠️ Only NEXT_PUBLIC_* values and non-sensitive constants belong here.
 */

// ─── Supabase ───

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://kngwnzvotefivjmaleup.supabase.co';

// The anon key is public-safe (RLS protects the data).
// Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment env,
// or update the fallback below with your project's anon key.
//
// How to get the anon key:
//   1. Go to https://supabase.com/dashboard
//   2. Select your project
//   3. Navigate to Settings → API
//   4. Copy the "anon / public" key (starts with 'eyJ')
//
// The key is a JWT — it always starts with 'eyJ'. If it doesn't,
// the value is invalid or missing and Supabase client auth will be
// skipped in favour of the API-route fallback.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** Returns true if SUPABASE_ANON_KEY looks like a valid JWT (starts with 'eyJ'). */
export const isSupabaseAnonKeyValid = SUPABASE_ANON_KEY.startsWith('eyJ');

// ─── API Base URL (for Capacitor mobile app) ───

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ─── App Version & Build ───

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.2.1';
export const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD || '2';

// ─── Site URLs ───

export const SITE_URL = 'https://carsai.mz';
export const GITHUB_URL = 'https://github.com/carsaimz';
