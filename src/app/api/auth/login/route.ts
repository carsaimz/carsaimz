import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// ──────────────────────────────────────────────────────────────────────────────
// Login API Route — Uses Prisma with local SQLite database
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
    const { login, password } = body

    if (!login || !login.trim()) {
      return NextResponse.json({ error: 'E-mail ou telefone é obrigatório' }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: 'Palavra-passe é obrigatória' }, { status: 400 })
    }

    const loginValue = login.trim()
    const isEmail = loginValue.includes('@')

    // ── Find user by email or phone ──
    const user = isEmail
      ? await db.user.findUnique({
          where: { email: loginValue.toLowerCase() },
          include: { role: true },
        })
      : await db.user.findFirst({
          where: { phone: loginValue },
          include: { role: true },
        })

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Esta conta não tem palavra-passe definida. Contacte o suporte via carsaimozambique@gmail.com' },
        { status: 401 }
      )
    }

    const hashedInput = hashPassword(password)
    if (hashedInput !== user.passwordHash) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Conta desactivada. Contacte o suporte via carsaimozambique@gmail.com' },
        { status: 403 }
      )
    }

    const userRole = user.role?.name || 'user'

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        company: user.company,
        bio: user.bio,
        address: user.address,
        role: userRole,
      },
    })

  } catch (error) {
    console.error('[Login] Error:', error)

    return NextResponse.json(
      { error: 'Falha ao entrar. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com' },
      { status: 500 }
    )
  }
}
