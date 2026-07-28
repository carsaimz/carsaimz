import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, createDoc } from '@/lib/db'
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

    // Verify the user exists
    const user = await getDoc('users', userId)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const tickets = await queryDocs('support_tickets', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc')

    // Enrich each ticket with replies and user data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket: any) => {
        // Get replies with authors
        const repliesRaw = await queryDocs('ticket_replies', [
          { field: 'ticketId', op: '==', value: ticket.id },
        ], 'createdAt', 'asc')

        const replies = await Promise.all(
          repliesRaw.map(async (reply: any) => {
            let replyAuthor: any = null
            if (reply.authorId) {
              const a = await getDoc('users', reply.authorId)
              if (a) replyAuthor = { id: a.id, name: a.name, email: a.email, avatar: a.avatar }
            }
            return serializeFirestore({ ...reply, author: replyAuthor })
          })
        )

        // Get ticket user data
        const ticketUser = ticket.userId ? await getDoc('users', ticket.userId) : null

        return serializeFirestore({
          ...ticket,
          replies,
          user: ticketUser ? {
            id: ticketUser.id,
            name: ticketUser.name,
            email: ticketUser.email,
            avatar: ticketUser.avatar,
          } : null,
        })
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
    const { userId, subject, priority } = body

    if (!userId || !subject) {
      return NextResponse.json(
        { success: false, message: 'userId and subject are required' },
        { status: 400 }
      )
    }

    // Verify the user exists
    const user = await getDoc('users', userId)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const ticketId = await createDoc('support_tickets', {
      userId,
      subject,
      priority: priority || 'medium',
      status: 'open',
    })

    const ticket = await getDoc('support_tickets', ticketId)

    // Enrich with user data
    const enrichedTicket = serializeFirestore({
      ...ticket,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
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
