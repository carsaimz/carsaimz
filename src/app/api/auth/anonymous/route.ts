/**
 * Carsai Mozambique — Anonymous Auth API Route
 * Firebase Auth anonymous sign-in — creates a temporary guest account.
 * User can later link their anonymous account with email/password or social provider.
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

    // ── Verify the ID token ──
    const auth = getAdminAuth()
    if (!auth) {
      return NextResponse.json(
        { error: 'Serviço de autenticação não configurado.' },
        { status: 503 }
      )
    }
    const decodedToken = await auth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // ── Check if Firestore profile exists ──
    const userProfile = await getDoc('users', uid)

    if (!userProfile) {
      // ── Create anonymous Firestore profile ──
      await createDocWithId('users', uid, {
        name: 'Visitante',
        email: null,
        phone: null,
        company: null,
        avatar: null,
        bio: null,
        address: null,
        roleId: null,
        isActive: true,
        emailVerified: false,
        authProvider: 'anonymous',
        isAnonymous: true,
      })
    }

    return NextResponse.json({
      message: 'Sessão de visitante iniciada.',
      user: {
        id: uid,
        name: 'Visitante',
        email: null,
        role: null,
        isActive: true,
        emailVerified: false,
        authProvider: 'anonymous',
        isAnonymous: true,
      },
    })
  } catch (error: any) {
    console.error('[ANONYMOUS AUTH ERROR]', error)
    return NextResponse.json(
      { error: 'Falha ao iniciar sessão de visitante.' },
      { status: 500 }
    )
  }
}
