/**
 * Carsai Mozambique - Supabase Client Module
 * 
 * Provides both client-side (anon key, respects RLS) and
 * server-side (service role key, bypasses RLS) Supabase clients.
 * 
 * The client-side client is exported for use in browser components.
 * The server-side client is used in API routes and the db wrapper.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kngwnzvotefivjmaleup.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client-side Supabase (uses anon key, respects Row Level Security)
export const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase (uses service role key, bypasses Row Level Security)
// Used in API routes for unrestricted database operations
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
