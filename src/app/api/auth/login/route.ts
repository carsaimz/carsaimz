/**
 * Carsai Mozambique — Login API Route
 * Uses Prisma + MySQL directly (no Supabase dependency).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // ── Validation ──
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios.' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // ── Find user ──
    const user = await db.user.findUnique({
      where: { email: emailLower },
      include: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos.' },
        { status: 401 }
      )
    }

    // ── Verify password ──
    if (!user.passwordHash || user.passwordHash !== hashPassword(password)) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos.' },
        { status: 401 }
      )
    }

    // ── Check if user is active ──
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'A sua conta está desactivada. Contacte o suporte.' },
        { status: 403 }
      )
    }

    // ── Return user data (without password hash) ──
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      company: user.company,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      role: user.role
        ? { id: user.role.id, name: user.role.name }
        : null,
      createdAt: user.createdAt,
    }

    return NextResponse.json(
      {
        message: 'Login realizado com sucesso!',
        user: userData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[LOGIN ERROR]', error)
    return NextResponse.json(
      { error: 'Falha ao fazer login. Verifique a sua ligação e tente novamente.' },
      { status: 500 }
    )
  }
}
