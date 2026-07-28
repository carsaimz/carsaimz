import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// Simple password hashing - can be upgraded to bcrypt later
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// ── Ensure essential roles exist (auto-seed) ──
async function ensureRolesExist() {
  const requiredRoles = ['super_admin', 'admin', 'partner', 'user']
  for (const roleName of requiredRoles) {
    const existing = await db.role.findFirst({ where: { name: roleName } })
    if (!existing) {
      await db.role.create({
        data: { name: roleName, description: `${roleName} role` },
      })
    }
  }
}

export const maxDuration = 30; // Allow up to 30s for DB operations

export async function POST(request: NextRequest) {
  try {
    // ── Auto-seed roles on every registration attempt ──
    await ensureRolesExist()

    const body = await request.json()
    const { name, email, password, phone } = body

    // Validate required fields (Portuguese error messages)
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

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este e-mail' },
        { status: 409 }
      )
    }

    // Find the 'user' role to assign (guaranteed to exist now)
    const userRole = await db.role.findFirst({
      where: { name: 'user' },
    })

    if (!userRole) {
      // This should never happen after ensureRolesExist, but just in case
      console.error('CRITICAL: user role still missing after auto-seed')
      return NextResponse.json(
        { error: 'Erro interno do servidor. Tente novamente mais tarde.' },
        { status: 500 }
      )
    }

    // Create the user
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        phone: phone?.trim() || null,
        roleId: userRole.id,
      },
      include: { role: true },
    })

    // Return user data (without password hash)
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role?.name || 'user',
      },
    })
  } catch (error) {
    console.error('Registration error details:', error)
    // Provide more specific error message based on the error type
    const errorMessage = error instanceof Error 
      ? `Erro: ${error.message}. Por favor, tente novamente.` 
      : 'Falha ao criar conta. Por favor, tente novamente.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
