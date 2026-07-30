import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDocByField, createDoc, updateDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all services (including unpublished) for admin
export async function GET() {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const services = await safeQueryDocs('services', [], 'order', 'asc')
    return NextResponse.json({ success: true, data: serializeFirestore(services) })
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
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { title, titleI18n, slug, description, descriptionI18n, icon, basePrice, isFeatured, isPublished, order } = body

    // Check if slug already exists
    const existing = await getDocByField('services', 'slug', slug)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 400 }
      )
    }

    const serviceId = await createDoc('services', {
      title,
      titleI18n: titleI18n || null,
      slug,
      description: description || null,
      descriptionI18n: descriptionI18n || null,
      icon: icon || null,
      basePrice: basePrice || null,
      isFeatured: isFeatured ?? false,
      isPublished: isPublished ?? false,
      order: order || 0,
    })

    const service = await safeGetDoc('services', serviceId)
    return NextResponse.json({ success: true, data: serializeFirestore(service) })
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
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

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
      const existing = await getDocByField('services', 'slug', slug)
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (titleI18n !== undefined) updateData.titleI18n = titleI18n || null
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description || null
    if (descriptionI18n !== undefined) updateData.descriptionI18n = descriptionI18n || null
    if (icon !== undefined) updateData.icon = icon || null
    if (basePrice !== undefined) updateData.basePrice = basePrice || null
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured ?? false
    if (isPublished !== undefined) updateData.isPublished = isPublished ?? false
    if (order !== undefined) updateData.order = order || 0

    await updateDoc('services', id, updateData)
    const service = await safeGetDoc('services', id)
    return NextResponse.json({ success: true, data: serializeFirestore(service) })
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
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    await deleteDoc('services', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin service delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
