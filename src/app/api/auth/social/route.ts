/**
 * Carsai Mozambique — Social Auth API Route
 * Handles Google, Facebook, Twitter, GitHub, Microsoft, Apple sign-in.
 *
 * Flow:
 * 1. Client authenticates with Firebase Auth via popup/redirect
 * 2. Client gets ID token from Firebase Auth result
 * 3. Client sends ID token + provider info to this route
 * 4. Server verifies ID token, creates/updates Firestore profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDoc, getDocByField, createDocWithId, updateDoc } from '@/lib/db'
import { safeGetDoc } from '@/lib/db-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken, provider } = body

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token é obrigatório.' },
        { status: 400 }
      )
    }

    // ── Verify the ID token ──
    const auth = getAdminAuth()
    const decodedToken = await auth.verifyIdToken(idToken)
    const uid = decodedToken.uid
    const signInProvider = decodedToken.firebase?.sign_in_provider || provider || 'unknown'

    // ── Get Firebase Auth user record ──
    const authUser = await auth.getUser(uid)

    // ── Check if Firestore profile exists ──
    let userProfile = await getDoc('users', uid)

    if (!userProfile) {
      // ── Create new Firestore profile ──
      const userRole = await getDocByField('roles', 'name', 'user')

      await createDocWithId('users', uid, {
        name: authUser.displayName || authUser.email?.split('@')[0] || 'Utilizador',
        email: authUser.email || '',
        phone: authUser.phoneNumber || null,
        company: null,
        avatar: authUser.photoURL || null,
        bio: null,
        address: null,
        roleId: userRole?.id || null,
        isActive: true,
        emailVerified: authUser.emailVerified,
        authProvider: signInProvider,
      })

      userProfile = await getDoc('users', uid)
    } else {
      // ── Update existing profile with latest auth info ──
      await updateDoc('users', uid, {
        name: authUser.displayName || userProfile.name,
        avatar: authUser.photoURL || userProfile.avatar,
        emailVerified: authUser.emailVerified,
        authProvider: signInProvider,
      })
      userProfile = await getDoc('users', uid)
    }

    // ── Check if user is active ──
    if (!userProfile?.isActive) {
      return NextResponse.json(
        { error: 'A sua conta está desactivada. Contacte o suporte.' },
        { status: 403 }
        )
    }

    // ── Get role — try multiple sources for robustness ──
    let role: any = null
    // 1. Check direct role field (string like 'admin')
    if ((userProfile as any).role) {
      const r = (userProfile as any).role
      role = typeof r === 'string' ? { name: r } : (r?.name ? r : null)
    }
    // 2. Check roleId reference
    if (!role && (userProfile as any).roleId) {
      try {
        const roleDoc = await safeGetDoc('roles', (userProfile as any).roleId)
        if (roleDoc) role = { id: (roleDoc as any).id, name: (roleDoc as any).name }
      } catch (roleErr) {
        console.warn('[Social Auth] Role lookup failed for roleId:', (userProfile as any).roleId, roleErr)
      }
    }

    return NextResponse.json({
      message: 'Login realizado com sucesso!',
      user: {
        id: uid,
        name: userProfile.name,
        email: userProfile.email,
        avatar: userProfile.avatar || null,
        phone: userProfile.phone || null,
        company: userProfile.company || null,
        role,
        isActive: userProfile.isActive,
        emailVerified: authUser.emailVerified,
        authProvider: signInProvider,
      },
    })
  } catch (error: any) {
    console.error('[SOCIAL AUTH ERROR]', error)

    const errorCode = error.errorInfo?.code || error.code || ''
    let errorMsg = 'Falha na autenticação social. Tente novamente.'

    if (errorCode === 'auth/id-token-expired') {
      errorMsg = 'Sessão expirada. Faça login novamente.'
    } else if (errorCode === 'auth/invalid-id-token') {
      errorMsg = 'Token inválido.'
    } else if (errorCode.includes('not configured')) {
      errorMsg = 'Serviço de autenticação não configurado.'
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
