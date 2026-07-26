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

    const quotes = await db.quote.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        proposals: {
          select: {
            id: true,
            title: true,
            description: true,
            totalAmount: true,
            status: true,
            validUntil: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: quotes,
      count: quotes.length,
    })
  } catch (error) {
    console.error('Quotes fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch quotes',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, description, attachments } = body

    if (!userId || !title) {
      return NextResponse.json(
        { success: false, message: 'userId and title are required' },
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

    const quote = await db.quote.create({
      data: {
        userId,
        title,
        description: description || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: 'pending',
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
      data: quote,
      message: 'Quote request created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Quote create error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create quote request',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
