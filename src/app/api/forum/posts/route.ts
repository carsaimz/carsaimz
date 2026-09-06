import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, createDoc, deleteDoc, updateDoc, increment } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// POST /api/forum/posts — Create a forum reply (Firestore)
// Note: This is an alias for /api/forum/replies for backwards compatibility.
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

    // Verify the topic exists and is not locked
    const topic = await getDoc('forum_topics', topicId)
    if (!topic) {
      return NextResponse.json(
        { success: false, message: 'Topic not found' },
        { status: 404 }
      )
    }

    if (topic.isLocked) {
      return NextResponse.json(
        { success: false, message: 'Topic is locked, cannot add replies' },
        { status: 403 }
      )
    }

    // Verify the author exists
    const author = await getDoc('users', authorId)
    if (!author) {
      return NextResponse.json(
        { success: false, message: 'Author not found' },
        { status: 400 }
      )
    }

    // Create the reply
    const replyId = await createDoc('forum_posts', {
      content,
      topicId,
      authorId,
      likesCount: 0,
      createdAt: new Date().toISOString(),
    })
    const reply = await getDoc('forum_posts', replyId)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(reply),
    }, { status: 201 })
  } catch (error) {
    console.error('Forum reply creation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create reply',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/forum/posts — Toggle like on a forum reply (Firestore)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, userId } = body

    if (!postId || !userId) {
      return NextResponse.json(
        { success: false, message: 'postId and userId are required' },
        { status: 400 }
      )
    }

    // Verify the forum post exists
    const forumPost = await getDoc('forum_posts', postId)
    if (!forumPost) {
      return NextResponse.json(
        { success: false, message: 'Forum post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLikes = await queryDocs('forum_post_likes', [
      { field: 'postId', op: '==', value: postId },
      { field: 'userId', op: '==', value: userId },
    ])
    const existingLike = existingLikes[0]

    if (existingLike) {
      // Remove like
      await deleteDoc('forum_post_likes', existingLike.id)
      await updateDoc('forum_posts', postId, { likesCount: increment(-1) })

      const likes = await queryDocs('forum_post_likes', [{ field: 'postId', op: '==', value: postId }])

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount: likes.length,
      })
    } else {
      // Add like
      await createDoc('forum_post_likes', { postId, userId, createdAt: new Date().toISOString() })
      await updateDoc('forum_posts', postId, { likesCount: increment(1) })

      const likes = await queryDocs('forum_post_likes', [{ field: 'postId', op: '==', value: postId }])

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount: likes.length,
      })
    }
  } catch (error) {
    console.error('Forum post like toggle error:', error)
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
