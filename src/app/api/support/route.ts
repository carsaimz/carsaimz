import { NextRequest, NextResponse } from 'next/server'
import { safeGetDoc, safeGetDocs, safeCountDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { serializeFirestore } from '@/lib/serialize'
import { sendEmail, ticketNotificationTemplate, isEmailConfigured } from '@/lib/email'

/**
 * Sort helper — newest first (desc) by createdAt.
 * Handles Firestore Timestamp objects and ISO strings.
 */
function sortByDateDesc(items: any[]): any[] {
  return items.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime() ?? 0
    const bTime = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime() ?? 0
    return bTime - aTime
  })
}

/**
 * Sort helper — oldest first (asc) by createdAt.
 */
function sortByDateAsc(items: any[]): any[] {
  return items.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime() ?? 0
    const bTime = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime() ?? 0
    return aTime - bTime
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the user exists (use safe helper)
    const user = await safeGetDoc('users', userId)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch ALL tickets and filter client-side — avoids composite index requirement.
    // safeQueryDocs with userId + orderBy requires a composite Firestore index that
    // may not exist. safeGetDocs + client-side filter works without any index.
    const allTickets = await safeGetDocs('support_tickets')
    const tickets = sortByDateDesc(
      allTickets.filter((t: any) => t.userId === userId)
    )

    // Enrich each ticket with replies and user data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket: any) => {
        try {
          // Fetch ALL replies and filter client-side — same reason (avoids composite index)
          const allReplies = await safeGetDocs('ticket_replies')
          const repliesRaw = sortByDateAsc(
            allReplies.filter((r: any) => r.ticketId === ticket.id)
          )

          const replies = await Promise.all(
            repliesRaw.map(async (reply: any) => {
              let replyAuthor: any = null
              if (reply.authorId) {
                const a = await safeGetDoc('users', reply.authorId)
                if (a) replyAuthor = { id: (a as any).id, name: (a as any).name, email: (a as any).email, avatar: (a as any).avatar }
              }
              return serializeFirestore({ ...reply, author: replyAuthor })
            })
          )

          // Get ticket user data
          const ticketUser = ticket.userId ? await safeGetDoc('users', ticket.userId) : null

          return serializeFirestore({
            ...ticket,
            replies,
            user: ticketUser ? {
              id: (ticketUser as any).id,
              name: (ticketUser as any).name,
              email: (ticketUser as any).email,
              avatar: (ticketUser as any).avatar,
            } : null,
          })
        } catch {
          return serializeFirestore(ticket)
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedTickets,
      count: enrichedTickets.length,
    })
  } catch (error) {
    console.error('Support tickets fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch support tickets',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, subject, priority, description, message } = body

    if (!userId || !subject) {
      return NextResponse.json(
        { success: false, message: 'userId and subject are required' },
        { status: 400 }
      )
    }

    // Verify the user exists
    const user = await safeGetDoc('users', userId)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const { createDoc, getDoc } = await import('@/lib/db')
    const ticketId = await createDoc('support_tickets', {
      userId,
      subject,
      description: description || message || null,
      priority: priority || 'medium',
      status: 'open',
    })

    const ticket = await getDoc('support_tickets', ticketId)

    // Enrich with user data
    const enrichedTicket = serializeFirestore({
      ...ticket,
      user: {
        id: (user as any).id,
        name: (user as any).name,
        email: (user as any).email,
        avatar: (user as any).avatar,
      },
    })

    // Send email notifications if SMTP is configured
    if (await isEmailConfigured()) {
      const ticketMessage = description || message || ''
      const userName = (user as any).name || 'Utilizador'
      const userEmail = (user as any).email || ''

      // Send copy to user
      if (userEmail) {
        sendEmail(ticketNotificationTemplate({
          userName,
          userEmail,
          ticketSubject: subject,
          ticketId: ticketId,
          message: ticketMessage,
          isAdminCopy: false,
        })).catch((err) => console.warn('[Support] User email failed:', err.message))
      }

      // Send copy to admin
      sendEmail(ticketNotificationTemplate({
        userName,
        userEmail,
        ticketSubject: subject,
        ticketId: ticketId,
        message: ticketMessage,
        isAdminCopy: true,
      })).catch((err) => console.warn('[Support] Admin email failed:', err.message))
    }

    return NextResponse.json({
      success: true,
      data: enrichedTicket,
      message: 'Support ticket created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Support ticket create error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create support ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
