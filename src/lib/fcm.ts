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

    // Send to all registered tokens for this user
    const results = await Promise.allSettled(
      user.fcmTokens.map((token: string) =>
        messaging.send({
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: data || {},
          token,
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

    // Remove invalid tokens
    const validTokens: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        validTokens.push(user.fcmTokens[i])
      } else {
        console.warn(`[FCM] Invalid token removed: ${user.fcmTokens[i]}`)
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

export async function registerFCMToken(uid: string, token: string): Promise<void> {
  const user = await getDoc('users', uid)
  if (!user) return

  const currentTokens: string[] = user.fcmTokens || []

  // Avoid duplicates
  if (!currentTokens.includes(token)) {
    currentTokens.push(token)
    await updateDoc('users', uid, { fcmTokens: currentTokens })
  }
}

// ─── Remove an FCM token ───

export async function removeFCMToken(uid: string, token: string): Promise<void> {
  const user = await getDoc('users', uid)
  if (!user) return

  const updatedTokens = (user.fcmTokens || []).filter((t: string) => t !== token)
  await updateDoc('users', uid, { fcmTokens: updatedTokens })
}
