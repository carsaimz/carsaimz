import { NextRequest, NextResponse } from 'next/server'
import { getDoc, updateDoc, getDocByField } from '@/lib/db'
import { createHash } from 'crypto'
import { serializeFirestore } from '@/lib/serialize'

// Simple password hashing - matches auth routes
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')

    if (!email && !userId) {
      return NextResponse.json({ error: 'email or userId is required' }, { status: 400 })
    }

    let user: any = null

    if (email) {
      user = await getDocByField('users', 'email', email)
    } else if (userId) {
      user = await getDoc('users', userId)
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch role
    let roleName = 'user'
    if (user.roleId) {
      const roleDoc = await getDoc('roles', user.roleId)
      if (roleDoc) roleName = roleDoc.name
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        company: user.company,
        bio: user.bio,
        address: user.address,
        role: roleName,
      },
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, phone, company, bio, address, newPassword } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check user exists
    const existingUser = await getDoc('users', userId)

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (company !== undefined) updateData.company = company
    if (bio !== undefined) updateData.bio = bio
    if (address !== undefined) updateData.address = address
    if (newPassword && newPassword.length >= 8) {
      updateData.passwordHash = hashPassword(newPassword)
    }

    await updateDoc('users', userId, updateData)

    // Fetch updated user with role
    const updatedUser = await getDoc('users', userId)
    let roleName = 'user'
    if (updatedUser?.roleId) {
      const roleDoc = await getDoc('roles', updatedUser.roleId)
      if (roleDoc) roleName = roleDoc.name
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        avatar: updatedUser!.avatar,
        phone: updatedUser!.phone,
        company: updatedUser!.company,
        bio: updatedUser!.bio,
        address: updatedUser!.address,
        role: roleName,
        isActive: updatedUser!.isActive,
        emailVerified: updatedUser!.emailVerified,
      },
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
