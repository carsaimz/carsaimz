/**
 * Carsai Mozambique — Firebase Cloud Messaging (FCM) Utility
 *
 * Server-side push notification sending via Firebase Admin Messaging.
 * Used in API routes to send notifications to Android/iOS devices.
 *
 * FCM is FREE on the Firebase Spark plan (no limit on messages).
 *
 * Usage:
 * 1. Client registers for push notifications and sends FCM token to server
 * 2. Server stores token in Firestore (users/{uid}/fcmTokens)
 * 3. Server sends notification via getAdminMessaging().send()
 *
 * For Android: google-services.json must be placed in android/app/
 * For Capacitor: use @capacitor/push-notifications plugin
 */

import { getAdminMessaging } from '@/lib/firebase-admin'
import { getDoc, updateDoc } from '@/lib/db'

// ─── Send a push notification to a specific user ───

export async function sendPushNotification(
  uid: string,
  notification: {
    title: string
    body: string
    icon?: string
    clickAction?: string
  },
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const user = await getDoc('users', uid)
    if (!user?.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`[FCM] No FCM tokens for user ${uid}`)
      return false
    }

    const messaging = getAdminMessaging()
    if (!messaging) {
      console.warn('[FCM] Firebase Admin Messaging not configured, skipping push notification')
      return false
    }

    // Normalize tokens: stored tokens may be objects {token, platform, registeredAt}
    // or plain strings — extract the FCM token string in either case.
    const normalizeToken = (t: unknown): string | null => {
      if (typeof t === 'string') return t
      if (t && typeof t === 'object' && 'token' in (t as Record<string, unknown>)) {
        const tokenStr = (t as { token: unknown }).token
        if (typeof tokenStr === 'string') return tokenStr
      }
      return null
    }

    const tokenEntries: Array<{ raw: unknown; normalized: string }> = []
    for (const raw of user.fcmTokens) {
      const normalized = normalizeToken(raw)
      if (normalized) {
        tokenEntries.push({ raw, normalized })
      } else {
        console.warn('[FCM] Skipping un-normalizable token:', raw)
      }
    }

    if (tokenEntries.length === 0) {
      console.log(`[FCM] No valid FCM tokens for user ${uid}`)
      return false
    }

    // Send to all registered tokens for this user
    const results = await Promise.allSettled(
      tokenEntries.map(({ normalized }) =>
        messaging.send({
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: data || {},
          token: normalized,
          android: {
            notification: {
              icon: notification.icon || 'logo',
              clickAction: notification.clickAction || 'OPEN_APP',
            },
          },
          webpush: {
            notification: {
              icon: notification.icon || '/logo.png',
            },
          },
        })
      )
    )

    // Remove invalid tokens (keep the raw entry so Firestore format is preserved)
    const validTokens: unknown[] = []
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        validTokens.push(tokenEntries[i].raw)
      } else {
        console.warn(`[FCM] Invalid token removed:`, tokenEntries[i].raw)
      }
    })

    // Update stored tokens
    if (validTokens.length !== user.fcmTokens.length) {
      await updateDoc('users', uid, { fcmTokens: validTokens })
    }

    return validTokens.length > 0
  } catch (error) {
    console.error('[FCM] Error sending notification:', error)
    return false
  }
}

// ─── Send notification to multiple users ───

export async function sendBulkPushNotification(
  uids: string[],
  notification: {
    title: string
    body: string
    icon?: string
  },
  data?: Record<string, string>
): Promise<number> {
  let successCount = 0

  for (const uid of uids) {
    const sent = await sendPushNotification(uid, notification, data)
    if (sent) successCount++
  }

  return successCount
}

// ─── Register an FCM token for a user ───

export async function registerFCMToken(uid: string, token: string, platform: string = 'web'): Promise<void> {
  const user = await getDoc('users', uid)
  if (!user) return

  const currentTokens: Array<unknown> = user.fcmTokens || []

  // Avoid duplicates — compare against the token string inside objects or plain strings
  const exists = currentTokens.some((t: unknown) =>
    typeof t === 'string' ? t === token : (t as Record<string, unknown>)?.token === token
  )

  if (!exists) {
    currentTokens.push({
      token,
      platform,
      registeredAt: new Date().toISOString(),
    })
    await updateDoc('users', uid, { fcmTokens: currentTokens })
  }
}

// ─── Remove an FCM token ───

export async function removeFCMToken(uid: string, token: string): Promise<void> {
  const user = await getDoc('users', uid)
  if (!user) return

  const updatedTokens = (user.fcmTokens || []).filter((t: unknown) =>
    typeof t === 'string' ? t !== token : (t as Record<string, unknown>)?.token !== token
  )
  await updateDoc('users', uid, { fcmTokens: updatedTokens })
}
