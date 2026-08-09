import { NextRequest, NextResponse } from 'next/server'
import { queryDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

/**
 * GET /api/service-reviews?serviceId=xxx
 * Fetch published reviews for a specific service.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json(
        { success: false, message: 'serviceId query parameter is required' },
        { status: 400 }
      )
    }

    const reviews = await queryDocs('service_reviews', [
      { field: 'serviceId', op: '==', value: serviceId },
      { field: 'isPublished', op: '==', value: true },
    ], 'createdAt', 'desc')

    // Select only public fields
    const publicReviews = reviews.map((r: any) => ({
      id: r.id,
      serviceId: r.serviceId,
      name: r.name,
      rating: r.rating,
      content: r.content,
      contentI18n: r.contentI18n,
      avatar: r.avatar,
      createdAt: serializeFirestore(r.createdAt),
    }))

    return NextResponse.json({
      success: true,
      data: publicReviews,
      count: publicReviews.length,
    })
  } catch (error) {
    console.error('Service reviews fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch service reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
