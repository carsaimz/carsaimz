/**
 * Carsai Mozambique — Registration API Route
 * Firebase Auth — supports email/password registration.
 * Google/other provider sign-ups go through /api/auth/social route.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { createDoc, createDocWithId, getDocByField } from '@/lib/db'

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

    // ── Check if user already exists in Firestore ──
    const existingUser = await getDocByField('users', 'email', emailLower)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está registado.' },
        { status: 409 }
      )
    }

    // ── Create user in Firebase Auth ──
    const auth = getAdminAuth()
    if (!auth) {
      return NextResponse.json(
        { error: 'Serviço de autenticação não configurado.' },
        { status: 503 }
      )
    }
    const userRecord = await auth.createUser({
      email: emailLower,
      password,
      displayName: name || emailLower.split('@')[0],
      emailVerified: false,
    })

    // ── Find default "user" role ──
    const userRole = await getDocByField('roles', 'name', 'user')

    // ── Create user profile in Firestore ──
    await createDocWithId('users', userRecord.uid, {
      name: name || emailLower.split('@')[0],
      email: emailLower,
      phone: phone || null,
      company: company || null,
      avatar: null,
      bio: null,
      address: null,
      roleId: userRole?.id || null,
      isActive: true,
      emailVerified: false,
      authProvider: 'email',
    })

    // ── Return user data ──
    return NextResponse.json(
      {
        message: 'Conta criada com sucesso!',
        user: {
          id: userRecord.uid,
          name: userRecord.displayName,
          email: userRecord.email,
          role: userRole ? { id: userRole.id, name: userRole.name } : null,
          isActive: true,
          emailVerified: false,
          authProvider: 'email',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[REGISTER ERROR]', error)

    // Translate Firebase Auth error codes
    const errorCode = error.errorInfo?.code || error.code || ''
    let errorMsg = 'Falha ao criar conta. Verifique a sua ligação e tente novamente.'

    if (errorCode === 'auth/email-already-exists') {
      errorMsg = 'Este email já está registado.'
    } else if (errorCode === 'auth/invalid-email') {
      errorMsg = 'Email inválido.'
    } else if (errorCode === 'auth/weak-password') {
      errorMsg = 'Senha demasiado fraca. Use pelo menos 6 caracteres.'
    } else if (errorCode.includes('not configured') || errorCode.includes('credential')) {
      errorMsg = 'Serviço de autenticação não configurado. Contacte o administrador.'
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
