import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Total counts
    const totalUsers = await db.user.count()
    const totalPosts = await db.post.count({ where: { published: true } })
    const totalProjects = await db.project.count({ where: { isPublished: true } })
    const totalServices = await db.service.count({ where: { isPublished: true } })
    const totalForumTopics = await db.forumTopic.count()
    const totalTestimonials = await db.testimonial.count({ where: { isPublished: true } })
    const totalNotifications = await db.notification.count()
    const totalCategories = await db.category.count()
    const totalTags = await db.tag.count()

    // Revenue stats (from payments)
    const payments = await db.payment.findMany()
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
    const confirmedPayments = payments.filter((p) => p.status === 'confirmed')
    const confirmedRevenue = confirmedPayments.reduce((sum, p) => sum + p.amount, 0)

    // Payment method breakdown
    const mpesaPayments = payments.filter((p) => p.method === 'mpesa')
    const transferPayments = payments.filter((p) => p.method === 'transfer')
    const depositPayments = payments.filter((p) => p.method === 'deposit')

    // User role breakdown
    const adminCount = await db.user.count({ where: { role: { name: 'admin' } } })
    const partnerCount = await db.user.count({ where: { role: { name: 'partner' } } })
    const regularUserCount = await db.user.count({ where: { role: { name: 'user' } } })

    // Active users
    const activeUsers = await db.user.count({ where: { isActive: true } })

    // Unread notifications
    const unreadNotifications = await db.notification.count({ where: { isRead: false } })

    // Featured projects & services
    const featuredProjects = await db.project.count({ where: { isFeatured: true, isPublished: true } })
    const featuredServices = await db.service.count({ where: { isFeatured: true, isPublished: true } })

    // Forum activity
    const pinnedTopics = await db.forumTopic.count({ where: { isPinned: true } })
    const resolvedTopics = await db.forumTopic.count({ where: { isResolved: true } })

    // Support tickets
    const openTickets = await db.supportTicket.count({ where: { status: 'open' } })
    const totalTickets = await db.supportTicket.count()

    // Recent activity (last 7 days approximation via total counts)
    const recentPosts = await db.post.count({
      where: { published: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalPosts,
          totalProjects,
          totalServices,
          totalForumTopics,
          totalTestimonials,
          totalRevenue,
          confirmedRevenue,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminCount,
          partners: partnerCount,
          regular: regularUserCount,
        },
        content: {
          publishedPosts: totalPosts,
          categories: totalCategories,
          tags: totalTags,
          recentPosts,
        },
        projects: {
          total: totalProjects,
          featured: featuredProjects,
        },
        services: {
          total: totalServices,
          featured: featuredServices,
        },
        forum: {
          topics: totalForumTopics,
          pinned: pinnedTopics,
          resolved: resolvedTopics,
        },
        payments: {
          total: payments.length,
          totalRevenue,
          confirmedRevenue,
          mpesa: mpesaPayments.length,
          transfer: transferPayments.length,
          deposit: depositPayments.length,
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
        },
        support: {
          totalTickets,
          openTickets,
        },
      },
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
