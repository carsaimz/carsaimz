import { NextResponse } from 'next/server'
import { queryDocs, getDocs, getDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    const notifications = await queryDocs('notifications', [], 'createdAt', 'desc')

    // Enrich with user data
    const enrichedNotifications = await Promise.all(
      notifications.map(async (n: any) => {
        let user: any = null
        if (n.userId) {
          const userDoc = await getDoc('users', n.userId)
          if (userDoc) {
            user = { id: userDoc.id, name: userDoc.name, email: userDoc.email, avatar: userDoc.avatar }
          }
        }
        return serializeFirestore({ ...n, user })
      })
    )

    // Summary stats
    const unreadCount = enrichedNotifications.filter((n: any) => !n.isRead).length
    const typeBreakdown = enrichedNotifications.reduce(
      (acc: Record<string, number>, n: any) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      data: enrichedNotifications,
      meta: {
        total: enrichedNotifications.length,
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
