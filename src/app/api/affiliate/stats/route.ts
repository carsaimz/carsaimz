import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { queryDocs, countDocs, getDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import { verifyAuthToken } from '@/lib/loyalty-helpers'

/**
 * GET /api/affiliate/stats?partnerId=xxx
 * Get affiliate stats for a partner:
 * - Total referred users (count of users whose referredBy matches partnerId)
 * - Total coupon redemptions from their coupons
 * - Commission breakdown by service/project
 * - Recent referred users (last 5)
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

    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: 'partnerId query parameter is required' },
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

    // 1. Count total referred users (users whose referredBy matches partnerId)
    const referredCount = await countDocs('users', [
      { field: 'referredBy', op: '==', value: partnerId },
    ])

    // 2. Get recent referred users (last 5)
    const recentReferred = await queryDocs('users', [
      { field: 'referredBy', op: '==', value: partnerId },
    ], 'createdAt', 'desc', 5)

    const recentReferredUsers = recentReferred.map((u: any) => ({
      id: u.id,
      name: u.name || 'Unknown',
      email: u.email || null,
      createdAt: serializeFirestore(u.createdAt),
    }))

    // 3. Count coupon redemptions from partner's coupons
    const partnerCoupons = await queryDocs('coupons', [
      { field: 'createdBy', op: '==', value: partnerId },
    ])

    const partnerCouponIds = partnerCoupons.map((c: any) => c.id)

    let totalCouponRedemptions = 0
    if (partnerCouponIds.length > 0) {
      // Count usage records for each coupon
      for (const couponId of partnerCouponIds) {
        const usageCount = await countDocs('coupon_usages', [
          { field: 'couponId', op: '==', value: couponId },
        ])
        totalCouponRedemptions += usageCount
      }
    }

    // Also count from usageCount field on coupons directly
    const directCouponUsage = partnerCoupons.reduce((sum: number, c: any) => {
      return sum + (c.usageCount || 0)
    }, 0)

    // Use the larger of the two counts
    totalCouponRedemptions = Math.max(totalCouponRedemptions, directCouponUsage)

    // 4. Commission breakdown
    const commissions = await queryDocs('affiliate_commissions', [
      { field: 'partnerId', op: '==', value: partnerId },
    ], 'createdAt', 'desc')

    let totalCommission = 0
    let commissionFromServices = 0
    let commissionFromCoupons = 0
    const breakdownByType: Record<string, number> = {}

    for (const c of commissions) {
      const amount = c.amount || 0
      totalCommission += amount

      const type = c.type || 'service'
      breakdownByType[type] = (breakdownByType[type] || 0) + amount

      if (type === 'service' || type === 'project') {
        commissionFromServices += amount
      } else if (type === 'coupon') {
        commissionFromCoupons += amount
      }
    }

    // 5. Get partner's tier for commission rate display
    const partnerDoc = await getDoc('users', partnerId)
    const partnerTier = (partnerDoc as any)?.tier || 'bronze'
    const isGoldOrAbove = ['gold', 'platinum', 'diamond'].includes(partnerTier)
    const commissionRate = isGoldOrAbove ? 1.0 : 0.5

    // 6. Total clicks
    const totalClicks = await countDocs('affiliate_clicks', [
      { field: 'referrerId', op: '==', value: partnerId },
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalReferredUsers: referredCount,
        totalCouponRedemptions,
        totalClicks,
        totalCommission,
        commissionFromServices,
        commissionFromCoupons,
        commissionBreakdown: breakdownByType,
        commissionRate,
        partnerTier,
        recentReferredUsers,
      },
    })
  } catch (error) {
    console.error('[Affiliate Stats] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch affiliate stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
