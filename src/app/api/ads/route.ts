/**
 * Carsai Mozambique — Ads API Route
 *
 * GET  /api/ads — Fetch active ads for display (public)
 * POST /api/ads — Create a new ad (partner only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { createDoc, getDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import {
  getActiveAdsForPlacement,
  firePixelUrls,
  verifyAuthToken,
  isPartner,
} from '@/lib/ads-helpers'

// ─── GET — Fetch active ads for display (public) ───

export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const placement = searchParams.get('placement')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!placement) {
      return NextResponse.json(
        { success: false, message: 'placement query parameter is required' },
        { status: 400 }
      )
    }

    // Get active ads for the placement
    let ads = await getActiveAdsForPlacement(db, placement, limit)

    // Filter by type if specified
    if (type) {
      ads = ads.filter(ad => ad.type === type)
    }

    // Fire impression pixels and increment impression counts (non-blocking)
    for (const ad of ads) {
      // Fire impression pixels
      if (ad.pixelUrls && ad.pixelUrls.length > 0) {
        firePixelUrls(ad.pixelUrls)
      }

      // Increment impression count (non-blocking)
      db.collection('ads').doc(ad.id).update({
        impressions: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      }).catch((err: any) => {
        console.error(`[Ads] Failed to increment impressions for ad ${ad.id}:`, err.message)
      })
    }

    return NextResponse.json({
      success: true,
      data: serializeFirestore(ads),
    })
  } catch (error) {
    console.error('[Ads] GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}

// ─── POST — Create a new ad (partner only) ───

export async function POST(request: NextRequest) {
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

    // Parse dates
    const parsedStartDate = startDate
      ? Timestamp.fromDate(new Date(startDate))
      : Timestamp.fromDate(new Date())

    const parsedEndDate = endDate
      ? Timestamp.fromDate(new Date(endDate))
      : null

    // Create the ad document
    const adId = await createDoc('ads', {
      title,
      description: description || '',
      type,
      format,
      content,
      targetUrl: targetUrl || '',
      placement,
      planId,
      partnerId: authResult.uid,
      status: 'pending',
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
      approvedBy: null,
      approvedAt: null,
      rejectedReason: null,
    })

    const ad = await getDoc('ads', adId)

    return NextResponse.json(
      { success: true, data: serializeFirestore(ad) },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Ads] POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create ad' },
      { status: 500 }
    )
  }
}
