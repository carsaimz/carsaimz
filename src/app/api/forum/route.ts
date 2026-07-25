import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicSlug = searchParams.get('topic')

    if (topicSlug) {
      // Fetch a single topic with its replies and detailed info
      const topic = await db.forumTopic.findUnique({
        where: { slug: topicSlug },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          replies: {
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
            orderBy: { createdAt: 'asc' },
          },
          likes: {
            select: {
              id: true,
              userId: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
            },
          },
        },
      })

      if (!topic) {
        return NextResponse.json(
          { success: false, message: 'Topic not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: topic,
      })
    }

    // Fetch all forum categories with topics including replies
    const categories = await db.forumCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        topics: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            replies: {
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
              orderBy: { createdAt: 'asc' },
            },
            likes: {
              select: {
                id: true,
                userId: true,
              },
            },
            _count: {
              select: {
                replies: true,
                likes: true,
              },
            },
          },
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        _count: {
          select: {
            topics: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    })
  } catch (error) {
    console.error('Forum fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch forum data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
