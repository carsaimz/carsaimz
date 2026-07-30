import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { updateDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all forum topics (with category names)
export async function GET() {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const topics = await safeQueryDocs('forum_topics', [], 'createdAt', 'desc')

    // Enrich with category names
    const categories = await safeQueryDocs('forum_categories', [], 'order', 'asc')
    const catMap = new Map(categories.map((c: any) => [c.id, c.name]))

    const enriched = topics.map((topic: any) => ({
      ...topic,
      categoryName: catMap.get(topic.categoryId) || 'Unknown',
    }))

    return NextResponse.json({ success: true, data: serializeFirestore(enriched) })
  } catch (error) {
    console.error('Admin forum topics fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch forum topics' },
      { status: 500 }
    )
  }
}

// PUT update a forum topic (moderation)
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
    const { id, isPinned, isLocked, isResolved, categoryId } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {}
    if (isPinned !== undefined) updateData.isPinned = isPinned
    if (isLocked !== undefined) updateData.isLocked = isLocked
    if (isResolved !== undefined) updateData.isResolved = isResolved
    if (categoryId !== undefined) updateData.categoryId = categoryId

    await updateDoc('forum_topics', id, updateData)
    const topic = await safeGetDoc('forum_topics', id)
    return NextResponse.json({ success: true, data: serializeFirestore(topic) })
  } catch (error) {
    console.error('Admin forum topic update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update forum topic' },
      { status: 500 }
    )
  }
}

// DELETE a forum topic
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

    // Also delete replies
    try {
      const replies = await safeQueryDocs('forum_posts', [
        { field: 'topicId', op: '==', value: id },
      ])
      for (const reply of replies) {
        await deleteDoc('forum_posts', reply.id)
      }
    } catch {}

    await deleteDoc('forum_topics', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin forum topic delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete forum topic' },
      { status: 500 }
    )
  }
}
