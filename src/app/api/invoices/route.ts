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

    // Find all proposals linked to the user's quotes
    const userQuotes = await db.quote.findMany({
      where: { userId },
      select: { id: true },
    })

    const quoteIds = userQuotes.map(q => q.id)

    // Get all proposals for these quotes
    const proposals = await db.proposal.findMany({
      where: { quoteId: { in: quoteIds } },
      select: { id: true },
    })

    const proposalIds = proposals.map(p => p.id)

    // Get invoices for these proposals
    const invoices = await db.invoice.findMany({
      where: { proposalId: { in: proposalIds } },
      include: {
        proposal: {
          select: {
            id: true,
            title: true,
            quote: {
              select: {
                id: true,
                title: true,
                userId: true,
              },
            },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: invoices,
      count: invoices.length,
    })
  } catch (error) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch invoices',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
