import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const service = await db.service.findUnique({
      where: { id },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: service,
    })
  } catch (error) {
    console.error('Service fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch service',
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

    // Check that the service exists
    const existing = await db.service.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Service not found' },
        { status: 404 }
      )
    }

    const {
      slug,
      title,
      titleI18n,
      description,
      descriptionI18n,
      icon,
      basePrice,
      isFeatured,
      isPublished,
      order,
    } = body

    // If slug is being changed, check for duplicates
    if (slug && slug !== existing.slug) {
      const duplicate = await db.service.findUnique({ where: { slug } })
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: 'A service with this slug already exists',
          },
          { status: 409 }
        )
      }
    }

    // Build i18n JSON strings if provided as objects, otherwise use as-is
    const titleI18nValue =
      typeof titleI18n === 'object' && titleI18n !== null
        ? buildI18nJson(titleI18n)
        : titleI18n

    const descriptionI18nValue =
      typeof descriptionI18n === 'object' && descriptionI18n !== null
        ? buildI18nJson(descriptionI18n)
        : descriptionI18n

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (slug !== undefined) updateData.slug = slug
    if (title !== undefined) updateData.title = title
    if (titleI18nValue !== undefined) updateData.titleI18n = titleI18nValue
    if (description !== undefined) updateData.description = description
    if (descriptionI18nValue !== undefined) updateData.descriptionI18n = descriptionI18nValue
    if (icon !== undefined) updateData.icon = icon
    if (basePrice !== undefined) updateData.basePrice = basePrice
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (order !== undefined) updateData.order = order

    const service = await db.service.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: service,
    })
  } catch (error) {
    console.error('Service update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update service',
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

    // Check that the service exists
    const existing = await db.service.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Service not found' },
        { status: 404 }
      )
    }

    await db.service.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error) {
    console.error('Service delete error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete service',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
