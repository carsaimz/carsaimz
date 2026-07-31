/**
 * Carsai Mozambique — Ads Reject API Route
 *
 * POST /api/ads/[id]/reject — Reject an ad (admin only)
 *   Body: reason (string)
 *   Sets status to 'rejected', rejectedReason
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, updateDoc } from '@/lib/db'
import { verifyAuthToken, isAdmin, type Ad } from '@/lib/ads-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Ad ID is required' },
        { status: 400 }
      )
    }

    // Verify auth and admin role
    const authHeader = request.headers.get('Authorization')
    const authResult = await verifyAuthToken(authHeader)

    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isAdmin(authResult.role)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch existing ad
    const existingAd = await getDoc('ads', id) as Ad | null

    if (!existingAd) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      )
    }

    // Only pending or approved ads can be rejected
    if (existingAd.status !== 'pending' && existingAd.status !== 'approved' && existingAd.status !== 'active') {
      return NextResponse.json(
        { success: false, message: `Ad with status '${existingAd.status}' cannot be rejected. Only pending, approved, or active ads can be rejected.` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Update the ad
    await updateDoc('ads', id, {
      status: 'rejected',
      rejectedReason: reason.trim(),
      approvedBy: null,
      approvedAt: null,
    })

    return NextResponse.json({
      success: true,
      message: 'Ad rejected',
    })
  } catch (error) {
    console.error('[Ads] Reject error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to reject ad' },
      { status: 500 }
    )
  }
}
