import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      include: {
        user: {
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

    // Summary stats
    const unreadCount = notifications.filter((n) => !n.isRead).length
    const typeBreakdown = notifications.reduce(
      (acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      data: notifications,
      meta: {
        total: notifications.length,
        unread: unreadCount,
        types: typeBreakdown,
      },
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
