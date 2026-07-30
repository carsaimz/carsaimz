import { NextRequest, NextResponse } from 'next/server'
import { createDoc, getDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topicId, content, authorId } = body

    if (!topicId || !content || !authorId) {
      return NextResponse.json(
        { success: false, message: 'topicId, content, and authorId are required' },
        { status: 400 }
      )
    }

    // Verify the topic exists
    const topic = await getDoc('forum_topics', topicId)

    if (!topic) {
      return NextResponse.json(
        { success: false, message: 'Topic not found' },
        { status: 404 }
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

    const replyId = await createDoc('forum_posts', {
      topicId,
      content,
      authorId,
    })

    const reply = await getDoc('forum_posts', replyId)

    // Enrich with author data
    const enrichedReply = serializeFirestore({
      ...reply,
      author: {
        id: (author as any).id,
        name: (author as any).name,
        email: (author as any).email,
        avatar: (author as any).avatar,
      },
    })

    return NextResponse.json({
      success: true,
      data: enrichedReply,
      message: 'Reply created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Forum reply create error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create forum reply',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
