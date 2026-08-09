import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { createDoc, updateDoc, deleteDoc } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'
import { serializeFirestore } from '@/lib/serialize'

// GET all service reviews (including unpublished) for admin
export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const isPublished = searchParams.get('isPublished')

    // Build filters based on query params
    const filters: Array<{ field: string; op: '==' | '!=' | '<' | '<=' | '>' | '>='; value: any }> = []
    if (serviceId) {
      filters.push({ field: 'serviceId', op: '==', value: serviceId })
    }
    if (isPublished !== null && isPublished !== '') {
      filters.push({ field: 'isPublished', op: '==', value: isPublished === 'true' })
    }

    const reviews = await safeQueryDocs('service_reviews', filters, 'createdAt', 'desc')
    return NextResponse.json({ success: true, data: serializeFirestore(reviews) })
  } catch (error) {
    console.error('Admin service reviews fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch service reviews' },
      { status: 500 }
    )
  }
}

// POST create a new service review (admin)
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
    const { serviceId, serviceName, name, email, content, contentI18n, rating, isPublished } = body

    if (!serviceId || !name || !content) {
      return NextResponse.json(
        { success: false, message: 'serviceId, name, and content are required' },
        { status: 400 }
      )
    }

    const reviewId = await createDoc('service_reviews', {
      serviceId,
      serviceName: serviceName || null,
      name,
      email: email || null,
      content,
      contentI18n: contentI18n || null,
      rating: rating || 5,
      avatar: null,
      isPublished: isPublished || false,
    })

    const review = await safeGetDoc('service_reviews', reviewId)
    return NextResponse.json({ success: true, data: serializeFirestore(review) }, { status: 201 })
  } catch (error) {
    console.error('Admin service review create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create service review' },
      { status: 500 }
    )
  }
}

// PUT update a service review (admin)
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
    const { id, serviceId, serviceName, name, email, content, contentI18n, rating, isPublished, avatar } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    // Build i18n JSON strings if provided as objects, otherwise use as-is
    const contentI18nValue =
      typeof contentI18n === 'object' && contentI18n !== null
        ? buildI18nJson(contentI18n)
        : contentI18n

    const updateData: Record<string, any> = {}
    if (serviceId !== undefined) updateData.serviceId = serviceId
    if (serviceName !== undefined) updateData.serviceName = serviceName || null
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email || null
    if (content !== undefined) updateData.content = content
    if (contentI18nValue !== undefined) updateData.contentI18n = contentI18nValue || null
    if (rating !== undefined) updateData.rating = rating || 5
    if (isPublished !== undefined) updateData.isPublished = isPublished ?? false
    if (avatar !== undefined) updateData.avatar = avatar || null

    await updateDoc('service_reviews', id, updateData)
    const review = await safeGetDoc('service_reviews', id)
    return NextResponse.json({ success: true, data: serializeFirestore(review) })
  } catch (error) {
    console.error('Admin service review update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update service review' },
      { status: 500 }
    )
  }
}

// DELETE a service review (admin)
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

    await deleteDoc('service_reviews', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin service review delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete service review' },
      { status: 500 }
    )
  }
}
