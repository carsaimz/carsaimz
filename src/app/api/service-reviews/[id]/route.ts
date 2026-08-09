import { NextRequest, NextResponse } from 'next/server'
import { getDoc, updateDoc, deleteDoc } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'
import { serializeFirestore } from '@/lib/serialize'
import { verifyAuthToken, isAdmin } from '@/lib/ads-helpers'

/**
 * GET /api/service-reviews/[id]
 * Fetch a single review by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const review = await getDoc('service_reviews', id)

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeFirestore(review),
    })
  } catch (error) {
    console.error('Service review fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch review',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/service-reviews/[id]
 * Update a review (admin only — requires Authorization header with admin/super_admin role).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check that the review exists
    const existing = await getDoc('service_reviews', id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      email,
      rating,
      content,
      contentI18n,
      avatar,
      isPublished,
      serviceName,
    } = body

    // Build i18n JSON strings if provided as objects, otherwise use as-is
    const contentI18nValue =
      typeof contentI18n === 'object' && contentI18n !== null
        ? buildI18nJson(contentI18n)
        : contentI18n

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (rating !== undefined) updateData.rating = rating
    if (content !== undefined) updateData.content = content
    if (contentI18nValue !== undefined) updateData.contentI18n = contentI18nValue
    if (avatar !== undefined) updateData.avatar = avatar
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (serviceName !== undefined) updateData.serviceName = serviceName

    await updateDoc('service_reviews', id, updateData)
    const review = await getDoc('service_reviews', id)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(review),
    })
  } catch (error) {
    console.error('Service review update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update review',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/service-reviews/[id]
 * Delete a review (admin only — requires Authorization header with admin/super_admin role).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check that the review exists
    const existing = await getDoc('service_reviews', id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    await deleteDoc('service_reviews', id)

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Service review delete error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete review',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
