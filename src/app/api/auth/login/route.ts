import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/client-config'

// ──────────────────────────────────────────────────────────────────────────────
// Login API Route — Uses Supabase JS Client (HTTPS) instead of Prisma
// ──────────────────────────────────────────────────────────────────────────────
//
// Same problem as register: Prisma direct Postgres connection is blocked by
// Supabase. This route uses Supabase Auth (HTTPS) for login verification,
// then fetches the user profile from the users table via PostgREST (HTTPS).
// ──────────────────────────────────────────────────────────────────────────────

export const maxDuration = 30;

// ── Server-side Supabase clients ──

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const isServiceKeyValid = supabaseServiceKey.startsWith('eyJ')

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isAnonKeyValid = supabaseAnonKey.startsWith('eyJ')

function getAdminClient() {
  if (!isServiceKeyValid) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.')
  }
  return createClient(SUPABASE_URL, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getAnonClient() {
  if (!isAnonKeyValid) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.')
  }
  return createClient(SUPABASE_URL, supabaseAnonKey)
}

// ── Helper: translate Supabase errors to Portuguese ──

function translateSupabaseError(error: { message: string; status?: number }): string {
  const msg = error.message.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Credenciais inválidas'
  }
  if (msg.includes('email not confirmed')) {
    return 'E-mail não confirmado. Verifique a sua caixa de correio.'
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Limite de tentativas atingido. Tente novamente mais tarde.'
  }
  return `Erro: ${error.message}. Por favor, tente novamente.`
}

// ── POST handler ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { login, password } = body

    // ── Validate required fields ──
    if (!login || !login.trim()) {
      return NextResponse.json(
        { error: 'E-mail ou telefone é obrigatório' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Palavra-passe é obrigatória' },
        { status: 400 }
      )
    }

    const loginValue = login.trim()
    const isEmail = loginValue.includes('@')

    // Supabase Auth only supports email login (not phone).
    // For phone login, we look up the email from the users table first.
    let emailForAuth = isEmail ? loginValue.toLowerCase() : ''

    // ── STRATEGY 1: Service role key (server-side, bypasses RLS) ──

    if (isServiceKeyValid) {
      const adminClient = getAdminClient()

      // If login is by phone, find the corresponding email from users table
      if (!isEmail) {
        const { data: phoneUsers } = await adminClient
          .from('users')
          .select('email, isActive')
          .eq('phone', loginValue)
          .limit(1)

        if (!phoneUsers || phoneUsers.length === 0) {
          return NextResponse.json(
            { error: 'Credenciais inválidas' },
            { status: 401 }
          )
        }

        const phoneUser = phoneUsers[0]
        if (!phoneUser.isActive) {
          return NextResponse.json(
            { error: 'Conta desactivada. Contacte o suporte via carsaimozambique@gmail.com' },
            { status: 403 }
          )
        }

        emailForAuth = phoneUser.email
      }

      // Check if account is active before attempting login
      const { data: profileCheck } = await adminClient
        .from('users')
        .select('id, isActive')
        .eq('email', emailForAuth)
        .limit(1)

      if (profileCheck && profileCheck.length > 0 && !profileCheck[0].isActive) {
        return NextResponse.json(
          { error: 'Conta desactivada. Contacte o suporte via carsaimozambique@gmail.com' },
          { status: 403 }
        )
      }

      // Authenticate via Supabase Auth
      const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
        email: emailForAuth,
        password,
      })

      if (authError) {
        console.error('[Login] Auth error:', authError)
        const translated = translateSupabaseError(authError)
        const status = authError.status || 401
        return NextResponse.json({ error: translated }, { status })
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        )
      }

      // Fetch full profile from users table
      const { data: userProfile } = await adminClient
        .from('users')
        .select('id, name, email, phone, avatar, company, bio, address, roleId, isActive')
        .eq('id', authData.user.id)
        .limit(1)

      // Get role name from roles table
      let roleName = 'user'
      if (userProfile && userProfile.length > 0 && userProfile[0].roleId) {
        const { data: roleData } = await adminClient
          .from('roles')
          .select('name')
          .eq('id', userProfile[0].roleId)
          .limit(1)

        if (roleData && roleData.length > 0) {
          roleName = roleData[0].name
        }
      }

      const profile = userProfile?.[0]
      const meta = authData.user.user_metadata || {}

      // Build response — merge auth data with profile data
      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          name: profile?.name || meta.name || authData.user.email,
          email: profile?.email || authData.user.email || emailForAuth,
          phone: profile?.phone || meta.phone || null,
          avatar: profile?.avatar || null,
          company: profile?.company || null,
          bio: profile?.bio || null,
          address: profile?.address || null,
          role: roleName,
        },
      })
    }

    // ── STRATEGY 2: Anon key (client-compatible, respects RLS) ──

    if (isAnonKeyValid) {
      const anonClient = getAnonClient()

      // Phone login requires looking up email first via anon (RLS must allow read)
      if (!isEmail) {
        const { data: phoneUsers } = await anonClient
          .from('users')
          .select('email, isActive')
          .eq('phone', loginValue)
          .limit(1)

        if (!phoneUsers || phoneUsers.length === 0) {
          return NextResponse.json(
            { error: 'Credenciais inválidas' },
            { status: 401 }
          )
        }

        const phoneUser = phoneUsers[0]
        if (!phoneUser.isActive) {
          return NextResponse.json(
            { error: 'Conta desactivada. Contacte o suporte via carsaimozambique@gmail.com' },
            { status: 403 }
          )
        }

        emailForAuth = phoneUser.email
      }

      // Authenticate via Supabase Auth (anon key)
      const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: emailForAuth,
        password,
      })

      if (authError) {
        console.error('[Login] Auth error:', authError)
        const translated = translateSupabaseError(authError)
        return NextResponse.json({ error: translated }, { status: authError.status || 401 })
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        )
      }

      // Fetch profile via anon client (RLS must allow user to read own profile)
      const { data: userProfile } = await anonClient
        .from('users')
        .select('id, name, email, phone, avatar, company, bio, address, roleId, isActive')
        .eq('id', authData.user.id)
        .limit(1)

      const profile = userProfile?.[0]
      const meta = authData.user.user_metadata || {}

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          name: profile?.name || meta.name || authData.user.email,
          email: profile?.email || authData.user.email || emailForAuth,
          phone: profile?.phone || meta.phone || null,
          avatar: profile?.avatar || null,
          company: profile?.company || null,
          bio: profile?.bio || null,
          address: profile?.address || null,
          role: 'user',
        },
      })
    }

    // ── No Supabase keys configured at all ──
    console.error('[Login] No Supabase keys configured — cannot authenticate')
    return NextResponse.json(
      {
        error: 'Servidor de autenticação não configurado. Contacte-nos via carsaimozambique@gmail.com',
        errorType: 'auth_not_configured',
      },
      { status: 503 }
    )

  } catch (error) {
    console.error('[Login] Unexpected error:', error)

    const errorMessage = error instanceof Error
      ? `Erro interno: ${error.message}. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com`
      : 'Falha ao entrar. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com.'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
