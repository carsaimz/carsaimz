/**
 * Carsai Mozambique — Admin Ads API Route
 *
 * GET  /api/admin/ads — Fetch all ads for admin management (with filtering)
 *   Query params: status, partnerId, type, page, limit
 *   Returns all ads with pagination
 *
 * POST /api/admin/ads — Create a new ad (admin only, with partner assignment)
 *   Body: all ad fields + partnerId (optional, for assigning to partner)
 *   Allows admin to create ads and assign them to specific partners
 */

import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDocs, queryDocs, createDoc, getDoc, updateDoc } from '@/lib/db'
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

// ─── POST — Create a new ad (admin only, with partner assignment) ───

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      title,
      description,
      type,
      format,
      content,
      targetUrl,
      placement,
      planId,
      partnerId,  // Admin can assign to a specific partner
      status: adStatus,
      priority,
      maxImpressions,
      maxClicks,
      maxConversions,
      startDate,
      endDate,
      autoDeactivate,
      pixelUrls,
      clickPixelUrls,
      conversionPixelUrls,
    } = body

    // Validate required fields
    if (!title || !type || !format || !content || !placement || !planId) {
      return NextResponse.json(
        {
          success: false,
          message: 'title, type, format, content, placement (array), and planId are required',
        },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['banner', 'interstitial', 'sidebar', 'native', 'video', 'rich_media']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate format
    const validFormats = ['html', 'script', 'image_base64', 'video_base64', 'text_quill', 'url']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { success: false, message: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate placement is an array
    if (!Array.isArray(placement) || placement.length === 0) {
      return NextResponse.json(
        { success: false, message: 'placement must be a non-empty array of strings' },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['pending', 'active', 'approved', 'paused', 'rejected', 'expired']
    const finalStatus = adStatus && validStatuses.includes(adStatus) ? adStatus : 'pending'

    // Parse dates
    const parsedStartDate = startDate
      ? Timestamp.fromDate(new Date(startDate))
      : Timestamp.fromDate(new Date())

    const parsedEndDate = endDate
      ? Timestamp.fromDate(new Date(endDate))
      : null

    // Create the ad document
    // Admin can set partnerId explicitly (or leave null for admin-owned ads)
    const adId = await createDoc('ads', {
      title,
      description: description || '',
      type,
      format,
      content,
      targetUrl: targetUrl || '',
      placement,
      planId,
      partnerId: partnerId || null,
      status: finalStatus,
      priority: priority || 50,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      maxImpressions: maxImpressions || 0,
      maxClicks: maxClicks || 0,
      maxConversions: maxConversions || 0,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      autoDeactivate: autoDeactivate !== undefined ? autoDeactivate : true,
      pixelUrls: Array.isArray(pixelUrls) ? pixelUrls : [],
      clickPixelUrls: Array.isArray(clickPixelUrls) ? clickPixelUrls : [],
      conversionPixelUrls: Array.isArray(conversionPixelUrls) ? conversionPixelUrls : [],
      approvedBy: finalStatus === 'approved' || finalStatus === 'active' ? authResult.uid : null,
      approvedAt: finalStatus === 'approved' || finalStatus === 'active' ? Timestamp.fromDate(new Date()) : null,
      rejectedReason: null,
    })

    const ad = await getDoc('ads', adId)

    return NextResponse.json(
      { success: true, data: serializeFirestore(ad) },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Admin Ads] POST error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create ad'
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}

// ─── PUT — Update an ad (admin only, supports partnerId reassignment) ───

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Ad ID is required' },
        { status: 400 }
      )
    }

    // Allowed updatable fields (includes partnerId for reassignment)
    const allowedFields = [
      'title', 'description', 'type', 'format', 'content', 'targetUrl',
      'placement', 'planId', 'partnerId', 'status', 'priority',
      'maxImpressions', 'maxClicks', 'maxConversions',
      'autoDeactivate', 'pixelUrls', 'clickPixelUrls', 'conversionPixelUrls',
      'rejectedReason',
    ]

    const filteredUpdates: Record<string, any> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value
      }
    }

    // Parse date fields if provided
    if (updates.startDate) {
      filteredUpdates.startDate = Timestamp.fromDate(new Date(updates.startDate))
    }
    if (updates.endDate) {
      filteredUpdates.endDate = Timestamp.fromDate(new Date(updates.endDate))
    }

    // Add updatedAt timestamp
    filteredUpdates.updatedAt = Timestamp.fromDate(new Date())

    // If status is being set to approved/active, set approvedBy/approvedAt
    if (filteredUpdates.status === 'approved' || filteredUpdates.status === 'active') {
      filteredUpdates.approvedBy = authResult.uid
      filteredUpdates.approvedAt = Timestamp.fromDate(new Date())
    }

    await updateDoc('ads', id, filteredUpdates)
    const updatedAd = await getDoc('ads', id)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(updatedAd),
    })
  } catch (error) {
    console.error('[Admin Ads] PUT error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update ad'
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
