/**
 * Carsai Mozambique — Login API Route
 * Firebase Auth — verifies ID token from client-side Firebase Auth.
 *
 * The client authenticates with Firebase Auth directly (email/password, Google, etc.)
 * then sends the ID token to this route for server-side verification
 * and Firestore profile retrieval.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDoc, getDocByField, createDocWithId } from '@/lib/db'
import { safeGetDoc } from '@/lib/db-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken, email, password } = body

    // ── Mode 1: ID token verification (client already authenticated with Firebase) ──
    if (idToken) {
      const auth = getAdminAuth()
      const decodedToken = await auth.verifyIdToken(idToken)
      const uid = decodedToken.uid

      // Get Firestore profile
      const userProfile = await getDoc('users', uid)

      if (!userProfile) {
        // User exists in Firebase Auth but not in Firestore — create profile
        const authUser = await auth.getUser(uid)
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
          authProvider: decodedToken.firebase?.sign_in_provider || 'unknown',
        })

        const role = userRole ? { id: userRole.id, name: userRole.name } : null

        return NextResponse.json({
          message: 'Login realizado com sucesso!',
          user: {
            id: uid,
            name: authUser.displayName || authUser.email?.split('@')[0] || 'Utilizador',
            email: authUser.email || '',
            avatar: authUser.photoURL || null,
            phone: authUser.phoneNumber || null,
            role,
            isActive: true,
            emailVerified: authUser.emailVerified,
            authProvider: decodedToken.firebase?.sign_in_provider || 'unknown',
          },
        })
      }

      // Check if user is active
      if (!userProfile.isActive) {
        return NextResponse.json(
          { error: 'A sua conta está desactivada. Contacte o suporte.' },
          { status: 403 }
        )
      }

      // Get role info — try multiple sources for robustness
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
          console.warn('[Login] Role lookup failed for roleId:', (userProfile as any).roleId, roleErr)
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
          emailVerified: decodedToken.email_verified,
          authProvider: decodedToken.firebase?.sign_in_provider || 'unknown',
        },
      })
    }

    // ── Mode 2: Email/password login (fallback for non-Firebase-auth clients) ──
    if (email && password) {
      // We cannot directly verify email/password with Firebase Admin SDK.
      // The client should use Firebase Auth client SDK for this.
      // This mode is only for backward compatibility during transition.
      return NextResponse.json(
        { error: 'Use Firebase Auth no cliente para login com email/senha. Envie o idToken após autenticação.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'idToken ou credenciais são obrigatórios.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[LOGIN ERROR]', error)

    const errorCode = error.errorInfo?.code || error.code || ''
    let errorMsg = 'Falha ao fazer login. Verifique a sua ligação e tente novamente.'

    if (errorCode === 'auth/id-token-expired') {
      errorMsg = 'Sessão expirada. Faça login novamente.'
    } else if (errorCode === 'auth/invalid-id-token') {
      errorMsg = 'Token inválido. Faça login novamente.'
    } else if (errorCode === 'auth/user-not-found') {
      errorMsg = 'Utilizador não encontrado.'
    } else if (errorCode.includes('not configured') || errorCode.includes('credential')) {
      errorMsg = 'Serviço de autenticação não configurado. Contacte o administrador.'
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
