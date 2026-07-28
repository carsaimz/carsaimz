import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs } from '@/lib/db'
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

    const paymentsRaw = await queryDocs('payments', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc')

    // Enrich each payment with proposal and user data
    const payments = await Promise.all(
      paymentsRaw.map(async (p: any) => {
        const proposal = p.proposalId ? await getDoc('proposals', p.proposalId) : null
        let proposalWithQuote: any = null
        if (proposal) {
          const quote = proposal.quoteId ? await getDoc('quotes', proposal.quoteId) : null
          proposalWithQuote = {
            id: proposal.id,
            title: proposal.title,
            description: proposal.description,
            totalAmount: proposal.totalAmount,
            status: proposal.status,
            validUntil: serializeFirestore(proposal.validUntil),
            createdAt: serializeFirestore(proposal.createdAt),
            quote: quote ? {
              id: quote.id,
              title: quote.title,
              status: quote.status,
            } : null,
          }
        }

        return serializeFirestore({
          ...p,
          proposal: proposalWithQuote,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      data: payments,
      count: payments.length,
    })
  } catch (error) {
    console.error('Payments fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch payments',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
