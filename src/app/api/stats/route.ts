import { NextResponse } from 'next/server'
import { countDocs, getDocs, queryDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    // Total counts — Firestore doesn't support relation-based filtering,
    // so we filter in JS where needed
    const allUsers = await getDocs('users')
    const roles = await getDocs('roles')
    const roleMap = new Map(roles.map(r => [r.id, r]))

    // Exclude super_admin from user count
    const nonSuperAdminUsers = allUsers.filter((u: any) => {
      const uRole = u.roleId ? roleMap.get(u.roleId) : null
      return uRole?.name !== 'super_admin'
    })

    const totalUsers = nonSuperAdminUsers.length
    const totalPosts = await countDocs('posts', [{ field: 'published', op: '==', value: true }])
    const totalProjects = await countDocs('projects', [{ field: 'isPublished', op: '==', value: true }])
    const totalServices = await countDocs('services', [{ field: 'isPublished', op: '==', value: true }])
    const totalForumTopics = await countDocs('forum_topics')
    const totalTestimonials = await countDocs('testimonials', [{ field: 'isPublished', op: '==', value: true }])
    const totalNotifications = await countDocs('notifications')
    const totalCategories = await countDocs('categories')
    const totalTags = await countDocs('tags')

    // Revenue stats (from payments)
    const payments = await getDocs('payments')
    const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const confirmedPayments = payments.filter((p: any) => p.status === 'confirmed')
    const confirmedRevenue = confirmedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    // Payment method breakdown
    const mpesaPayments = payments.filter((p: any) => p.method === 'mpesa')
    const transferPayments = payments.filter((p: any) => p.method === 'transfer')
    const depositPayments = payments.filter((p: any) => p.method === 'deposit')

    // User role breakdown
    const adminCount = allUsers.filter((u: any) => {
      const uRole = u.roleId ? roleMap.get(u.roleId) : null
      return uRole?.name === 'admin'
    }).length

    const partnerCount = allUsers.filter((u: any) => {
      const uRole = u.roleId ? roleMap.get(u.roleId) : null
      return uRole?.name === 'partner'
    }).length

    const regularUserCount = allUsers.filter((u: any) => {
      const uRole = u.roleId ? roleMap.get(u.roleId) : null
      return uRole?.name === 'user'
    }).length

    // Active users (exclude super_admin)
    const activeUsers = nonSuperAdminUsers.filter((u: any) => u.isActive).length

    // Unread notifications
    const unreadNotifications = await countDocs('notifications', [{ field: 'isRead', op: '==', value: false }])

    // Featured projects & services
    const featuredProjects = await countDocs('projects', [
      { field: 'isFeatured', op: '==', value: true },
      { field: 'isPublished', op: '==', value: true },
    ])
    const featuredServices = await countDocs('services', [
      { field: 'isFeatured', op: '==', value: true },
      { field: 'isPublished', op: '==', value: true },
    ])

    // Forum activity
    const pinnedTopics = await countDocs('forum_topics', [{ field: 'isPinned', op: '==', value: true }])
    const resolvedTopics = await countDocs('forum_topics', [{ field: 'isResolved', op: '==', value: true }])

    // Support tickets
    const openTickets = await countDocs('support_tickets', [{ field: 'status', op: '==', value: 'open' }])
    const totalTickets = await countDocs('support_tickets')

    // Recent activity
    const recentPosts = totalPosts

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
