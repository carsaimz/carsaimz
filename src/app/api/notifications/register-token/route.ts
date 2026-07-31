/**
 * Carsai Mozambique — Push Notification Token Registration API
 *
 * POST: Register an FCM token for push notifications.
 * - Body: token (string), platform ('web' | 'android' | 'ios' | 'windows')
 * - Requires authentication (Bearer token in Authorization header)
 * - Stores the token in the user's Firestore document (users/{uid}/fcmTokens array)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDoc, updateDoc } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // ── Verify authentication ──
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required.' },
        { status: 401 }
      )
    }

    const idToken = authHeader.slice(7) // Remove 'Bearer ' prefix

    const auth = getAdminAuth()
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication service not configured.' },
        { status: 503 }
      )
    }

    let uid: string
    try {
      const decodedToken = await auth.verifyIdToken(idToken)
      uid = decodedToken.uid
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token.' },
        { status: 401 }
      )
    }

    // ── Parse request body ──
    const body = await request.json()
    const { token, platform } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'token is required and must be a string.' },
        { status: 400 }
      )
    }

    const validPlatforms = ['web', 'android', 'ios', 'windows']
    const userPlatform = validPlatforms.includes(platform) ? platform : 'web'

    // ── Get user document ──
    const user = await getDoc('users', uid)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      )
    }

    // ── Update FCM tokens array ──
    const currentTokens: Array<{ token: string; platform: string; registeredAt: string }> = user.fcmTokens || []

    // Avoid duplicates — check if token already exists
    const existingIndex = currentTokens.findIndex((t: any) =>
      typeof t === 'string' ? t === token : t.token === token
    )

    if (existingIndex === -1) {
      // Add new token with platform info
      currentTokens.push({
        token,
        platform: userPlatform,
        registeredAt: new Date().toISOString(),
      })

      await updateDoc('users', uid, { fcmTokens: currentTokens })
    } else {
      // Update existing token's platform and registration date
      currentTokens[existingIndex] = {
        token,
        platform: userPlatform,
        registeredAt: new Date().toISOString(),
      }

      await updateDoc('users', uid, { fcmTokens: currentTokens })
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token registered successfully.',
      platform: userPlatform,
    })
  } catch (error) {
    console.error('[Notifications/RegisterToken] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register FCM token.' },
      { status: 500 }
    )
  }
}
