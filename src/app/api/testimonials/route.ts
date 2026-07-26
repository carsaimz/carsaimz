import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        name: true,
        company: true,
        content: true,
        contentI18n: true,
        rating: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: testimonials,
      count: testimonials.length,
    })
  } catch (error) {
    console.error('Testimonials fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch testimonials',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      name,
      company,
      content,
      contentI18n,
      rating,
      avatar,
      isPublished,
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

    // Build i18n JSON strings if provided as objects, otherwise use as-is
    const contentI18nValue =
      typeof contentI18n === 'object' && contentI18n !== null
        ? buildI18nJson(contentI18n)
        : contentI18n

    const testimonial = await db.testimonial.create({
      data: {
        name,
        company: company ?? undefined,
        content,
        contentI18n: contentI18nValue ?? undefined,
        rating: rating ?? 5,
        avatar: avatar ?? undefined,
        isPublished: isPublished ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      data: testimonial,
    }, { status: 201 })
  } catch (error) {
    console.error('Testimonial creation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create testimonial',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
