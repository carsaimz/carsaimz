import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/posts/likes — Toggle like on a blog post
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
    const post = await db.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLike = await db.postLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    })

    if (existingLike) {
      // Remove like (toggle off)
      await db.postLike.delete({
        where: { id: existingLike.id },
      })

      const likeCount = await db.postLike.count({ where: { postId } })

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount,
      })
    } else {
      // Add like (toggle on)
      await db.postLike.create({
        data: { postId, userId },
      })

      const likeCount = await db.postLike.count({ where: { postId } })

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount,
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
