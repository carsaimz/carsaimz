import { NextRequest, NextResponse } from 'next/server'
import { safeGetDoc, safeGetDocs, safeCountDocs, safeQueryDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { serializeFirestore } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is configured
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the user exists and get their role
    const user = await safeGetDoc('users', userId)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Resolve role name — try multiple sources
    let roleName = 'user'
    try {
      // Check direct role field first
      if ((user as any).role) {
        const r = (user as any).role
        roleName = typeof r === 'string' ? r : (r?.name || 'user')
      }
      // Then check roleId reference
      else if ((user as any).roleId) {
        const roleDoc = await safeGetDoc('roles', (user as any).roleId)
        if (roleDoc) roleName = (roleDoc as any).name || 'user'
      }
    } catch (roleErr) {
      console.warn('[Dashboard] Role resolution failed, defaulting to role param:', roleErr)
    }

    const effectiveRole = role || roleName

    // === ADMIN / SUPER_ADMIN DASHBOARD ===
    if (effectiveRole === 'admin' || effectiveRole === 'super_admin') {
      // Fetch all data needed for admin dashboard — using safe helpers
      const allUsers = await safeGetDocs('users')
      const roles = await safeGetDocs('roles')
      const roleMap = new Map(roles.map((r: any) => [r.id, r]))

      // Filter out super_admin users
      const nonSuperAdminUsers = allUsers.filter((u: any) => {
        const uRole = u.roleId ? roleMap.get(u.roleId) : null
        return uRole?.name !== 'super_admin'
      })

      const totalUsers = nonSuperAdminUsers.length
      const totalPosts = await safeCountDocs('posts', [{ field: 'published', op: '==', value: true }])
      const totalQuotes = await safeCountDocs('quotes')
      const totalPayments = await safeCountDocs('payments')
      const totalTickets = await safeCountDocs('support_tickets')
      const totalForumTopics = await safeCountDocs('forum_topics')

      // Recent users (last 5, exclude super_admin, sorted by createdAt desc)
      const recentUsersRaw = nonSuperAdminUsers
        .sort((a: any, b: any) => {
          try {
            const aTime = a.createdAt ? new Date(serializeFirestore(a.createdAt)).getTime() : 0
            const bTime = b.createdAt ? new Date(serializeFirestore(b.createdAt)).getTime() : 0
            return bTime - aTime
          } catch {
            return 0
          }
        })
        .slice(0, 5)
        .map((u: any) => {
          try {
            return {
              id: u.id,
              name: u.name,
              email: u.email,
              createdAt: serializeFirestore(u.createdAt),
              isActive: u.isActive,
            }
          } catch {
            return { id: u.id, name: u.name, email: u.email, createdAt: null, isActive: u.isActive }
          }
        })

      // Recent quotes with user data
      const recentQuotesRaw = await safeQueryDocs('quotes', [], 'createdAt', 'desc', 5)
      const recentQuotes = await Promise.all(
        recentQuotesRaw.map(async (q: any) => {
          try {
            const quoteUser = q.userId ? await safeGetDoc('users', q.userId) : null
            return serializeFirestore({
              ...q,
              user: quoteUser ? { id: (quoteUser as any).id, name: (quoteUser as any).name, email: (quoteUser as any).email } : null,
            })
          } catch {
            return serializeFirestore(q)
          }
        })
      )

      // Recent payments with user and proposal data
      const recentPaymentsRaw = await safeQueryDocs('payments', [], 'createdAt', 'desc', 5)
      const recentPayments = await Promise.all(
        recentPaymentsRaw.map(async (p: any) => {
          try {
            const paymentUser = p.userId ? await safeGetDoc('users', p.userId) : null
            const proposal = p.proposalId ? await safeGetDoc('proposals', p.proposalId) : null
            return serializeFirestore({
              ...p,
              user: paymentUser ? { id: (paymentUser as any).id, name: (paymentUser as any).name, email: (paymentUser as any).email } : null,
              proposal: proposal ? { id: (proposal as any).id, title: (proposal as any).title } : null,
            })
          } catch {
            return serializeFirestore(p)
          }
        })
      )

      // Recent tickets with user data
      const recentTicketsRaw = await safeQueryDocs('support_tickets', [], 'createdAt', 'desc', 5)
      const recentTickets = await Promise.all(
        recentTicketsRaw.map(async (t: any) => {
          try {
            const ticketUser = t.userId ? await safeGetDoc('users', t.userId) : null
            return serializeFirestore({
              ...t,
              user: ticketUser ? { id: (ticketUser as any).id, name: (ticketUser as any).name, email: (ticketUser as any).email } : null,
            })
          } catch {
            return serializeFirestore(t)
          }
        })
      )

      // Quote status breakdown
      const allQuotes = await safeGetDocs('quotes')
      const quoteStatsMap: Record<string, number> = {}
      allQuotes.forEach((q: any) => {
        const status = q.status || 'pending'
        quoteStatsMap[status] = (quoteStatsMap[status] || 0) + 1
      })
      const quoteStats = Object.entries(quoteStatsMap).map(([status, count]) => ({ status, count }))

      // Payment status breakdown with sum
      const allPayments = await safeGetDocs('payments')
      const paymentStatsMap: Record<string, { count: number; total: number }> = {}
      let confirmedRevenue = 0
      allPayments.forEach((p: any) => {
        const status = p.status || 'pending'
        if (!paymentStatsMap[status]) paymentStatsMap[status] = { count: 0, total: 0 }
        paymentStatsMap[status].count++
        paymentStatsMap[status].total += p.amount || 0
        if (status === 'confirmed') confirmedRevenue += p.amount || 0
      })
      const paymentStats = Object.entries(paymentStatsMap).map(([status, data]) => ({
        status,
        count: data.count,
        total: data.total,
      }))

      // Ticket status breakdown
      const allTickets = await safeGetDocs('support_tickets')
      const ticketStatsMap: Record<string, number> = {}
      allTickets.forEach((t: any) => {
        const status = t.status || 'open'
        ticketStatsMap[status] = (ticketStatsMap[status] || 0) + 1
      })
      const ticketStats = Object.entries(ticketStatsMap).map(([status, count]) => ({ status, count }))

      // Recent published posts
      const recentPostsRaw = await safeQueryDocs('posts', [{ field: 'published', op: '==', value: true }], 'createdAt', 'desc', 5)
      const recentPosts = await Promise.all(
        recentPostsRaw.map(async (p: any) => {
          try {
            const author = p.authorId ? await safeGetDoc('users', p.authorId) : null
            const commentCount = await safeCountDocs('comments', [{ field: 'postId', op: '==', value: p.id }])
            return serializeFirestore({
              ...p,
              author: author ? { id: (author as any).id, name: (author as any).name } : null,
              _count: { comments: commentCount },
            })
          } catch {
            return serializeFirestore(p)
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: {
          role: 'admin',
          user: {
            id: (user as any).id,
            name: (user as any).name,
            email: (user as any).email,
            avatar: (user as any).avatar,
          },
          stats: {
            totalUsers,
            totalPosts,
            totalQuotes,
            totalPayments,
            totalTickets,
            totalForumTopics,
            totalRevenue: confirmedRevenue,
          },
          breakdowns: {
            quotes: quoteStats,
            payments: paymentStats,
            tickets: ticketStats,
          },
          recentActivity: {
            users: recentUsersRaw,
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
      const totalClicks = await safeCountDocs('affiliate_clicks', [{ field: 'userId', op: '==', value: userId }])
      const totalCommissions = await safeCountDocs('affiliate_commissions', [{ field: 'userId', op: '==', value: userId }])
      const pendingCommissions = await safeCountDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'pending' },
      ])
      const approvedCommissions = await safeCountDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'approved' },
      ])
      const paidCommissions = await safeCountDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'paid' },
      ])

      const userCommissions = await safeQueryDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
      ])
      const totalCommissionAmount = userCommissions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

      const recentClicks = await safeQueryDocs('affiliate_clicks', [
        { field: 'userId', op: '==', value: userId },
      ], 'createdAt', 'desc', 10)

      const recentCommissions = await safeQueryDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
      ], 'createdAt', 'desc', 10)

      return NextResponse.json({
        success: true,
        data: {
          role: 'partner',
          user: {
            id: (user as any).id,
            name: (user as any).name,
            email: (user as any).email,
            avatar: (user as any).avatar,
          },
          stats: {
            totalClicks,
            totalCommissions,
            pendingCommissions,
            approvedCommissions,
            paidCommissions,
            totalCommissionAmount,
          },
          recentActivity: {
            clicks: serializeFirestore(recentClicks),
            commissions: serializeFirestore(recentCommissions),
          },
        },
      })
    }

    // === USER DASHBOARD ===
    const userQuotesRaw = await safeQueryDocs('quotes', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc', 5)

    const userQuotes = await Promise.all(
      userQuotesRaw.map(async (q: any) => {
        try {
          const proposals = await safeQueryDocs('proposals', [
            { field: 'quoteId', op: '==', value: q.id },
          ])
          return serializeFirestore({
            ...q,
            proposals: proposals.map((p: any) => ({
              id: p.id,
              title: p.title,
              totalAmount: p.totalAmount,
              status: p.status,
            })),
          })
        } catch {
          return serializeFirestore(q)
        }
      })
    )

    const userPaymentsRaw = await safeQueryDocs('payments', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc', 5)

    const userPayments = await Promise.all(
      userPaymentsRaw.map(async (p: any) => {
        try {
          const proposal = p.proposalId ? await safeGetDoc('proposals', p.proposalId) : null
          return serializeFirestore({
            ...p,
            proposal: proposal ? {
              id: (proposal as any).id,
              title: (proposal as any).title,
              totalAmount: (proposal as any).totalAmount,
            } : null,
          })
        } catch {
          return serializeFirestore(p)
        }
      })
    )

    const userTicketsRaw = await safeQueryDocs('support_tickets', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc', 5)

    const userTickets = await Promise.all(
      userTicketsRaw.map(async (t: any) => {
        try {
          const replyCount = await safeCountDocs('ticket_replies', [{ field: 'ticketId', op: '==', value: t.id }])
          return serializeFirestore({
            ...t,
            _count: { replies: replyCount },
          })
        } catch {
          return serializeFirestore(t)
        }
      })
    )

    const userNotifications = await safeQueryDocs('notifications', [
      { field: 'userId', op: '==', value: userId },
      { field: 'isRead', op: '==', value: false },
    ], 'createdAt', 'desc', 10)

    const quoteCount = await safeCountDocs('quotes', [{ field: 'userId', op: '==', value: userId }])
    const paymentCount = await safeCountDocs('payments', [{ field: 'userId', op: '==', value: userId }])
    const ticketCount = await safeCountDocs('support_tickets', [{ field: 'userId', op: '==', value: userId }])
    const unreadNotifications = await safeCountDocs('notifications', [
      { field: 'userId', op: '==', value: userId },
      { field: 'isRead', op: '==', value: false },
    ])

    return NextResponse.json({
      success: true,
      data: {
        role: 'user',
        user: {
          id: (user as any).id,
          name: (user as any).name,
          email: (user as any).email,
          avatar: (user as any).avatar,
          phone: (user as any).phone,
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
          notifications: serializeFirestore(userNotifications),
        },
      },
    })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    // Return the actual error message so the client can show it
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard data',
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    )
  }
}
