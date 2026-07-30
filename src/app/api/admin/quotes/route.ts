import { NextRequest, NextResponse } from 'next/server'
import { safeGetDocs, safeGetDoc, safeQueryDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, updateDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all quotes (admin view)
export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let quotes: any[]

    if (status) {
      quotes = await safeQueryDocs('quotes', [
        { field: 'status', op: '==', value: status },
      ], 'createdAt', 'desc')
    } else {
      quotes = await safeGetDocs('quotes')
      // Sort by createdAt descending
      quotes.sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(typeof a.createdAt === 'string' ? a.createdAt : a.createdAt?.toDate?.()?.toISOString?.() || 0).getTime() : 0
        const bTime = b.createdAt ? new Date(typeof b.createdAt === 'string' ? b.createdAt : b.createdAt?.toDate?.()?.toISOString?.() || 0).getTime() : 0
        return bTime - aTime
      })
    }

    // Enrich each quote with user data
    const enrichedQuotes = await Promise.all(
      quotes.map(async (quote: any) => {
        try {
          const quoteUser = quote.userId ? await safeGetDoc('users', quote.userId) : null
          return serializeFirestore({
            ...quote,
            user: quoteUser ? {
              id: (quoteUser as any).id,
              name: (quoteUser as any).name,
              email: (quoteUser as any).email,
              avatar: (quoteUser as any).avatar,
            } : null,
          })
        } catch {
          return serializeFirestore(quote)
        }
      })
    )

    return NextResponse.json({ success: true, data: enrichedQuotes })
  } catch (error) {
    console.error('Admin quotes fetch error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch quotes' }, { status: 500 })
  }
}

// PUT update quote status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'id and status are required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const quote = await getDoc('quotes', id)
    if (!quote) {
      return NextResponse.json({ success: false, message: 'Quote not found' }, { status: 404 })
    }

    await updateDoc('quotes', id, { status })
    const updated = await getDoc('quotes', id)
    return NextResponse.json({ success: true, data: serializeFirestore(updated) })
  } catch (error) {
    console.error('Admin quote update error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update quote' }, { status: 500 })
  }
}
