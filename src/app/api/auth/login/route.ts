import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// Simple password hashing - matches the register route's hashing
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { login, password } = body

    // Validate required fields
    if (!login || !login.trim()) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const loginValue = login.trim()

    // Determine if login is email or phone
    const isEmail = loginValue.includes('@')

    // Find user by email or phone
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
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account does not have a password set. Please contact support.' },
        { status: 401 }
      )
    }

    // Validate password
    const hashedInput = hashPassword(password)
    if (hashedInput !== user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      )
    }

    // Return user data (without password hash)
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
      { error: 'Failed to log in. Please try again.' },
      { status: 500 }
    )
  }
}
