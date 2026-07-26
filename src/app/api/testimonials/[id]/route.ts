import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const testimonial = await db.testimonial.findUnique({
      where: { id },
    })

    if (!testimonial) {
      return NextResponse.json(
        { success: false, message: 'Testimonial not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: testimonial,
    })
  } catch (error) {
    console.error('Testimonial fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch testimonial',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check that the testimonial exists
    const existing = await db.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Testimonial not found' },
        { status: 404 }
      )
    }

    const {
      name,
      company,
      content,
      contentI18n,
      rating,
      avatar,
      isPublished,
    } = body

    // Build i18n JSON strings if provided as objects, otherwise use as-is
    const contentI18nValue =
      typeof contentI18n === 'object' && contentI18n !== null
        ? buildI18nJson(contentI18n)
        : contentI18n

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (company !== undefined) updateData.company = company
    if (content !== undefined) updateData.content = content
    if (contentI18nValue !== undefined) updateData.contentI18n = contentI18nValue
    if (rating !== undefined) updateData.rating = rating
    if (avatar !== undefined) updateData.avatar = avatar
    if (isPublished !== undefined) updateData.isPublished = isPublished

    const testimonial = await db.testimonial.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: testimonial,
    })
  } catch (error) {
    console.error('Testimonial update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update testimonial',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check that the testimonial exists
    const existing = await db.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Testimonial not found' },
        { status: 404 }
      )
    }

    await db.testimonial.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully',
    })
  } catch (error) {
    console.error('Testimonial delete error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete testimonial',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
