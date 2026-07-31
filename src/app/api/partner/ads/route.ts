/**
 * Carsai Mozambique — Partner Ads API Route
 *
 * GET /api/partner/ads — Fetch partner's own ads
 *   Gets partnerId from query param
 *   Returns ads created by this partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { queryDocs, getDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import { verifyAuthToken, isPartner } from '@/lib/ads-helpers'

// ─── GET — Fetch partner's own ads ───

export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    // Verify auth
    const authHeader = request.headers.get('Authorization')
    const authResult = await verifyAuthToken(authHeader)

    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isPartner(authResult.role)) {
      return NextResponse.json(
        { success: false, message: 'Partner access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    // Use the authenticated user's ID if no partnerId provided
    // Admins can specify a partnerId to view a specific partner's ads
    const targetPartnerId = partnerId || authResult.uid

    // If a non-admin is requesting a different partner's ads, reject
    if (partnerId && partnerId !== authResult.uid && authResult.role !== 'admin' && authResult.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'You can only view your own ads' },
        { status: 403 }
      )
    }

    // Fetch ads by partnerId
    let ads: any[]
    try {
      ads = await queryDocs('ads', [
        { field: 'partnerId', op: '==', value: targetPartnerId },
      ], 'createdAt', 'desc')
    } catch {
      // Fallback: fetch all and filter
      const allAds = await getDocs('ads')
      ads = allAds.filter((ad: any) => ad.partnerId === targetPartnerId)
      ads.sort((a: any, b: any) => {
        try {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0
          const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0
          return bTime - aTime
        } catch {
          return 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: serializeFirestore(ads),
    })
  } catch (error) {
    console.error('[Partner Ads] GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch partner ads' },
      { status: 500 }
    )
  }
}
