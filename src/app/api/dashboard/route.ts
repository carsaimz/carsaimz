import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Use the provided role or fall back to the user's actual role
    const effectiveRole = role || (user.role?.name || 'user')

    // === ADMIN / SUPER_ADMIN DASHBOARD ===
    if (effectiveRole === 'admin' || effectiveRole === 'super_admin') {
      const [
        totalUsers,
        totalPosts,
        totalQuotes,
        totalPayments,
        totalTickets,
        totalForumTopics,
        recentUsers,
        recentQuotes,
        recentPayments,
        recentTickets,
        quoteStats,
        paymentStats,
        ticketStats,
        totalRevenue,
        recentPosts,
      ] = await Promise.all([
        // Total counts
        db.user.count({ where: { role: { name: { not: 'super_admin' } } } }),
        db.post.count({ where: { published: true } }),
        db.quote.count(),
        db.payment.count(),
        db.supportTicket.count(),
        db.forumTopic.count(),

        // Recent activity (last 10)
        db.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: { role: { name: { not: 'super_admin' } } },
          select: { id: true, name: true, email: true, createdAt: true, isActive: true },
        }),
        db.quote.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        db.payment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            proposal: { select: { id: true, title: true } },
          },
        }),
        db.supportTicket.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),

        // Quote status breakdown
        db.quote.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        // Payment status breakdown
        db.payment.groupBy({
          by: ['status'],
          _count: { status: true },
          _sum: { amount: true },
        }),
        // Ticket status breakdown
        db.supportTicket.groupBy({
          by: ['status'],
          _count: { status: true },
        }),

        // Total revenue from confirmed payments
        db.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'confirmed' },
        }),

        // Recent published posts
        db.post.findMany({
          take: 5,
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true } },
            _count: { select: { comments: true } },
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          role: 'admin',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
          stats: {
            totalUsers,
            totalPosts,
            totalQuotes,
            totalPayments,
            totalTickets,
            totalForumTopics,
            totalRevenue: totalRevenue._sum.amount || 0,
          },
          breakdowns: {
            quotes: quoteStats.map((q) => ({ status: q.status, count: q._count.status })),
            payments: paymentStats.map((p) => ({
              status: p.status,
              count: p._count.status,
              total: p._sum.amount || 0,
            })),
            tickets: ticketStats.map((t) => ({ status: t.status, count: t._count.status })),
          },
          recentActivity: {
            users: recentUsers,
            quotes: recentQuotes,
            payments: recentPayments,
            tickets: recentTickets,
            posts: recentPosts,
          },
        },
      })
    }

    // === PARTNER DASHBOARD ===
    if (effectiveRole === 'partner') {
      const [
        totalClicks,
        totalCommissions,
        pendingCommissions,
        approvedCommissions,
        paidCommissions,
        totalCommissionAmount,
        recentClicks,
        recentCommissions,
      ] = await Promise.all([
        db.affiliateClick.count({ where: { userId } }),
        db.affiliateCommission.count({ where: { userId } }),
        db.affiliateCommission.count({ where: { userId, status: 'pending' } }),
        db.affiliateCommission.count({ where: { userId, status: 'approved' } }),
        db.affiliateCommission.count({ where: { userId, status: 'paid' } }),
        db.affiliateCommission.aggregate({
          _sum: { amount: true },
          where: { userId },
        }),
        db.affiliateClick.findMany({
          where: { userId },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        db.affiliateCommission.findMany({
          where: { userId },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          role: 'partner',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
          stats: {
            totalClicks,
            totalCommissions,
            pendingCommissions,
            approvedCommissions,
            paidCommissions,
            totalCommissionAmount: totalCommissionAmount._sum.amount || 0,
          },
          recentActivity: {
            clicks: recentClicks,
            commissions: recentCommissions,
          },
        },
      })
    }

    // === USER DASHBOARD ===
    const [
      userQuotes,
      userPayments,
      userTickets,
      userNotifications,
      quoteCount,
      paymentCount,
      ticketCount,
      unreadNotifications,
    ] = await Promise.all([
      db.quote.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          proposals: {
            select: {
              id: true,
              title: true,
              totalAmount: true,
              status: true,
            },
          },
        },
      }),
      db.payment.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          proposal: {
            select: {
              id: true,
              title: true,
              totalAmount: true,
            },
          },
        },
      }),
      db.supportTicket.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { replies: true },
          },
        },
      }),
      db.notification.findMany({
        where: { userId, isRead: false },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      db.quote.count({ where: { userId } }),
      db.payment.count({ where: { userId } }),
      db.supportTicket.count({ where: { userId } }),
      db.notification.count({ where: { userId, isRead: false } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        role: 'user',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
        },
        stats: {
          totalQuotes: quoteCount,
          totalPayments: paymentCount,
          totalTickets: ticketCount,
          unreadNotifications,
        },
        recentActivity: {
          quotes: userQuotes,
          payments: userPayments,
          tickets: userTickets,
          notifications: userNotifications,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
