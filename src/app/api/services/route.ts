import { NextResponse } from 'next/server'
import { queryDocs, getDocByField, createDoc, getDoc } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    const services = await queryDocs('services', [
      { field: 'isPublished', op: '==', value: true },
    ], 'order', 'asc')

    return NextResponse.json({
      success: true,
      data: serializeFirestore(services),
      count: services.length,
    })
  } catch (error) {
    console.error('Services fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch services',
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

    // Validate required fields
    if (!slug || !title) {
      return NextResponse.json(
        {
          success: false,
          message: 'slug and title are required fields',
        },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const existing = await getDocByField('services', 'slug', slug)
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'A service with this slug already exists',
        },
        { status: 409 }
      )
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

    const serviceId = await createDoc('services', {
      slug,
      title,
      titleI18n: titleI18nValue ?? null,
      description: description ?? null,
      descriptionI18n: descriptionI18nValue ?? null,
      icon: icon ?? null,
      basePrice: basePrice ?? null,
      isFeatured: isFeatured ?? false,
      isPublished: isPublished ?? true,
      order: order ?? 0,
    })

    const service = await getDoc('services', serviceId)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(service),
    }, { status: 201 })
  } catch (error) {
    console.error('Service creation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create service',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
