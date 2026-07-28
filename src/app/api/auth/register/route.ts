import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// ──────────────────────────────────────────────────────────────────────────────
// Registration API Route — Uses Prisma with local SQLite database
// ──────────────────────────────────────────────────────────────────────────────
// SQLite is always accessible locally (no external connection needed).
// No Supabase dependency — works without any cloud service.
// ──────────────────────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // ── Auto-seed essential roles ──
    const requiredRoles = ['super_admin', 'admin', 'partner', 'user']
    for (const roleName of requiredRoles) {
      const existing = await db.role.findFirst({ where: { name: roleName } })
      if (!existing) {
        await db.role.create({
          data: { name: roleName, description: `${roleName} role` },
        })
      }
    }

    const body = await request.json()
    const { name, email, password, phone } = body

    // ── Validate required fields (Portuguese error messages) ──
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Palavra-passe deve ter pelo menos 8 caracteres' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Introduza um e-mail válido' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // ── Check if email already exists ──
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail' }, { status: 409 })
    }

    // ── Find the 'user' role ──
    const userRole = await db.role.findFirst({ where: { name: 'user' } })

    if (!userRole) {
      return NextResponse.json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' }, { status: 500 })
    }

    // ── Create the user ──
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        phone: phone?.trim() || null,
        roleId: userRole.id,
      },
      include: { role: true },
    })

    // ── Return user data (without password hash) ──
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
    console.error('[Register] Error:', error)

    const errorMessage = error instanceof Error
      ? `Erro: ${error.message}. Por favor, tente novamente.`
      : 'Falha ao criar conta. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com.'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
