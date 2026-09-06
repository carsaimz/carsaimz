import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/forum/posts — Create a forum reply (ForumPost)
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
    const topic = await db.forumTopic.findUnique({ where: { id: topicId } })
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
    const author = await db.user.findUnique({ where: { id: authorId } })
    if (!author) {
      return NextResponse.json(
        { success: false, message: 'Author not found' },
        { status: 400 }
      )
    }

    // Create the reply
    const reply = await db.forumPost.create({
      data: {
        content,
        topicId,
        authorId,
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
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...reply,
        _count: {
          likes: reply.likes.length,
        },
      },
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

// POST-like: /api/forum/posts?action=like — Toggle like on a forum reply (ForumPost)
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
    const forumPost = await db.forumPost.findUnique({ where: { id: postId } })
    if (!forumPost) {
      return NextResponse.json(
        { success: false, message: 'Forum post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLike = await db.forumPostLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    })

    if (existingLike) {
      // Remove like
      await db.forumPostLike.delete({
        where: { id: existingLike.id },
      })

      const likeCount = await db.forumPostLike.count({ where: { postId } })

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount,
      })
    } else {
      // Add like
      await db.forumPostLike.create({
        data: { postId, userId },
      })

      const likeCount = await db.forumPostLike.count({ where: { postId } })

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount,
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
