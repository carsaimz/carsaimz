import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDocByField, createDoc, updateDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

const VALID_TYPES = ['posts', 'services', 'projects'] as const
type CategoryType = (typeof VALID_TYPES)[number]

// GET all categories for admin (with optional type filter)
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
    const type = searchParams.get('type') as CategoryType | null

    const filters: Array<{ field: string; op: '==' | '!=' | '>' | '<' | '>=' | '<='; value: any }> = []

    if (type && VALID_TYPES.includes(type)) {
      filters.push({ field: 'type', op: '==', value: type })
    }

    const categories = await safeQueryDocs('categories', filters, 'name', 'asc')
    return NextResponse.json({ success: true, data: serializeFirestore(categories) })
  } catch (error) {
    console.error('Admin categories fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST create a new category
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
    const { name, slug, type } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: 'Name and slug are required' },
        { status: 400 }
      )
    }

    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Type must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await getDocByField('categories', 'slug', slug)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 400 }
      )
    }

    const categoryData: Record<string, any> = {
      name,
      slug,
      createdAt: new Date().toISOString(),
    }

    if (type) {
      categoryData.type = type
    }

    const categoryId = await createDoc('categories', categoryData)

    const category = await safeGetDoc('categories', categoryId)
    return NextResponse.json({ success: true, data: serializeFirestore(category) })
  } catch (error) {
    console.error('Admin category create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// PUT update a category
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
    const { id, name, slug, type } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Type must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (slug) {
      const existing = await getDocByField('categories', 'slug', slug)
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (type !== undefined) updateData.type = type

    await updateDoc('categories', id, updateData)
    const category = await safeGetDoc('categories', id)
    return NextResponse.json({ success: true, data: serializeFirestore(category) })
  } catch (error) {
    console.error('Admin category update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE a category
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

    await deleteDoc('categories', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin category delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
