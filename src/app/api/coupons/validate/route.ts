import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuthToken } from '@/lib/loyalty-helpers'

/**
 * POST /api/coupons/validate
 * Validate a coupon code
 * Body: { code (string), serviceId? (string), projectId? (string) }
 * Returns: { success, valid, coupon, discount, message }
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
    const { code, serviceId, projectId } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, valid: false, message: 'Coupon code is required' },
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
      return NextResponse.json({
        success: true,
        valid: false,
        coupon: null,
        discount: 0,
        message: 'Invalid coupon code',
      })
    }

    const couponDoc = couponSnap.docs[0]
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Record<string, any>

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({
        success: true,
        valid: false,
        coupon: null,
        discount: 0,
        message: 'This coupon is no longer active',
      })
    }

    // Check expiration
    if (coupon.expiresAt) {
      const expiresAt = coupon.expiresAt instanceof Timestamp
        ? coupon.expiresAt.toDate()
        : new Date(coupon.expiresAt)
      if (expiresAt < new Date()) {
        return NextResponse.json({
          success: true,
          valid: false,
          coupon: null,
          discount: 0,
          message: 'This coupon has expired',
        })
      }
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        success: true,
        valid: false,
        coupon: null,
        discount: 0,
        message: 'This coupon has reached its usage limit',
      })
    }

    // Check if coupon applies to specific user (if userId is set)
    if (coupon.userId && coupon.userId !== authResult.uid) {
      return NextResponse.json({
        success: true,
        valid: false,
        coupon: null,
        discount: 0,
        message: 'This coupon is not available for your account',
      })
    }

    // Check if coupon applies to specific service
    if (serviceId && coupon.applicableServices && coupon.applicableServices.length > 0) {
      if (!coupon.applicableServices.includes(serviceId)) {
        return NextResponse.json({
          success: true,
          valid: false,
          coupon: null,
          discount: 0,
          message: 'This coupon does not apply to this service',
        })
      }
    }

    // Check if coupon applies to specific project
    if (projectId && coupon.applicableProjects && coupon.applicableProjects.length > 0) {
      if (!coupon.applicableProjects.includes(projectId)) {
        return NextResponse.json({
          success: true,
          valid: false,
          coupon: null,
          discount: 0,
          message: 'This coupon does not apply to this project',
        })
      }
    }

    // Calculate discount
    let discount = 0
    if (coupon.type === 'fixed') {
      discount = coupon.value || 0
    } else if (coupon.type === 'percentage') {
      // For percentage, we need the price from the client
      // Return the percentage so the client can calculate
      discount = coupon.value || 0
    }

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        expiresAt: coupon.expiresAt instanceof Timestamp ? coupon.expiresAt.toDate().toISOString() : coupon.expiresAt,
      },
      discount,
      message: coupon.type === 'percentage'
        ? `${discount}% discount applied`
        : `${discount} MZN discount applied`,
    })
  } catch (error) {
    console.error('[Coupons] Validate error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to validate coupon', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
