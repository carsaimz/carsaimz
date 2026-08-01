/**
 * @deprecated Use `/api/notifications/register-token` instead.
 * This endpoint is kept for backward compatibility only.
 *
 * Carsai Mozambique — FCM Token Registration API
 * Client devices send their FCM push notification tokens here.
 */

import { NextRequest, NextResponse } from 'next/server'
import { registerFCMToken, removeFCMToken } from '@/lib/fcm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, token, action } = body

    if (!uid || !token) {
      return NextResponse.json(
        { error: 'uid e token são obrigatórios.' },
        { status: 400 }
      )
    }

    if (action === 'remove') {
      await removeFCMToken(uid, token)
      return NextResponse.json({ success: true, message: 'Token removido.' })
    }

    await registerFCMToken(uid, token)
    return NextResponse.json({ success: true, message: 'Token registado.' })
  } catch (error) {
    console.error('[FCM] Token registration error:', error)
    return NextResponse.json(
      { error: 'Falha ao registar token.' },
      { status: 500 }
    )
  }
}
