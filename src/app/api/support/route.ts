import { NextRequest, NextResponse } from 'next/server'
import { safeGetDoc, safeQueryDocs, safeCountDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { serializeFirestore } from '@/lib/serialize'

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

    // Use safe helpers — returns empty array if collection doesn't exist
    const tickets = await safeQueryDocs('support_tickets', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc')

    // Enrich each ticket with replies and user data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket: any) => {
        try {
          // Get replies with authors
          const repliesRaw = await safeQueryDocs('ticket_replies', [
            { field: 'ticketId', op: '==', value: ticket.id },
          ], 'createdAt', 'asc')

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
    const { userId, subject, priority, description } = body

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
      description: description || null,
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
