/**
 * Carsai Mozambique — Admin Ads API Route
 *
 * GET /api/admin/ads — Fetch all ads for admin management (with filtering)
 *   Query params: status, partnerId, type, page, limit
 *   Returns all ads with pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDocs, queryDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import { verifyAuthToken, isAdmin } from '@/lib/ads-helpers'

// ─── GET — Fetch all ads for admin management ───

export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build filters
    const filters: Array<{ field: string; op: any; value: any }> = []

    if (status) {
      filters.push({ field: 'status', op: '==', value: status })
    }

    if (partnerId) {
      filters.push({ field: 'partnerId', op: '==', value: partnerId })
    }

    if (type) {
      filters.push({ field: 'type', op: '==', value: type })
    }

    // Fetch ads with filters
    let allAds: any[]

    if (filters.length > 0) {
      allAds = await queryDocs('ads', filters, 'createdAt', 'desc')
    } else {
      allAds = await getDocs('ads')
      // Sort by createdAt descending (for getDocs which doesn't support ordering)
      allAds.sort((a: any, b: any) => {
        try {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0
          const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0
          return bTime - aTime
        } catch {
          return 0
        }
      })
    }

    // Paginate
    const total = allAds.length
    const start = (page - 1) * limit
    const paginatedAds = allAds.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(paginatedAds),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[Admin Ads] GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}
