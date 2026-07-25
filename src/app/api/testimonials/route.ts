import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        name: true,
        company: true,
        content: true,
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
