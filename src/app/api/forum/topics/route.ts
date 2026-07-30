import { NextRequest, NextResponse } from 'next/server'
import { createDoc, getDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, content, categoryId, authorId } = body

    if (!title || !slug || !content || !categoryId || !authorId) {
      return NextResponse.json(
        { success: false, message: 'title, slug, content, categoryId, and authorId are required' },
        { status: 400 }
      )
    }

    // Verify the author exists
    const author = await getDoc('users', authorId)

    if (!author) {
      return NextResponse.json(
        { success: false, message: 'Author not found' },
        { status: 404 }
      )
    }

    // Verify the category exists
    const category = await getDoc('forum_categories', categoryId)

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    const topicId = await createDoc('forum_topics', {
      title,
      slug,
      content,
      categoryId,
      authorId,
      isPinned: false,
      isLocked: false,
    })

    const topic = await getDoc('forum_topics', topicId)

    // Enrich with author and category data
    const enrichedTopic = serializeFirestore({
      ...topic,
      author: {
        id: (author as any).id,
        name: (author as any).name,
        email: (author as any).email,
        avatar: (author as any).avatar,
      },
      category: {
        id: (category as any).id,
        name: (category as any).name,
        slug: (category as any).slug,
        description: (category as any).description,
      },
    })

    return NextResponse.json({
      success: true,
      data: enrichedTopic,
      message: 'Topic created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Forum topic create error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create forum topic',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
