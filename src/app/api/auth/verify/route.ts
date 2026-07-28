/**
 * Carsai Mozambique — Auth Verification Route
 * Verifies a Firebase ID token and returns the user profile.
 * Used by client-side code to validate stored auth state.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDoc, getDocByField, createDocWithId } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token é obrigatório.' },
        { status: 400 }
      )
    }

    const auth = getAdminAuth()
    const decodedToken = await auth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    const userProfile = await getDoc('users', uid)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Perfil de utilizador não encontrado.' },
        { status: 404 }
      )
    }

    let role: any = null
    if (userProfile.roleId) {
      const roleDoc = await getDoc('roles', userProfile.roleId)
      if (roleDoc) role = { id: roleDoc.id, name: roleDoc.name }
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: uid,
        name: userProfile.name,
        email: userProfile.email,
        avatar: userProfile.avatar || null,
        phone: userProfile.phone || null,
        company: userProfile.company || null,
        role,
        isActive: userProfile.isActive,
        emailVerified: decodedToken.email_verified,
        authProvider: decodedToken.firebase?.sign_in_provider || 'unknown',
      },
    })
  } catch (error: any) {
    console.error('[VERIFY ERROR]', error)
    return NextResponse.json(
      { valid: false, error: 'Token inválido ou expirado.' },
      { status: 401 }
    )
  }
}
