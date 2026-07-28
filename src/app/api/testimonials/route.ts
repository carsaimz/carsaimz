import { NextResponse } from 'next/server'
import { queryDocs, createDoc, getDoc } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    const testimonials = await queryDocs('testimonials', [
      { field: 'isPublished', op: '==', value: true },
    ], 'createdAt', 'desc')

    // Select only public fields
    const publicTestimonials = testimonials.map((t: any) => ({
      id: t.id,
      name: t.name,
      company: t.company,
      content: t.content,
      contentI18n: t.contentI18n,
      rating: t.rating,
      avatar: t.avatar,
      createdAt: serializeFirestore(t.createdAt),
    }))

    return NextResponse.json({
      success: true,
      data: publicTestimonials,
      count: publicTestimonials.length,
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

    const testimonialId = await createDoc('testimonials', {
      name,
      company: company ?? null,
      content,
      contentI18n: contentI18nValue ?? null,
      rating: rating ?? 5,
      avatar: avatar ?? null,
      isPublished: isPublished ?? true,
    })

    const testimonial = await getDoc('testimonials', testimonialId)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(testimonial),
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
