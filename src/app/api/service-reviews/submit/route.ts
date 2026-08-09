import { NextRequest, NextResponse } from 'next/server'
import { createDoc } from '@/lib/db'

/**
 * POST /api/service-reviews/submit
 * Submit a new service review (public, no auth required).
 * Body: { serviceId, name, email?, rating (1-5), content }
 * Creates a review with isPublished: false (needs admin approval).
 * Returns: { success: true, message: 'Review submitted for review' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      serviceId,
      name,
      email,
      rating,
      content,
    } = body

    // Validate required fields
    if (!serviceId || !name || !content) {
      return NextResponse.json(
        {
          success: false,
          message: 'serviceId, name, and content are required fields',
        },
        { status: 400 }
      )
    }

    // Validate rating
    const ratingValue = typeof rating === 'number' ? Math.min(5, Math.max(1, rating)) : 5

    // Validate content length
    if (content.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: 'Content must be at least 10 characters long',
        },
        { status: 400 }
      )
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Content must be less than 2000 characters',
        },
        { status: 400 }
      )
    }

    // Create review with isPublished: false (needs admin approval)
    await createDoc('service_reviews', {
      serviceId: serviceId.trim(),
      serviceName: null,
      name: name.trim(),
      email: email?.trim() || null,
      rating: ratingValue,
      content: content.trim(),
      contentI18n: null,
      avatar: null,
      isPublished: false,
    })

    return NextResponse.json({
      success: true,
      message: 'Review submitted for review',
    })
  } catch (error) {
    console.error('[Service Reviews Submit] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit review',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
