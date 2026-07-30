import { NextRequest, NextResponse } from 'next/server'
import { createDoc, getDoc, updateDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, content, authorId } = body

    if (!ticketId || !content || !authorId) {
      return NextResponse.json(
        { success: false, message: 'ticketId, content, and authorId are required' },
        { status: 400 }
      )
    }

    // Verify the ticket exists
    const ticket = await getDoc('support_tickets', ticketId)

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Verify the author exists
    const author = await getDoc('users', authorId)

    if (!author) {
      return NextResponse.json(
        { success: false, message: 'Author not found' },
        { status: 404 }
      )
    }

    const replyId = await createDoc('ticket_replies', {
      ticketId,
      content,
      authorId,
    })

    // Update ticket status to 'in_progress' if it was 'open'
    if ((ticket as any).status === 'open') {
      await updateDoc('support_tickets', ticketId, {
        status: 'in_progress',
      })
    }

    const reply = await getDoc('ticket_replies', replyId)

    // Enrich with author data
    const enrichedReply = serializeFirestore({
      ...reply,
      author: {
        id: (author as any).id,
        name: (author as any).name,
        email: (author as any).email,
        avatar: (author as any).avatar,
      },
    })

    return NextResponse.json({
      success: true,
      data: enrichedReply,
      message: 'Reply created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Ticket reply create error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create ticket reply',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
