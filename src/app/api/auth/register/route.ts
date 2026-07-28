import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/client-config'

// ──────────────────────────────────────────────────────────────────────────────
// Registration API Route — Uses Supabase JS Client (HTTPS) instead of Prisma
// ──────────────────────────────────────────────────────────────────────────────
//
// Prisma connects directly to Postgres (db.xxx.supabase.co:5432) which is
// blocked by Supabase's firewall. The Supabase JS client works over HTTPS,
// which is always accessible. This route uses:
//
//   1. Service role key → supabase.auth.admin.createUser() for auth signup
//   2. Service role key → supabase.from('users').insert() for profile record
//   3. Anon key fallback → supabase.auth.signUp() if service key isn't set
//
// All operations use HTTPS (no direct Postgres connection needed).
// ──────────────────────────────────────────────────────────────────────────────

export const maxDuration = 30;

// ── Server-side Supabase clients (lazy, only created when keys are valid) ──

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const isServiceKeyValid = supabaseServiceKey.startsWith('eyJ')

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isAnonKeyValid = supabaseAnonKey.startsWith('eyJ')

function getAdminClient() {
  if (!isServiceKeyValid) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Set it in .env or deployment secrets.'
    )
  }
  return createClient(SUPABASE_URL, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getAnonClient() {
  if (!isAnonKeyValid) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. Set it in .env or deployment secrets.'
    )
  }
  return createClient(SUPABASE_URL, supabaseAnonKey)
}

// ── Helper: translate Supabase errors to Portuguese ──

function translateSupabaseError(error: { message: string; status?: number }): string {
  const msg = error.message.toLowerCase()

  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('duplicate')) {
    return 'Já existe uma conta com este e-mail'
  }
  if (msg.includes('password should be') || msg.includes('password must be') || msg.includes('too short')) {
    return 'Palavra-passe deve ter pelo menos 8 caracteres'
  }
  if (msg.includes('invalid email') || msg.includes('email format')) {
    return 'Introduza um e-mail válido'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Limite de registos atingido. Tente novamente mais tarde.'
  }
  return `Erro: ${error.message}. Por favor, tente novamente.`
}

// ── POST handler ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone } = body

    // ── Validate required fields (Portuguese error messages) ──
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Palavra-passe deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Introduza um e-mail válido' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // ── STRATEGY 1: Service role key (server-side, bypasses RLS) ──
    // Use admin.createUser + direct insert into users table.
    // This is the most reliable approach — works even without anon key.

    if (isServiceKeyValid) {
      const adminClient = getAdminClient()

      // Step 1: Check if user already exists in our users table
      const { data: existingUsers, error: checkError } = await adminClient
        .from('users')
        .select('id, email')
        .eq('email', normalizedEmail)
        .limit(1)

      if (checkError) {
        console.error('[Register] Error checking existing user:', checkError)
        // Don't fail here — proceed with auth signup, Supabase will catch duplicates
      }

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'Já existe uma conta com este e-mail' },
          { status: 409 }
        )
      }

      // Step 2: Ensure essential roles exist in the roles table
      const requiredRoles = ['super_admin', 'admin', 'partner', 'user']
      for (const roleName of requiredRoles) {
        const { data: existingRole } = await adminClient
          .from('roles')
          .select('id')
          .eq('name', roleName)
          .limit(1)

        if (!existingRole || existingRole.length === 0) {
          await adminClient.from('roles').insert({
            name: roleName,
            description: `${roleName} role`,
          })
        }
      }

      // Step 3: Get the 'user' role ID
      const { data: userRoleData } = await adminClient
        .from('roles')
        .select('id')
        .eq('name', 'user')
        .limit(1)

      const userRoleId = userRoleData?.[0]?.id || null

      // Step 4: Create auth user via Supabase Auth admin API
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true, // Auto-confirm email (service role can do this)
        user_metadata: {
          name: name.trim(),
          phone: phone?.trim() || undefined,
        },
      })

      if (authError) {
        console.error('[Register] Auth creation error:', authError)
        const translated = translateSupabaseError(authError)
        const status = authError.status === 422 ? 409 : (authError.status || 500)
        return NextResponse.json({ error: translated }, { status })
      }

      // Step 5: Create profile record in the users table
      const profileData = {
        id: authData.user.id, // Use Supabase auth user ID as primary key
        email: normalizedEmail,
        name: name.trim(),
        phone: phone?.trim() || null,
        roleId: userRoleId,
        isActive: true,
        emailVerified: true, // Auto-verified since we used admin.createUser
        passwordHash: null, // Auth handled by Supabase, no need for local hash
      }

      const { data: insertedUser, error: profileError } = await adminClient
        .from('users')
        .insert(profileData)
        .select('id, name, email, phone, roleId')
        .single()

      if (profileError) {
        console.warn('[Register] Profile insert error (auth user still created):', profileError)
        // Auth user was created successfully — profile insert failure is non-critical.
        // The user can still log in via Supabase Auth; profile will be created on first login.
      }

      // Step 6: Return success
      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          role: 'user',
        },
      })
    }

    // ── STRATEGY 2: Anon key (client-compatible, respects RLS) ──
    // Use signUp which creates an auth user and respects Row Level Security.
    // Note: email confirmation may be required depending on Supabase settings.

    if (isAnonKeyValid) {
      const anonClient = getAnonClient()

      const { data, error } = await anonClient.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone?.trim() || undefined,
          },
        },
      })

      if (error) {
        console.error('[Register] Anon signUp error:', error)
        const translated = translateSupabaseError(error)
        return NextResponse.json({ error: translated }, { status: error.status || 500 })
      }

      if (data.user) {
        const meta = data.user.user_metadata || {}
        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            name: meta.name || name.trim(),
            email: normalizedEmail,
            phone: meta.phone || phone?.trim() || null,
            role: 'user',
          },
        })
      }

      // signUp succeeded but no user returned (rare edge case)
      return NextResponse.json(
        { error: 'Registo processado, mas necessita confirmação de e-mail.' },
        { status: 200 }
      )
    }

    // ── No Supabase keys configured at all ──
    console.error('[Register] No Supabase keys configured — cannot register')
    return NextResponse.json(
      {
        error: 'Servidor de autenticação não configurado. Contacte-nos via carsaimozambique@gmail.com',
        errorType: 'auth_not_configured',
      },
      { status: 503 }
    )

  } catch (error) {
    console.error('[Register] Unexpected error:', error)

    const errorMessage = error instanceof Error
      ? `Erro interno: ${error.message}. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com`
      : 'Falha ao criar conta. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com.'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
