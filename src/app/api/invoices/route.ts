import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, getDocs } from '@/lib/db'
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

    // Find all quotes linked to the user
    const userQuotes = await queryDocs('quotes', [
      { field: 'userId', op: '==', value: userId },
    ])
    const quoteIds = userQuotes.map((q: any) => q.id)

    // Get all proposals for these quotes
    const allProposals: any[] = []
    for (const quoteId of quoteIds) {
      const quoteProposals = await queryDocs('proposals', [
        { field: 'quoteId', op: '==', value: quoteId },
      ])
      allProposals.push(...quoteProposals)
    }
    const proposalIds = allProposals.map((p: any) => p.id)

    // Get invoices for these proposals
    const allInvoices: any[] = []
    for (const proposalId of proposalIds) {
      const proposalInvoices = await queryDocs('invoices', [
        { field: 'proposalId', op: '==', value: proposalId },
      ])
      allInvoices.push(...proposalInvoices)
    }

    // Enrich each invoice with proposal, quote, and items data
    const invoices = await Promise.all(
      allInvoices.map(async (invoice: any) => {
        const proposal = invoice.proposalId ? await getDoc('proposals', invoice.proposalId) : null
        let quote: any = null
        if (proposal && proposal.quoteId) {
          quote = await getDoc('quotes', proposal.quoteId)
        }
        const items = await queryDocs('invoice_items', [
          { field: 'invoiceId', op: '==', value: invoice.id },
        ])

        return serializeFirestore({
          ...invoice,
          proposal: proposal ? {
            id: proposal.id,
            title: proposal.title,
            quote: quote ? {
              id: quote.id,
              title: quote.title,
              userId: quote.userId,
            } : null,
          } : null,
          items,
        })
      })
    )

    // Sort by createdAt desc
    invoices.sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
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
