import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

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

export async function POST(request: NextRequest) {
  try {
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

    // Find user with timeout
    const user = isEmail
      ? await withTimeout(
          db.user.findUnique({
            where: { email: loginValue.toLowerCase() },
            include: { role: true },
          }),
          5000,
          'Servidor de base de dados indisponível.'
        )
      : await withTimeout(
          db.user.findFirst({
            where: { phone: loginValue },
            include: { role: true },
          }),
          5000,
          'Servidor de base de dados indisponível.'
        )

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Esta conta não tem palavra-passe definida. Contacte o suporte via carsaimozambique@gmail.com' },
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
    console.error('Login error:', error)

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

    return NextResponse.json(
      { error: 'Falha ao entrar. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com' },
      { status: 500 }
    )
  }
}
