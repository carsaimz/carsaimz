import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const tickets = await db.supportTicket.findMany({
      where: { userId },
      include: {
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: tickets,
      count: tickets.length,
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
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const ticket = await db.supportTicket.create({
      data: {
        userId,
        subject,
        priority: priority || 'medium',
        status: 'open',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: ticket,
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
