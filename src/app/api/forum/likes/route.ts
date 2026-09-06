import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/forum/likes — Toggle like on a forum topic
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
    const topic = await db.forumTopic.findUnique({ where: { id: topicId } })
    if (!topic) {
      return NextResponse.json(
        { success: false, message: 'Topic not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLike = await db.forumLike.findUnique({
      where: {
        topicId_userId: { topicId, userId },
      },
    })

    if (existingLike) {
      // Remove like (toggle off)
      await db.forumLike.delete({
        where: { id: existingLike.id },
      })

      const likeCount = await db.forumLike.count({ where: { topicId } })

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount,
      })
    } else {
      // Add like (toggle on)
      await db.forumLike.create({
        data: { topicId, userId },
      })

      const likeCount = await db.forumLike.count({ where: { topicId } })

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount,
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
