/**
 * Carsai Mozambique — User Profile API Route
 * Firebase Auth + Firestore
 *
 * Password changes are handled by Firebase Auth (not stored in Firestore).
 * Profile data (name, phone, etc.) is stored in Firestore.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDoc, updateDoc, getDocByField } from '@/lib/db'
import { getAdminAuth } from '@/lib/firebase-admin'

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

    // Build update object with only provided fields (Firestore profile)
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (company !== undefined) updateData.company = company
    if (bio !== undefined) updateData.bio = bio
    if (address !== undefined) updateData.address = address

    // Update Firestore profile
    await updateDoc('users', userId, updateData)

    // Update display name in Firebase Auth if name changed
    if (name) {
      try {
        const auth = getAdminAuth()
        await auth.updateUser(userId, { displayName: name })
      } catch (authErr) {
        console.warn('[Profile] Could not update Firebase Auth displayName:', authErr)
      }
    }

    // Password change via Firebase Auth (NOT stored in Firestore)
    if (newPassword && newPassword.length >= 6) {
      try {
        const auth = getAdminAuth()
        await auth.updateUser(userId, { password: newPassword })
      } catch (authErr: any) {
        console.error('[Profile] Password update failed:', authErr)
        const errorCode = authErr.errorInfo?.code || authErr.code || ''
        if (errorCode === 'auth/weak-password') {
          return NextResponse.json(
            { error: 'Senha demasiado fraca. Use pelo menos 6 caracteres.' },
            { status: 400 }
          )
        }
        // Continue — profile was updated even if password failed
      }
    }

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
