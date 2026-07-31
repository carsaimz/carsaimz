import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { getDoc } from '@/lib/db'
import { verifyAuthToken } from '@/lib/loyalty-helpers'
import { earnPoints, calculateEarnPoints, getOrCreateLoyaltyAccount } from '@/lib/loyalty-helpers'

/**
 * POST /api/affiliate/commission
 * Calculate and record commission when a referred user purchases a service
 * Body: { userId (the purchaser), serviceId, amount (paid amount) }
 * - Checks if the user was referred by a partner (has referredBy field)
 * - Calculates commission: 0.5% of paid amount (min 1 MZN)
 * - If partner is Gold tier or above: 1% commission
 * - Creates a commission record in affiliate_commissions
 * - Updates the partner's total commission amount
 * - Also awards loyalty points to the user for the purchase
 * Returns: { success: true, commission: number }
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
    const { userId, serviceId, amount } = body

    if (!userId || !serviceId || !amount) {
      return NextResponse.json(
        { success: false, message: 'userId, serviceId, and amount are required' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'amount must be a positive number' },
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

    // Check if the user was referred by a partner
    const userDoc = await getDoc('users', userId)
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const referredBy = (userDoc as any).referredBy
    if (!referredBy) {
      // User was not referred — no commission, but still award loyalty points
      const loyaltyAccount = await getOrCreateLoyaltyAccount(db, userId)
      const points = calculateEarnPoints(amount, loyaltyAccount.tier)
      await earnPoints(userId, points, 'service_purchase', serviceId)

      return NextResponse.json({
        success: true,
        commission: 0,
        message: 'User was not referred — no commission awarded',
        loyaltyPoints: points,
      })
    }

    // Get the partner's tier to determine commission rate
    const partnerDoc = await getDoc('users', referredBy)
    const partnerTier = (partnerDoc as any)?.tier || 'bronze'
    const isGoldOrAbove = ['gold', 'platinum', 'diamond'].includes(partnerTier)

    // Calculate commission
    const commissionRate = isGoldOrAbove ? 0.01 : 0.005
    let commission = Math.round(amount * commissionRate * 100) / 100
    // Minimum 1 MZN
    commission = Math.max(commission, 1)

    // Get service info for the commission record
    const serviceDoc = await getDoc('services', serviceId)
    const serviceName = (serviceDoc as any)?.name || 'Unknown Service'

    // Create commission record
    await db.collection('affiliate_commissions').add({
      partnerId: referredBy,
      userId,
      serviceId,
      serviceName,
      amount,
      commissionRate,
      commission,
      type: 'service',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Update partner's total commission amount
    const partnerSnap = await db.collection('users').doc(referredBy).get()
    if (partnerSnap.exists) {
      const currentTotal = partnerSnap.data()?.totalCommission || 0
      await db.collection('users').doc(referredBy).update({
        totalCommission: currentTotal + commission,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    // Award loyalty points to the user for the purchase
    const loyaltyAccount = await getOrCreateLoyaltyAccount(db, userId)
    const points = calculateEarnPoints(amount, loyaltyAccount.tier)
    await earnPoints(userId, points, 'service_purchase', serviceId)

    return NextResponse.json({
      success: true,
      commission,
      commissionRate,
      partnerTier,
      loyaltyPoints: points,
    })
  } catch (error) {
    console.error('[Affiliate Commission] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to calculate commission',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
