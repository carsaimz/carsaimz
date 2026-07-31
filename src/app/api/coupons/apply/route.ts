import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { verifyAuthToken } from '@/lib/loyalty-helpers'

/**
 * POST /api/coupons/apply
 * Apply a coupon to a service/project
 * Body: { code (string), referenceId (string), referenceType ('service' | 'project' | 'quote'), price? (number) }
 * Increments usage count
 * Returns: { success, discount, finalPrice }
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
    const { code, referenceId, referenceType, price } = body

    if (!code || !referenceId || !referenceType) {
      return NextResponse.json(
        { success: false, message: 'code, referenceId, and referenceType are required' },
        { status: 400 }
      )
    }

    const validTypes = ['service', 'project', 'quote']
    if (!validTypes.includes(referenceType)) {
      return NextResponse.json(
        { success: false, message: `referenceType must be one of: ${validTypes.join(', ')}` },
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

    // Look up coupon by code
    const couponSnap = await db.collection('coupons')
      .where('code', '==', code.toUpperCase().trim())
      .limit(1)
      .get()

    if (couponSnap.empty) {
      return NextResponse.json(
        { success: false, message: 'Invalid coupon code' },
        { status: 404 }
      )
    }

    const couponDoc = couponSnap.docs[0]
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Record<string, any>

    // Re-validate coupon
    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, message: 'This coupon is no longer active' },
        { status: 400 }
      )
    }

    if (coupon.expiresAt) {
      const expiresAt = coupon.expiresAt instanceof Timestamp
        ? coupon.expiresAt.toDate()
        : new Date(coupon.expiresAt)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, message: 'This coupon has expired' },
          { status: 400 }
        )
      }
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, message: 'This coupon has reached its usage limit' },
        { status: 400 }
      )
    }

    if (coupon.userId && coupon.userId !== authResult.uid) {
      return NextResponse.json(
        { success: false, message: 'This coupon is not available for your account' },
        { status: 403 }
      )
    }

    // Calculate discount
    let discount = 0
    const itemPrice = price || 0

    if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value || 0, itemPrice)
    } else if (coupon.type === 'percentage') {
      discount = Math.round((itemPrice * (coupon.value || 0)) / 100)
    }

    const finalPrice = Math.max(0, itemPrice - discount)

    // Increment usage count
    await db.collection('coupons').doc(coupon.id).update({
      usageCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Create usage record
    await db.collection('coupon_usages').add({
      couponId: coupon.id,
      couponCode: coupon.code,
      userId: authResult.uid,
      referenceId,
      referenceType,
      discount,
      originalPrice: itemPrice,
      finalPrice,
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      discount,
      finalPrice,
    })
  } catch (error) {
    console.error('[Coupons] Apply error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to apply coupon', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
