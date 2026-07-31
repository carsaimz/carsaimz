import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken, redeemPoints } from '@/lib/loyalty-helpers'

/**
 * POST /api/loyalty/redeem
 * Redeem points for a discount coupon
 * Body: { points (number), serviceId? (string) }
 * 1 point = 1 MZN (Metical) value
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
    const { points, serviceId } = body

    if (!points || points <= 0) {
      return NextResponse.json(
        { success: false, message: 'Points must be a positive number' },
        { status: 400 }
      )
    }

    // Minimum redemption: 10 points (10 MZN)
    if (points < 10) {
      return NextResponse.json(
        { success: false, message: 'Minimum redemption is 10 points (10 MZN)' },
        { status: 400 }
      )
    }

    // Maximum redemption: 5000 points (5000 MZN) per transaction
    if (points > 5000) {
      return NextResponse.json(
        { success: false, message: 'Maximum redemption is 5000 points (5000 MZN) per transaction' },
        { status: 400 }
      )
    }

    try {
      const result = await redeemPoints(authResult.uid, points)

      return NextResponse.json({
        success: true,
        data: {
          newBalance: result.newBalance,
          couponCode: result.couponCode,
          couponValue: result.couponValue,
          serviceId: serviceId || null,
        },
      })
    } catch (err: any) {
      if (err.message === 'Insufficient points balance') {
        return NextResponse.json(
          { success: false, message: 'Insufficient points balance' },
          { status: 400 }
        )
      }
      throw err
    }
  } catch (error) {
    console.error('[Loyalty] Redeem POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to redeem points', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
