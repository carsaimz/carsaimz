import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, getDocByField, createDoc } from '@/lib/db'
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

    const quotes = await queryDocs('quotes', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc')

    // Enrich each quote with user and proposals data
    const enrichedQuotes = await Promise.all(
      quotes.map(async (q: any) => {
        const quoteUser = q.userId ? await getDoc('users', q.userId) : null
        const proposals = await queryDocs('proposals', [
          { field: 'quoteId', op: '==', value: q.id },
        ])

        return serializeFirestore({
          ...q,
          user: quoteUser ? {
            id: quoteUser.id,
            name: quoteUser.name,
            email: quoteUser.email,
            avatar: quoteUser.avatar,
            phone: quoteUser.phone,
          } : null,
          proposals: proposals.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            totalAmount: p.totalAmount,
            status: p.status,
            validUntil: serializeFirestore(p.validUntil),
            createdAt: serializeFirestore(p.createdAt),
          })),
        })
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedQuotes,
      count: enrichedQuotes.length,
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
    const user = await getDoc('users', userId)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const quoteId = await createDoc('quotes', {
      userId,
      title,
      description: description || null,
      attachments: attachments ? JSON.stringify(attachments) : null,
      status: 'pending',
    })

    const quote = await getDoc('quotes', quoteId)

    // Enrich with user data
    const quoteUser = await getDoc('users', userId)
    const enrichedQuote = serializeFirestore({
      ...quote,
      user: quoteUser ? {
        id: quoteUser.id,
        name: quoteUser.name,
        email: quoteUser.email,
        avatar: quoteUser.avatar,
      } : null,
    })

    return NextResponse.json({
      success: true,
      data: enrichedQuote,
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
