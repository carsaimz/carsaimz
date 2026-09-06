import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, createDoc, deleteDoc, updateDoc, increment } from '@/lib/db'

// POST /api/forum/likes — Toggle like on a forum topic (Firestore)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topicId, userId } = body

    if (!topicId || !userId) {
      return NextResponse.json(
        { success: false, message: 'topicId and userId are required' },
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

    // Check if user already liked
    const existingLikes = await queryDocs('forum_likes', [
      { field: 'topicId', op: '==', value: topicId },
      { field: 'userId', op: '==', value: userId },
    ])
    const existingLike = existingLikes[0]

    if (existingLike) {
      // Remove like (toggle off)
      await deleteDoc('forum_likes', existingLike.id)
      await updateDoc('forum_topics', topicId, { likesCount: increment(-1) })

      const likes = await queryDocs('forum_likes', [{ field: 'topicId', op: '==', value: topicId }])

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount: likes.length,
      })
    } else {
      // Add like (toggle on)
      await createDoc('forum_likes', { topicId, userId, createdAt: new Date().toISOString() })
      await updateDoc('forum_topics', topicId, { likesCount: increment(1) })

      const likes = await queryDocs('forum_likes', [{ field: 'topicId', op: '==', value: topicId }])

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount: likes.length,
      })
    }
  } catch (error) {
    console.error('Forum like toggle error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to toggle like',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
