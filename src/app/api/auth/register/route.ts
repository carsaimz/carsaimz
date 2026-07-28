import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// Simple password hashing - can be upgraded to bcrypt later
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// ── Timeout helper ──
function withTimeout<T>(promise: Promise<T>, ms: number, fallbackMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(fallbackMessage)), ms)
    promise.then(
      (result) => { clearTimeout(timer); resolve(result) },
      (error) => { clearTimeout(timer); reject(error) }
    )
  })
}

// ── Detect Prisma connection errors ──
function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('can\'t reach database') ||
           msg.includes('connection') ||
           msg.includes('timeout') ||
           msg.includes('econnrefused') ||
           msg.includes('enetunreach')
  }
  return false
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

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // ── Auto-seed roles with timeout ──
    await withTimeout(
      ensureRolesExist(),
      5000,
      'Servidor de base de dados indisponível. Tente novamente mais tarde ou use o login via Supabase.'
    )

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

    // Check if email already exists (with timeout)
    const existingUser = await withTimeout(
      db.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      }),
      5000,
      'Servidor de base de dados indisponível.'
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este e-mail' },
        { status: 409 }
      )
    }

    // Find the 'user' role
    const userRole = await withTimeout(
      db.role.findFirst({ where: { name: 'user' } }),
      5000,
      'Servidor de base de dados indisponível.'
    )

    if (!userRole) {
      return NextResponse.json(
        { error: 'Erro interno do servidor. Tente novamente mais tarde.' },
        { status: 500 }
      )
    }

    // Create the user
    const newUser = await withTimeout(
      db.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: hashPassword(password),
          phone: phone?.trim() || null,
          roleId: userRole.id,
        },
        include: { role: true },
      }),
      5000,
      'Servidor de base de dados indisponível.'
    )

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

    // Specific error for database connection issues
    if (isPrismaConnectionError(error)) {
      return NextResponse.json(
        {
          error: 'Servidor de base de dados indisponível. Por favor, tente novamente mais tarde ou contacte-nos via carsaimozambique@gmail.com',
          errorType: 'database_unavailable',
        },
        { status: 503 }
      )
    }

    const errorMessage = error instanceof Error
      ? `Erro: ${error.message}. Por favor, tente novamente.`
      : 'Falha ao criar conta. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
