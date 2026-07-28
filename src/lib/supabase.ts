/**
 * Carsai Mozambique - Supabase Client Module
 *
 * Provides both client-side (anon key, respects RLS) and
 * server-side (service role key, bypasses RLS) Supabase clients.
 *
 * The client-side client is exported for use in browser components.
 * The server-side client is used in API routes and the db wrapper.
 *
 * Config values are sourced from client-config.ts (env vars with
 * hardcoded fallbacks), keeping public configs client-accessible.
 *
 * ⚠️ Clients are created lazily — only when the key is valid.
 * This prevents "supabaseKey is required" errors during static
 * export builds when the anon key is not configured.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseAnonKeyValid } from '@/lib/client-config'

// Server-only secret — NEVER expose to client-side code
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const isServiceKeyValid = supabaseServiceKey.startsWith('eyJ')

// ─── Lazy client getters ────────────────────────────────────────────────────
// Creating Supabase clients at module level fails when the key is empty
// ("supabaseKey is required"). Instead, we create them on first access,
// only when the key is valid. If the key is invalid, we throw at call time
// with a descriptive error rather than crashing the entire module.

let _supabaseClient: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

/**
 * Client-side Supabase client (anon key, respects Row Level Security).
 * Throws with a helpful message if the anon key is not configured.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    if (!isSupabaseAnonKeyValid) {
      throw new Error(
        'Supabase anon key is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env or update the fallback in client-config.ts.'
      )
    }
    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _supabaseClient!
}

/**
 * Server-side Supabase client (service role key, bypasses Row Level Security).
 * Throws with a helpful message if the service role key is not configured.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!isServiceKeyValid) {
      throw new Error(
        'Supabase service role key is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.'
      )
    }
    _supabaseAdmin = createClient(SUPABASE_URL, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabaseAdmin!
}

// ─── Convenience aliases ────────────────────────────────────────────────────
// For backward compatibility: existing code that imported `supabaseClient`
// or `supabaseAdmin` as constants can use these getters instead.
// These are safe to call at runtime but will NOT crash the module
// during static pre-rendering if the keys are missing.

/** @deprecated Use getSupabaseClient() for explicit lazy initialization */
export const supabaseClient = isSupabaseAnonKeyValid
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null as unknown as SupabaseClient

/** @deprecated Use getSupabaseAdmin() for explicit lazy initialization */
export const supabaseAdmin = isServiceKeyValid
  ? createClient(SUPABASE_URL, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null as unknown as SupabaseClient
