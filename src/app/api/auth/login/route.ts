import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // ── Auto-seed roles on login too (belt-and-suspenders) ──
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
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Esta conta não tem palavra-passe definida. Contacte o suporte.' },
        { status: 401 }
      )
    }

    const hashedInput = hashPassword(password)
    if (hashedInput !== user.passwordHash) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Conta desactivada. Contacte o suporte.' },
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Falha ao entrar. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
