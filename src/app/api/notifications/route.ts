import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, createDoc, updateDoc, deleteDoc, getDocByField } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import { sendPushNotification } from '@/lib/fcm'

/**
 * Carsai Mozambique — Notifications API
 *
 * GET:  Fetch notifications for a user (with optional filters)
 * POST: Create a new notification (with web + email + push channels)
 * PUT:  Mark notifications as read / update preferences
 * DELETE: Delete a notification
 */

// ── GET: Fetch notifications for a user ──
export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, error: adminError },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Build filters
    const filters: Array<{ field: string; op: any; value: any }> = [
      { field: 'userId', op: '==', value: userId },
    ]

    if (unreadOnly) {
      filters.push({ field: 'isRead', op: '==', value: false })
    }

    if (type) {
      filters.push({ field: 'type', op: '==', value: type })
    }

    // Get notifications
    const notifications = await safeQueryDocs('notifications', filters, 'createdAt', 'desc', limit + offset)

    // Get user notification preferences
    const prefs = await safeGetDoc('notification_preferences', userId)

    // Get unread count
    const allUnread = await safeQueryDocs('notifications', [
      { field: 'userId', op: '==', value: userId },
      { field: 'isRead', op: '==', value: false },
    ])

    return NextResponse.json({
      success: true,
      notifications: serializeFirestore(notifications.slice(offset, offset + limit)),
      unreadCount: allUnread.length,
      preferences: prefs ? serializeFirestore(prefs) : null,
    })
  } catch (error) {
    console.error('[Notifications] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar notificações' },
      { status: 500 }
    )
  }
}

// ── POST: Create a new notification ──
export async function POST(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, error: adminError },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      userId,
      type = 'info',
      title,
      message,
      link,
      channels, // { web: true, email: true, push: true }
      sendEmail, // Legacy: if true, send email
    } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'userId, title e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Get user notification preferences
    const prefs = await safeGetDoc('notification_preferences', userId)
    const defaultChannels = { web: true, email: false, push: true }
    const userPrefs = prefs?.channels || defaultChannels

    // Merge: if channels specified in request, use those; otherwise use user preferences
    const effectiveChannels = channels || userPrefs

    // Create the notification in Firestore
    const notificationId = await createDoc('notifications', {
      userId,
      type, // info, success, warning, error
      title,
      message,
      link: link || null,
      isRead: false,
      channels: effectiveChannels,
      createdAt: new Date(),
    })

    // Send push notification if enabled
    if (effectiveChannels.push) {
      try {
        await sendPushNotification(userId, {
          title,
          body: message,
          clickAction: link || 'OPEN_APP',
        })
      } catch (pushErr) {
        console.warn('[Notifications] Push notification failed:', pushErr)
      }
    }

    // Send email notification if enabled
    if (effectiveChannels.email || sendEmail) {
      try {
        // Get user email
        const user = await safeGetDoc('users', userId)
        if (user?.email) {
          await sendNotificationEmail(user.email, title, message, link)
        }
      } catch (emailErr) {
        console.warn('[Notifications] Email notification failed:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      notificationId,
      channels: effectiveChannels,
    })
  } catch (error) {
    console.error('[Notifications] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao criar notificação' },
      { status: 500 }
    )
  }
}

// ── PUT: Update notifications (mark as read, update preferences) ──
export async function PUT(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, error: adminError },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { action, userId, notificationId, channels } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // ── Update notification preferences ──
    if (action === 'updatePreferences' && channels) {
      const existingPrefs = await safeGetDoc('notification_preferences', userId)

      if (existingPrefs) {
        await updateDoc('notification_preferences', userId, {
          channels,
          updatedAt: new Date(),
        })
      } else {
        // Create preferences document with userId as doc ID
        const prefsDoc = await createDoc('notification_preferences', {
          id: userId,
          userId,
          channels,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // Update the document ID to match userId
        await updateDoc('notification_preferences', prefsDoc, { id: userId })
      }

      return NextResponse.json({
        success: true,
        message: 'Preferências de notificação atualizadas',
        channels,
      })
    }

    // ── Mark a single notification as read ──
    if (action === 'markRead' && notificationId) {
      await updateDoc('notifications', notificationId, {
        isRead: true,
        readAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        message: 'Notificação marcada como lida',
      })
    }

    // ── Mark all notifications as read ──
    if (action === 'markAllRead') {
      const unread = await safeQueryDocs('notifications', [
        { field: 'userId', op: '==', value: userId },
        { field: 'isRead', op: '==', value: false },
      ])

      for (const notif of unread) {
        await updateDoc('notifications', notif.id, {
          isRead: true,
          readAt: new Date(),
        })
      }

      return NextResponse.json({
        success: true,
        message: `${unread.length} notificações marcadas como lidas`,
        count: unread.length,
      })
    }

    // ── Mark a single notification as unread ──
    if (action === 'markUnread' && notificationId) {
      await updateDoc('notifications', notificationId, {
        isRead: false,
        readAt: null,
      })

      return NextResponse.json({
        success: true,
        message: 'Notificação marcada como não lida',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Notifications] PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar notificação' },
      { status: 500 }
    )
  }
}

// ── DELETE: Delete a notification ──
export async function DELETE(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, error: adminError },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'ID da notificação é obrigatório' },
        { status: 400 }
      )
    }

    await deleteDoc('notifications', notificationId)

    return NextResponse.json({
      success: true,
      message: 'Notificação eliminada',
    })
  } catch (error) {
    console.error('[Notifications] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao eliminar notificação' },
      { status: 500 }
    )
  }
}

// ── Email sending helper ──
// Uses a simple SMTP approach or a free email API.
// For production, use a proper email service (SendGrid, Mailgun, etc.)
async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  link?: string | null
): Promise<boolean> {
  try {
    // For now, we use the internal API to send email via a simple endpoint
    // This can be replaced with SendGrid, Mailgun, or any SMTP service
    const emailApiUrl = process.env.EMAIL_API_URL
    const emailApiKey = process.env.EMAIL_API_KEY

    if (!emailApiUrl) {
      console.log('[Notifications] Email API not configured, skipping email send')
      return false
    }

    const APP_NAME = 'Carsai Mozambique'
    const APP_URL = 'https://carsaimz.vercel.app'

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #065f46, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">${APP_NAME}</h1>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #065f46; margin-top: 0;">${title}</h2>
          <p style="color: #374151; line-height: 1.6;">${message}</p>
          ${link ? `<a href="${link}" style="display: inline-block; background: #047857; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px;">Ver Detalhes</a>` : ''}
        </div>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${APP_NAME} · 
            <a href="${APP_URL}" style="color: #047857;">${APP_URL}</a>
          </p>
        </div>
      </div>
    `

    const response = await fetch(emailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(emailApiKey ? { 'Authorization': `Bearer ${emailApiKey}` } : {}),
      },
      body: JSON.stringify({
        from: `"${APP_NAME}" <noreply@carsaimz.vercel.app>`,
        to,
        subject: `${title} — ${APP_NAME}`,
        html: htmlBody,
      }),
    })

    if (!response.ok) {
      console.warn('[Notifications] Email API returned:', response.status)
      return false
    }

    return true
  } catch (error) {
    console.warn('[Notifications] Email send failed:', error)
    return false
  }
}
