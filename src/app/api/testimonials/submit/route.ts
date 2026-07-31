import { NextRequest, NextResponse } from 'next/server'
import { createDoc } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'

/**
 * POST /api/testimonials/submit
 * Submit a new testimonial (public, no auth required)
 * Body: { name, email, company, rating, content }
 * Creates a testimonial with isPublished: false (needs admin approval)
 * Returns: { success: true, message: 'Testimonial submitted for review' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name,
      email,
      company,
      content,
      rating,
    } = body

    // Validate required fields
    if (!name || !content) {
      return NextResponse.json(
        {
          success: false,
          message: 'name and content are required fields',
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

    // Create testimonial with isPublished: false (needs admin approval)
    await createDoc('testimonials', {
      name: name.trim(),
      email: email?.trim() || null,
      company: company?.trim() || null,
      content: content.trim(),
      contentI18n: null,
      rating: ratingValue,
      avatar: null,
      isPublished: false,
    })

    return NextResponse.json({
      success: true,
      message: 'Testimonial submitted for review',
    })
  } catch (error) {
    console.error('[Testimonials Submit] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit testimonial',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
