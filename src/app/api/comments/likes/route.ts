import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, createDoc, deleteDoc, updateDoc, increment } from '@/lib/db'

// POST /api/comments/likes — Toggle like on a comment (Firestore)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { commentId, userId } = body

    if (!commentId || !userId) {
      return NextResponse.json(
        { success: false, message: 'commentId and userId are required' },
        { status: 400 }
      )
    }

    // Verify the comment exists
    const comment = await getDoc('comments', commentId)
    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLikes = await queryDocs('comment_likes', [
      { field: 'commentId', op: '==', value: commentId },
      { field: 'userId', op: '==', value: userId },
    ])
    const existingLike = existingLikes[0]

    if (existingLike) {
      // Remove like (toggle off)
      await deleteDoc('comment_likes', existingLike.id)
      await updateDoc('comments', commentId, { likesCount: increment(-1) })

      const likes = await queryDocs('comment_likes', [{ field: 'commentId', op: '==', value: commentId }])

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount: likes.length,
      })
    } else {
      // Add like (toggle on)
      await createDoc('comment_likes', { commentId, userId, createdAt: new Date().toISOString() })
      await updateDoc('comments', commentId, { likesCount: increment(1) })

      const likes = await queryDocs('comment_likes', [{ field: 'commentId', op: '==', value: commentId }])

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount: likes.length,
      })
    }
  } catch (error) {
    console.error('Comment like toggle error:', error)
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
