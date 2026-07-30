import { NextRequest, NextResponse } from 'next/server'
import { safeGetDocs, safeGetDoc, safeQueryDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, updateDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all support tickets (admin view)
export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let tickets: any[]

    if (status) {
      tickets = await safeQueryDocs('support_tickets', [
        { field: 'status', op: '==', value: status },
      ], 'createdAt', 'desc')
    } else {
      tickets = await safeGetDocs('support_tickets')
      // Sort by createdAt descending
      tickets.sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(typeof a.createdAt === 'string' ? a.createdAt : a.createdAt?.toDate?.()?.toISOString?.() || 0).getTime() : 0
        const bTime = b.createdAt ? new Date(typeof b.createdAt === 'string' ? b.createdAt : b.createdAt?.toDate?.()?.toISOString?.() || 0).getTime() : 0
        return bTime - aTime
      })
    }

    // Enrich each ticket with user data and replies
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket: any) => {
        try {
          const ticketUser = ticket.userId ? await safeGetDoc('users', ticket.userId) : null
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

    return NextResponse.json({ success: true, data: enrichedTickets })
  } catch (error) {
    console.error('Admin support tickets fetch error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch support tickets' }, { status: 500 })
  }
}

// PUT update ticket status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'id and status are required' }, { status: 400 })
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const ticket = await getDoc('support_tickets', id)
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 })
    }

    await updateDoc('support_tickets', id, { status })
    const updated = await getDoc('support_tickets', id)
    return NextResponse.json({ success: true, data: serializeFirestore(updated) })
  } catch (error) {
    console.error('Admin support ticket update error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update ticket' }, { status: 500 })
  }
}

// DELETE a ticket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'id query parameter is required' }, { status: 400 })
    }

    const ticket = await getDoc('support_tickets', id)
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 })
    }

    await deleteDoc('support_tickets', id)
    return NextResponse.json({ success: true, message: 'Ticket deleted' })
  } catch (error) {
    console.error('Admin support ticket delete error:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete ticket' }, { status: 500 })
  }
}
