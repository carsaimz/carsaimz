import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDocByField, createDoc, updateDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all forum categories
export async function GET() {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const categories = await safeQueryDocs('forum_categories', [], 'order', 'asc')
    return NextResponse.json({ success: true, data: serializeFirestore(categories) })
  } catch (error) {
    console.error('Admin forum categories fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch forum categories' },
      { status: 500 }
    )
  }
}

// POST create a forum category
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
    const { name, slug, description, order, nameI18n } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const existing = await getDocByField('forum_categories', 'slug', slug)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 400 }
      )
    }

    const docData: Record<string, any> = {
      name,
      slug,
      description: description || null,
      order: order || 0,
      createdAt: new Date().toISOString(),
    }

    // Store i18n translations if provided
    // nameI18n is a JSON object like { "en-us": "General", "fr-fr": "Général", ... }
    if (nameI18n && typeof nameI18n === 'object') {
      docData.nameI18n = nameI18n
    }

    const categoryId = await createDoc('forum_categories', docData)

    const category = await safeGetDoc('forum_categories', categoryId)
    return NextResponse.json({ success: true, data: serializeFirestore(category) })
  } catch (error) {
    console.error('Admin forum category create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create forum category' },
      { status: 500 }
    )
  }
}

// PUT update a forum category
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
    const { id, name, slug, description, order, nameI18n } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    if (slug) {
      const existing = await getDocByField('forum_categories', 'slug', slug)
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
    if (description !== undefined) updateData.description = description || null
    if (order !== undefined) updateData.order = order
    if (nameI18n !== undefined) updateData.nameI18n = nameI18n || null

    await updateDoc('forum_categories', id, updateData)
    const category = await safeGetDoc('forum_categories', id)
    return NextResponse.json({ success: true, data: serializeFirestore(category) })
  } catch (error) {
    console.error('Admin forum category update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update forum category' },
      { status: 500 }
    )
  }
}

// DELETE a forum category
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

    await deleteDoc('forum_categories', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin forum category delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete forum category' },
      { status: 500 }
    )
  }
}
