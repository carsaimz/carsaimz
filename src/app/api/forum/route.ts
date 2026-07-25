import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
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
