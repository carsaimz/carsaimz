import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { serializeFirestore } from '@/lib/serialize'
import { verifyAuthToken } from '@/lib/loyalty-helpers'

/**
 * GET /api/loyalty/transactions
 * Get loyalty transaction history for the authenticated user
 * Query params: limit (default 50), offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request.headers.get('Authorization'))
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch transactions for the user
    let transactions: any[] = []
    try {
      const snap = await db.collection('loyalty_transactions')
        .where('userId', '==', authResult.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get()

      transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (error: any) {
      console.warn('[Loyalty] Transactions query failed, trying without offset:', error.message)
      // Fallback without offset (may not be supported)
      try {
        const snap = await db.collection('loyalty_transactions')
          .where('userId', '==', authResult.uid)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get()

        transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      } catch (innerError: any) {
        console.warn('[Loyalty] Transactions query failed without ordering:', innerError.message)
        // Last fallback without ordering
        const snap = await db.collection('loyalty_transactions')
          .where('userId', '==', authResult.uid)
          .limit(limit)
          .get()

        transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }
    }

    // Get total count
    let total = 0
    try {
      const countSnap = await db.collection('loyalty_transactions')
        .where('userId', '==', authResult.uid)
        .select('__name__')
        .get()
      total = countSnap.size
    } catch {}

    return NextResponse.json({
      success: true,
      data: serializeFirestore(transactions),
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Loyalty] Transactions GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transactions', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
