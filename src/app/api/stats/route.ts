import { NextResponse } from 'next/server'
import { safeCountDocs, safeGetDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    // Check if Firebase Admin SDK is configured
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    // Total counts — each wrapped in safe helpers
    const allUsers = await safeGetDocs('users')
    const roles = await safeGetDocs('roles')
    const roleMap = new Map(roles.map((r: any) => [r.id, r]))

    // Exclude super_admin from user count
    const nonSuperAdminUsers = allUsers.filter((u: any) => {
      const uRole = u.roleId ? roleMap.get(u.roleId) : null
      return uRole?.name !== 'super_admin'
    })

    const totalUsers = nonSuperAdminUsers.length
    const totalPosts = await safeCountDocs('posts', [{ field: 'published', op: '==', value: true }])
    const totalProjects = await safeCountDocs('projects', [{ field: 'isPublished', op: '==', value: true }])
    const totalServices = await safeCountDocs('services', [{ field: 'isPublished', op: '==', value: true }])
    const totalForumTopics = await safeCountDocs('forum_topics')
    const totalTestimonials = await safeCountDocs('testimonials', [{ field: 'isPublished', op: '==', value: true }])
    const totalNotifications = await safeCountDocs('notifications')
    const totalCategories = await safeCountDocs('categories')
    const totalTags = await safeCountDocs('tags')

    // Revenue stats (from payments)
    const payments = await safeGetDocs('payments')
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
    const unreadNotifications = await safeCountDocs('notifications', [{ field: 'isRead', op: '==', value: false }])

    // Featured projects & services
    const featuredProjects = await safeCountDocs('projects', [
      { field: 'isFeatured', op: '==', value: true },
      { field: 'isPublished', op: '==', value: true },
    ])
    const featuredServices = await safeCountDocs('services', [
      { field: 'isFeatured', op: '==', value: true },
      { field: 'isPublished', op: '==', value: true },
    ])

    // Forum activity
    const pinnedTopics = await safeCountDocs('forum_topics', [{ field: 'isPinned', op: '==', value: true }])
    const resolvedTopics = await safeCountDocs('forum_topics', [{ field: 'isResolved', op: '==', value: true }])

    // Support tickets
    const openTickets = await safeCountDocs('support_tickets', [{ field: 'status', op: '==', value: 'open' }])
    const totalTickets = await safeCountDocs('support_tickets')

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
