import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, getDocs, countDocs, getDocByField } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

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

    // Verify the user exists and get their role
    const user = await getDoc('users', userId)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Resolve role name
    let roleName = 'user'
    if (user.roleId) {
      const roleDoc = await getDoc('roles', user.roleId)
      if (roleDoc) roleName = roleDoc.name
    }
    const effectiveRole = role || roleName

    // === ADMIN / SUPER_ADMIN DASHBOARD ===
    if (effectiveRole === 'admin' || effectiveRole === 'super_admin') {
      // Fetch all data needed for admin dashboard
      const allUsers = await getDocs('users')
      const roles = await getDocs('roles')
      const roleMap = new Map(roles.map(r => [r.id, r]))

      // Filter out super_admin users
      const nonSuperAdminUsers = allUsers.filter((u: any) => {
        const uRole = u.roleId ? roleMap.get(u.roleId) : null
        return uRole?.name !== 'super_admin'
      })

      const totalUsers = nonSuperAdminUsers.length
      const totalPosts = await countDocs('posts', [{ field: 'published', op: '==', value: true }])
      const totalQuotes = await countDocs('quotes')
      const totalPayments = await countDocs('payments')
      const totalTickets = await countDocs('support_tickets')
      const totalForumTopics = await countDocs('forum_topics')

      // Recent users (last 5, exclude super_admin, sorted by createdAt desc)
      const recentUsersRaw = nonSuperAdminUsers
        .sort((a: any, b: any) => {
          const aTime = a.createdAt ? new Date(serializeFirestore(a.createdAt)).getTime() : 0
          const bTime = b.createdAt ? new Date(serializeFirestore(b.createdAt)).getTime() : 0
          return bTime - aTime
        })
        .slice(0, 5)
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: serializeFirestore(u.createdAt),
          isActive: u.isActive,
        }))

      // Recent quotes with user data
      const recentQuotesRaw = await queryDocs('quotes', [], 'createdAt', 'desc', 5)
      const recentQuotes = await Promise.all(
        recentQuotesRaw.map(async (q: any) => {
          const quoteUser = q.userId ? await getDoc('users', q.userId) : null
          return serializeFirestore({
            ...q,
            user: quoteUser ? { id: quoteUser.id, name: quoteUser.name, email: quoteUser.email } : null,
          })
        })
      )

      // Recent payments with user and proposal data
      const recentPaymentsRaw = await queryDocs('payments', [], 'createdAt', 'desc', 5)
      const recentPayments = await Promise.all(
        recentPaymentsRaw.map(async (p: any) => {
          const paymentUser = p.userId ? await getDoc('users', p.userId) : null
          const proposal = p.proposalId ? await getDoc('proposals', p.proposalId) : null
          return serializeFirestore({
            ...p,
            user: paymentUser ? { id: paymentUser.id, name: paymentUser.name, email: paymentUser.email } : null,
            proposal: proposal ? { id: proposal.id, title: proposal.title } : null,
          })
        })
      )

      // Recent tickets with user data
      const recentTicketsRaw = await queryDocs('support_tickets', [], 'createdAt', 'desc', 5)
      const recentTickets = await Promise.all(
        recentTicketsRaw.map(async (t: any) => {
          const ticketUser = t.userId ? await getDoc('users', t.userId) : null
          return serializeFirestore({
            ...t,
            user: ticketUser ? { id: ticketUser.id, name: ticketUser.name, email: ticketUser.email } : null,
          })
        })
      )

      // Quote status breakdown
      const allQuotes = await getDocs('quotes')
      const quoteStatsMap: Record<string, number> = {}
      allQuotes.forEach((q: any) => {
        const status = q.status || 'pending'
        quoteStatsMap[status] = (quoteStatsMap[status] || 0) + 1
      })
      const quoteStats = Object.entries(quoteStatsMap).map(([status, count]) => ({ status, count }))

      // Payment status breakdown with sum
      const allPayments = await getDocs('payments')
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
      const allTickets = await getDocs('support_tickets')
      const ticketStatsMap: Record<string, number> = {}
      allTickets.forEach((t: any) => {
        const status = t.status || 'open'
        ticketStatsMap[status] = (ticketStatsMap[status] || 0) + 1
      })
      const ticketStats = Object.entries(ticketStatsMap).map(([status, count]) => ({ status, count }))

      // Recent published posts
      const recentPostsRaw = await queryDocs('posts', [{ field: 'published', op: '==', value: true }], 'createdAt', 'desc', 5)
      const recentPosts = await Promise.all(
        recentPostsRaw.map(async (p: any) => {
          const author = p.authorId ? await getDoc('users', p.authorId) : null
          const commentCount = await countDocs('comments', [{ field: 'postId', op: '==', value: p.id }])
          return serializeFirestore({
            ...p,
            author: author ? { id: author.id, name: author.name } : null,
            _count: { comments: commentCount },
          })
        })
      )

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
      const totalClicks = await countDocs('affiliate_clicks', [{ field: 'userId', op: '==', value: userId }])
      const totalCommissions = await countDocs('affiliate_commissions', [{ field: 'userId', op: '==', value: userId }])
      const pendingCommissions = await countDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'pending' },
      ])
      const approvedCommissions = await countDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'approved' },
      ])
      const paidCommissions = await countDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'paid' },
      ])

      const userCommissions = await queryDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
      ])
      const totalCommissionAmount = userCommissions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

      const recentClicks = await queryDocs('affiliate_clicks', [
        { field: 'userId', op: '==', value: userId },
      ], 'createdAt', 'desc', 10)

      const recentCommissions = await queryDocs('affiliate_commissions', [
        { field: 'userId', op: '==', value: userId },
      ], 'createdAt', 'desc', 10)

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
    const userQuotesRaw = await queryDocs('quotes', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc', 5)

    const userQuotes = await Promise.all(
      userQuotesRaw.map(async (q: any) => {
        const proposals = await queryDocs('proposals', [
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
      })
    )

    const userPaymentsRaw = await queryDocs('payments', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc', 5)

    const userPayments = await Promise.all(
      userPaymentsRaw.map(async (p: any) => {
        const proposal = p.proposalId ? await getDoc('proposals', p.proposalId) : null
        return serializeFirestore({
          ...p,
          proposal: proposal ? {
            id: proposal.id,
            title: proposal.title,
            totalAmount: proposal.totalAmount,
          } : null,
        })
      })
    )

    const userTicketsRaw = await queryDocs('support_tickets', [
      { field: 'userId', op: '==', value: userId },
    ], 'createdAt', 'desc', 5)

    const userTickets = await Promise.all(
      userTicketsRaw.map(async (t: any) => {
        const replyCount = await countDocs('ticket_replies', [{ field: 'ticketId', op: '==', value: t.id }])
        return serializeFirestore({
          ...t,
          _count: { replies: replyCount },
        })
      })
    )

    const userNotifications = await queryDocs('notifications', [
      { field: 'userId', op: '==', value: userId },
      { field: 'isRead', op: '==', value: false },
    ], 'createdAt', 'desc', 10)

    const quoteCount = await countDocs('quotes', [{ field: 'userId', op: '==', value: userId }])
    const paymentCount = await countDocs('payments', [{ field: 'userId', op: '==', value: userId }])
    const ticketCount = await countDocs('support_tickets', [{ field: 'userId', op: '==', value: userId }])
    const unreadNotifications = await countDocs('notifications', [
      { field: 'userId', op: '==', value: userId },
      { field: 'isRead', op: '==', value: false },
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
          notifications: serializeFirestore(userNotifications),
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
