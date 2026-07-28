/**
 * Carsai Mozambique — Registration API Route
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
    const { name, email, password, phone, company } = body

    // ── Validation ──
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // ── Check if user already exists ──
    const existingUser = await db.user.findUnique({ where: { email: emailLower } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está registado.' },
        { status: 409 }
      )
    }

    // ── Find default "user" role ──
    const userRole = await db.role.findUnique({ where: { name: 'user' } })

    // ── Create user ──
    const newUser = await db.user.create({
      data: {
        name: name || emailLower.split('@')[0],
        email: emailLower,
        passwordHash: hashPassword(password),
        phone: phone || null,
        company: company || null,
        roleId: userRole?.id || null,
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        roleId: true,
        createdAt: true,
      },
    })

    // ── Fetch role name for response ──
    const role = userRole
      ? { id: userRole.id, name: userRole.name }
      : null

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso!',
        user: {
          ...newUser,
          role,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json(
      { error: 'Falha ao criar conta. Verifique a sua ligação e tente novamente.' },
      { status: 500 }
    )
  }
}
