import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { serializeFirestore } from '@/lib/serialize'
import {
  verifyAuthToken,
  getOrCreateLoyaltyAccount,
  earnPoints,
  initializeLoyaltyTiers,
  calculateEarnPoints,
  type TransactionReason,
} from '@/lib/loyalty-helpers'

/**
 * GET /api/loyalty
 * Get current user's loyalty points and tier info
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

    // Initialize tiers if needed
    await initializeLoyaltyTiers(db)

    // Get or create loyalty account
    const account = await getOrCreateLoyaltyAccount(db, authResult.uid)

    // Get tier config
    let tierConfig: Record<string, any> | null = null
    try {
      const tierSnap = await db.collection('loyalty_tiers')
        .where('name', '==', account.tier)
        .limit(1)
        .get()
      if (!tierSnap.empty) {
        tierConfig = { id: tierSnap.docs[0].id, ...tierSnap.docs[0].data() }
      }
    } catch {}

    // Get all tiers for display
    let allTiers: any[] = []
    try {
      const tiersSnap = await db.collection('loyalty_tiers')
        .orderBy('order', 'asc')
        .get()
      allTiers = tiersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        account: serializeFirestore(account),
        tierConfig: serializeFirestore(tierConfig),
        allTiers: serializeFirestore(allTiers),
      },
    })
  } catch (error) {
    console.error('[Loyalty] GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch loyalty data', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/loyalty
 * Earn points (called internally when a service is purchased)
 * Body: { userId, points, reason, referenceId? }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request.headers.get('Authorization'))
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, points, reason, referenceId } = body

    if (!userId || !points || !reason) {
      return NextResponse.json(
        { success: false, message: 'userId, points, and reason are required' },
        { status: 400 }
      )
    }

    if (points <= 0) {
      return NextResponse.json(
        { success: false, message: 'Points must be positive' },
        { status: 400 }
      )
    }

    const validReasons: TransactionReason[] = [
      'service_purchase', 'referral_bonus', 'welcome_bonus', 'review_testimonial',
    ]
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { success: false, message: `Invalid reason. Must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      )
    }

    // Only allow users to earn points for themselves, or admins to earn for any user
    if (userId !== authResult.uid && authResult.role !== 'admin' && authResult.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'You can only earn points for yourself' },
        { status: 403 }
      )
    }

    const result = await earnPoints(userId, points, reason, referenceId || null)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Loyalty] POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to earn points', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
