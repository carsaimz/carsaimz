/**
 * Carsai Mozambique — Ads Approve API Route
 *
 * POST /api/ads/[id]/approve — Approve an ad (admin only)
 *   Sets status to 'approved', approvedBy, approvedAt
 *   If startDate is in the past, set to 'active'
 */

import { NextRequest, NextResponse } from 'next/server'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
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

    // Only pending or rejected ads can be approved
    if (existingAd.status !== 'pending' && existingAd.status !== 'rejected') {
      return NextResponse.json(
        { success: false, message: `Ad with status '${existingAd.status}' cannot be approved. Only pending or rejected ads can be approved.` },
        { status: 400 }
      )
    }

    const now = new Date()

    // Determine the new status
    // If startDate is in the past, set to 'active' immediately
    let newStatus: string = 'approved'
    if (existingAd.startDate) {
      const startDate = existingAd.startDate instanceof Timestamp
        ? existingAd.startDate.toDate()
        : new Date(existingAd.startDate as any)

      if (startDate <= now) {
        newStatus = 'active'
      }
    }

    // Update the ad
    await updateDoc('ads', id, {
      status: newStatus,
      approvedBy: authResult.uid,
      approvedAt: FieldValue.serverTimestamp(),
      rejectedReason: null, // Clear any previous rejection reason
    })

    return NextResponse.json({
      success: true,
      message: `Ad ${newStatus === 'active' ? 'approved and activated' : 'approved'}`,
    })
  } catch (error) {
    console.error('[Ads] Approve error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to approve ad' },
      { status: 500 }
    )
  }
}
