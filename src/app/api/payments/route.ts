import { NextRequest, NextResponse } from 'next/server'
import { safeGetDoc, safeQueryDocs } from '@/lib/db-helpers'
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
    const paymentsRaw = await safeQueryDocs('payments', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc')

    // Enrich each payment with proposal and user data
    const payments = await Promise.all(
      paymentsRaw.map(async (p: any) => {
        try {
          const proposal = p.proposalId ? await safeGetDoc('proposals', p.proposalId) : null
          let proposalWithQuote: any = null
          if (proposal) {
            const quote = (proposal as any).quoteId ? await safeGetDoc('quotes', (proposal as any).quoteId) : null
            proposalWithQuote = {
              id: (proposal as any).id,
              title: (proposal as any).title,
              description: (proposal as any).description,
              totalAmount: (proposal as any).totalAmount,
              status: (proposal as any).status,
              validUntil: serializeFirestore((proposal as any).validUntil),
              createdAt: serializeFirestore((proposal as any).createdAt),
              quote: quote ? {
                id: (quote as any).id,
                title: (quote as any).title,
                status: (quote as any).status,
              } : null,
            }
          }

          return serializeFirestore({
            ...p,
            proposal: proposalWithQuote,
            user: {
              id: (user as any).id,
              name: (user as any).name,
              email: (user as any).email,
              avatar: (user as any).avatar,
            },
          })
        } catch {
          return serializeFirestore(p)
        }
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
