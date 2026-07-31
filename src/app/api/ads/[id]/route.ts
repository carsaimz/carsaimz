/**
 * Carsai Mozambique — Ads [id] API Route
 *
 * GET    /api/ads/[id] — Get a single ad by ID
 * PUT    /api/ads/[id] — Update an ad (partner can update own pending ads, admin can update any)
 * DELETE /api/ads/[id] — Delete an ad (partner can delete own, admin can delete any)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, updateDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import { verifyAuthToken, isAdmin, type Ad } from '@/lib/ads-helpers'

// ─── GET — Get a single ad by ID ───

export async function GET(
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

    const ad = await getDoc('ads', id)

    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeFirestore(ad),
    })
  } catch (error) {
    console.error('[Ads] GET [id] error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ad' },
      { status: 500 }
    )
  }
}

// ─── PUT — Update an ad ───

export async function PUT(
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

    // Verify auth
    const authHeader = request.headers.get('Authorization')
    const authResult = await verifyAuthToken(authHeader)

    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
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

    // Permission check: partner can only update own pending ads, admin can update any
    const isUserAdmin = isAdmin(authResult.role)
    const isOwner = existingAd.partnerId === authResult.uid

    if (!isUserAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'You can only update your own ads' },
        { status: 403 }
      )
    }

    // Partners can only update pending ads
    if (!isUserAdmin && existingAd.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only pending ads can be updated. Contact an admin for changes.' },
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
      status,
    } = body

    // Build update object
    const updateData: Record<string, any> = {}

    // Fields that partners can update
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) {
      const validTypes = ['banner', 'interstitial', 'sidebar', 'native', 'video', 'rich_media']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.type = type
    }
    if (format !== undefined) {
      const validFormats = ['html', 'script', 'image_base64', 'video_base64', 'text_quill', 'url']
      if (!validFormats.includes(format)) {
        return NextResponse.json(
          { success: false, message: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.format = format
    }
    if (content !== undefined) updateData.content = content
    if (targetUrl !== undefined) updateData.targetUrl = targetUrl
    if (placement !== undefined) {
      if (!Array.isArray(placement) || placement.length === 0) {
        return NextResponse.json(
          { success: false, message: 'placement must be a non-empty array of strings' },
          { status: 400 }
        )
      }
      updateData.placement = placement
    }
    if (planId !== undefined) updateData.planId = planId
    if (priority !== undefined) updateData.priority = priority
    if (maxImpressions !== undefined) updateData.maxImpressions = maxImpressions
    if (maxClicks !== undefined) updateData.maxClicks = maxClicks
    if (maxConversions !== undefined) updateData.maxConversions = maxConversions
    if (startDate !== undefined) {
      updateData.startDate = Timestamp.fromDate(new Date(startDate))
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? Timestamp.fromDate(new Date(endDate)) : null
    }
    if (autoDeactivate !== undefined) updateData.autoDeactivate = autoDeactivate
    if (pixelUrls !== undefined) updateData.pixelUrls = pixelUrls
    if (clickPixelUrls !== undefined) updateData.clickPixelUrls = clickPixelUrls
    if (conversionPixelUrls !== undefined) updateData.conversionPixelUrls = conversionPixelUrls

    // Admin-only fields: status
    if (isUserAdmin && status !== undefined) {
      const validStatuses = ['pending', 'approved', 'active', 'paused', 'rejected', 'expired', 'completed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    // If partner updates a pending ad, keep it as pending
    if (!isUserAdmin && existingAd.status === 'pending') {
      updateData.status = 'pending'
    }

    await updateDoc('ads', id, updateData)

    const updatedAd = await getDoc('ads', id)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(updatedAd),
    })
  } catch (error) {
    console.error('[Ads] PUT [id] error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update ad' },
      { status: 500 }
    )
  }
}

// ─── DELETE — Delete an ad ───

export async function DELETE(
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

    // Verify auth
    const authHeader = request.headers.get('Authorization')
    const authResult = await verifyAuthToken(authHeader)

    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
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

    // Permission check
    const isUserAdmin = isAdmin(authResult.role)
    const isOwner = existingAd.partnerId === authResult.uid

    if (!isUserAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own ads' },
        { status: 403 }
      )
    }

    // Partners can only delete pending ads
    if (!isUserAdmin && existingAd.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only pending ads can be deleted. Contact an admin to remove active ads.' },
        { status: 403 }
      )
    }

    await deleteDoc('ads', id)

    return NextResponse.json({
      success: true,
      message: 'Ad deleted successfully',
    })
  } catch (error) {
    console.error('[Ads] DELETE [id] error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete ad' },
      { status: 500 }
    )
  }
}
