import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/comments/likes — Toggle like on a comment
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
    const comment = await db.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLike = await db.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    })

    if (existingLike) {
      // Remove like (toggle off)
      await db.commentLike.delete({
        where: { id: existingLike.id },
      })

      const likeCount = await db.commentLike.count({ where: { commentId } })

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount,
      })
    } else {
      // Add like (toggle on)
      await db.commentLike.create({
        data: { commentId, userId },
      })

      const likeCount = await db.commentLike.count({ where: { commentId } })

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount,
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
