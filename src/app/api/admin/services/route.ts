import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all services (including unpublished) for admin
export async function GET() {
  try {
    const services = await db.service.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('Admin services fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

// POST create a new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, titleI18n, slug, description, descriptionI18n, icon, basePrice, isFeatured, isPublished, order } = body

    // Check if slug already exists
    const existing = await db.service.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        title,
        titleI18n: titleI18n || null,
        slug,
        description: description || null,
        descriptionI18n: descriptionI18n || null,
        icon: icon || null,
        basePrice: basePrice || null,
        isFeatured: isFeatured || false,
        isPublished: isPublished || false,
        order: order || 0,
      },
    })
    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('Admin service create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create service' },
      { status: 500 }
    )
  }
}

// PUT update a service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, titleI18n, slug, description, descriptionI18n, icon, basePrice, isFeatured, isPublished, order } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    // Check if slug is taken by another service
    if (slug) {
      const existing = await db.service.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    const service = await db.service.update({
      where: { id },
      data: {
        title,
        titleI18n: titleI18n || null,
        slug,
        description: description || null,
        descriptionI18n: descriptionI18n || null,
        icon: icon || null,
        basePrice: basePrice || null,
        isFeatured: isFeatured || false,
        isPublished: isPublished || false,
        order: order || 0,
      },
    })
    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('Admin service update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update service' },
      { status: 500 }
    )
  }
}

// DELETE a service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    await db.service.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin service delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
