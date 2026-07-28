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
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/client-config'

// Server-only secret — NEVER expose to client-side code
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client-side Supabase (uses anon key, respects Row Level Security)
export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Server-side Supabase (uses service role key, bypasses Row Level Security)
// Used in API routes for unrestricted database operations
export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
