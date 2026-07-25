import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const posts = await db.post.findMany({
      where: { published: true },
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
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform tags to a cleaner format
    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    }))

    return NextResponse.json({
      success: true,
      data: formattedPosts,
      count: formattedPosts.length,
    })
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch posts',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
