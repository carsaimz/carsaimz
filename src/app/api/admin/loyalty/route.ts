import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { serializeFirestore } from '@/lib/serialize'
import { verifyAuthToken, isAdmin, earnPoints, initializeLoyaltyTiers } from '@/lib/loyalty-helpers'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/admin/loyalty
 * Get all users' loyalty data (admin only)
 * Query params: limit (default 50), offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request.headers.get('Authorization'))
    if (!authResult || !isAdmin(authResult.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized — admin access required' },
        { status: 403 }
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

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch all loyalty accounts
    let accounts: any[] = []
    try {
      const snap = await db.collection('loyalty_points')
        .orderBy('totalEarned', 'desc')
        .limit(limit)
        .offset(offset)
        .get()

      accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (error: any) {
      // Fallback without ordering
      try {
        const snap = await db.collection('loyalty_points')
          .limit(limit)
          .get()

        accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      } catch (innerError: any) {
        console.warn('[Admin Loyalty] Failed to fetch accounts:', innerError.message)
      }
    }

    // Enrich with user data
    const enrichedAccounts = await Promise.all(
      accounts.map(async (account: any) => {
        try {
          const userDoc = await db.collection('users').doc(account.userId).get()
          const userData = userDoc.exists ? userDoc.data() : null
          return serializeFirestore({
            ...account,
            userName: userData?.name || 'Unknown',
            userEmail: userData?.email || 'N/A',
          })
        } catch {
          return serializeFirestore(account)
        }
      })
    )

    // Get total count
    let total = 0
    try {
      const countSnap = await db.collection('loyalty_points').select('__name__').get()
      total = countSnap.size
    } catch {}

    // Get tier stats
    let tierStats: Record<string, number> = {}
    try {
      const tiersSnap = await db.collection('loyalty_tiers').orderBy('order', 'asc').get()
      for (const doc of tiersSnap.docs) {
        const tierName = doc.data().name
        const countSnap = await db.collection('loyalty_points')
          .where('tier', '==', tierName)
          .select('__name__')
          .get()
        tierStats[tierName] = countSnap.size
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data: enrichedAccounts,
      total,
      tierStats,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Admin Loyalty] GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch loyalty data', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/loyalty
 * Adjust points (admin only)
 * Body: { userId, points, reason }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request.headers.get('Authorization'))
    if (!authResult || !isAdmin(authResult.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized — admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, points, reason } = body

    if (!userId || points === undefined || !reason) {
      return NextResponse.json(
        { success: false, message: 'userId, points, and reason are required' },
        { status: 400 }
      )
    }

    if (points === 0) {
      return NextResponse.json(
        { success: false, message: 'Points adjustment cannot be zero' },
        { status: 400 }
      )
    }

    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      )
    }

    // Verify target user exists
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Target user not found' },
        { status: 404 }
      )
    }

    if (points > 0) {
      // Admin adding points
      const result = await earnPoints(userId, points, 'admin_adjustment', null)
      return NextResponse.json({
        success: true,
        data: result,
        message: `Added ${points} points to user ${userId}`,
      })
    } else {
      // Admin deducting points
      const absPoints = Math.abs(points)
      const { getOrCreateLoyaltyAccount } = await import('@/lib/loyalty-helpers')
      const account = await getOrCreateLoyaltyAccount(db, userId)

      if (account.points < absPoints) {
        return NextResponse.json(
          { success: false, message: `User only has ${account.points} points. Cannot deduct ${absPoints}.` },
          { status: 400 }
        )
      }

      const newPoints = account.points - absPoints
      const newTotalRedeemed = account.totalRedeemed + absPoints

      await db.collection('loyalty_points').doc(account.id).update({
        points: newPoints,
        totalRedeemed: newTotalRedeemed,
        updatedAt: FieldValue.serverTimestamp(),
      })

      // Create transaction
      await db.collection('loyalty_transactions').add({
        userId,
        type: 'adjustment',
        points: points, // negative
        reason: 'admin_adjustment',
        referenceId: authResult.uid,
        description: `Admin adjusted ${points} points: ${reason}`,
        createdAt: FieldValue.serverTimestamp(),
      })

      return NextResponse.json({
        success: true,
        data: { newBalance: newPoints },
        message: `Deducted ${absPoints} points from user ${userId}`,
      })
    }
  } catch (error) {
    console.error('[Admin Loyalty] POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to adjust points', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
