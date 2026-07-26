import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { success: false, message: 'postId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    const comments = await db.comment.findMany({
      where: {
        postId,
        isApproved: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: comments,
      count: comments.length,
    })
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch comments',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
