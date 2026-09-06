import { NextRequest, NextResponse } from 'next/server'
import { getDoc, getDocByField, createDoc, deleteDoc, queryDocs, updateDoc } from '@/lib/db'
import { increment } from '@/lib/db'

// POST /api/posts/likes — Toggle like on a blog post (Firestore)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, userId } = body

    if (!postId || !userId) {
      return NextResponse.json(
        { success: false, message: 'postId and userId are required' },
        { status: 400 }
      )
    }

    // Verify the post exists
    const post = await getDoc('posts', postId)
    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked (Firestore: query post_likes by postId + userId)
    const existingLikes = await queryDocs('post_likes', [
      { field: 'postId', op: '==', value: postId },
      { field: 'userId', op: '==', value: userId },
    ])
    const existingLike = existingLikes[0]

    if (existingLike) {
      // Remove like (toggle off)
      await deleteDoc('post_likes', existingLike.id)
      await updateDoc('posts', postId, { likesCount: increment(-1) })

      const likes = await queryDocs('post_likes', [{ field: 'postId', op: '==', value: postId }])

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount: likes.length,
      })
    } else {
      // Add like (toggle on)
      await createDoc('post_likes', { postId, userId, createdAt: new Date().toISOString() })
      await updateDoc('posts', postId, { likesCount: increment(1) })

      const likes = await queryDocs('post_likes', [{ field: 'postId', op: '==', value: postId }])

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount: likes.length,
      })
    }
  } catch (error) {
    console.error('Post like toggle error:', error)
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
