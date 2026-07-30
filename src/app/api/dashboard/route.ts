import { NextRequest, NextResponse } from 'next/server'
import { safeGetDoc, safeGetDocs, safeCountDocs, safeQueryDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { serializeFirestore } from '@/lib/serialize'

/**
 * Helper: sort an array of objects by a date field, descending.
 * Safe against missing / malformed dates.
 */
function sortByDateDesc<T extends Record<string, any>>(arr: T[], field: string = 'createdAt'): T[] {
  return arr.sort((a, b) => {
    try {
      const aTime = a[field] ? new Date(typeof a[field] === 'object' ? serializeFirestore(a[field]) : a[field]).getTime() : 0
      const bTime = b[field] ? new Date(typeof b[field] === 'object' ? serializeFirestore(b[field]) : b[field]).getTime() : 0
      return bTime - aTime
    } catch {
      return 0
    }
  })
}

/**
 * Helper: try safeQueryDocs first; if it returns empty (likely due to
 * missing composite index), fall back to safeGetDocs + client-side filter.
 */
async function resilientQueryDocs<T extends Record<string, any> = Record<string, any>>(
  collectionName: string,
  filters: Array<{ field: string; op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any'; value: any }>,
  orderBy?: string,
  orderDir?: 'asc' | 'desc',
  limit?: number
): Promise<T[]> {
  // Try the indexed query first
  try {
    const result = await safeQueryDocs<T>(collectionName, filters, orderBy, orderDir, limit)
    // If we got results, the index exists — use them
    if (result.length > 0) return result

    // If we got zero results, it could be either:
    //   a) genuinely no matching docs, or
    //   b) the index is missing and safeQueryDocs swallowed the error.
    // To distinguish, fall back to safeGetDocs + client-side filter.
  } catch {
    // safeQueryDocs itself threw — fall through to fallback
  }

  // Fallback: fetch all docs and filter / sort client-side
  try {
    const allDocs = await safeGetDocs<T>(collectionName)
    let filtered = allDocs.filter((doc: any) => {
      return filters.every((f) => {
        const val = doc[f.field]
        switch (f.op) {
          case '==': return val === f.value
          case '!=': return val !== f.value
          case '<': return val < f.value
          case '<=': return val <= f.value
          case '>': return val > f.value
          case '>=': return val >= f.value
          case 'in': return Array.isArray(f.value) && f.value.includes(val)
          case 'not-in': return Array.isArray(f.value) && !f.value.includes(val)
          case 'array-contains': return Array.isArray(val) && val.includes(f.value)
          case 'array-contains-any': return Array.isArray(val) && Array.isArray(f.value) && f.value.some((v: any) => val.includes(v))
          default: return true
        }
      })
    })

    if (orderBy) {
      filtered = orderDir === 'desc'
        ? sortByDateDesc(filtered, orderBy)
        : filtered.sort((a: any, b: any) => {
            try {
              const aTime = a[orderBy] ? new Date(typeof a[orderBy] === 'object' ? serializeFirestore(a[orderBy]) : a[orderBy]).getTime() : 0
              const bTime = b[orderBy] ? new Date(typeof b[orderBy] === 'object' ? serializeFirestore(b[orderBy]) : b[orderBy]).getTime() : 0
              return aTime - bTime
            } catch { return 0 }
          })
    }

    if (limit) filtered = filtered.slice(0, limit)
    return filtered
  } catch {
    return []
  }
}

/**
 * Helper: resilient count — try safeCountDocs first, fall back to
 * safeGetDocs + client-side filter if the index is missing.
 */
async function resilientCountDocs(
  collectionName: string,
  filters?: Array<{ field: string; op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any'; value: any }>
): Promise<number> {
  // For simple single-field filters, safeCountDocs usually works (single-field indexes are auto-created)
  if (!filters || filters.length <= 1) {
    return safeCountDocs(collectionName, filters)
  }

  // For composite filters, try safeCountDocs first but have a fallback
  try {
    const count = await safeCountDocs(collectionName, filters)
    // If we got a non-zero count, the index exists
    if (count > 0) return count
  } catch {
    // fall through to fallback
  }

  // Fallback: fetch all and filter client-side
  try {
    const allDocs = await safeGetDocs(collectionName)
    return allDocs.filter((doc: any) => {
      return filters.every((f) => {
        const val = doc[f.field]
        switch (f.op) {
          case '==': return val === f.value
          case '!=': return val !== f.value
          case '<': return val < f.value
          case '<=': return val <= f.value
          case '>': return val > f.value
          case '>=': return val >= f.value
          case 'in': return Array.isArray(f.value) && f.value.includes(val)
          case 'not-in': return Array.isArray(f.value) && !f.value.includes(val)
          case 'array-contains': return Array.isArray(val) && val.includes(f.value)
          case 'array-contains-any': return Array.isArray(val) && Array.isArray(f.value) && f.value.some((v: any) => val.includes(v))
          default: return true
        }
      })
    }).length
  } catch {
    return 0
  }
}

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
      try {
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

        // Use safeGetDocs + client-side counting for stats that need composite indexes
        const allPosts = await safeGetDocs('posts')
        const publishedPosts = allPosts.filter((p: any) => p.published === true)
        const totalPosts = publishedPosts.length

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

        // Recent quotes — use safeGetDocs + client-side sort instead of safeQueryDocs with orderBy
        const allQuotesForRecent = await safeGetDocs('quotes')
        const recentQuotesRaw = sortByDateDesc(allQuotesForRecent).slice(0, 5)
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

        // Recent payments — use safeGetDocs + client-side sort
        const allPaymentsForRecent = await safeGetDocs('payments')
        const recentPaymentsRaw = sortByDateDesc(allPaymentsForRecent).slice(0, 5)
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

        // Recent tickets — use safeGetDocs + client-side sort
        const allTicketsForRecent = await safeGetDocs('support_tickets')
        const recentTicketsRaw = sortByDateDesc(allTicketsForRecent).slice(0, 5)
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

        // Recent published posts — use safeGetDocs + client-side filter & sort
        // (avoiding safeQueryDocs with filter + orderBy which needs composite index)
        const recentPosts = await Promise.all(
          sortByDateDesc(publishedPosts).slice(0, 5).map(async (p: any) => {
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
      } catch (adminError) {
        console.error('[Dashboard] Admin section error:', adminError)
        // Return a minimal admin response instead of 500
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
              totalUsers: 0,
              totalPosts: 0,
              totalQuotes: 0,
              totalPayments: 0,
              totalTickets: 0,
              totalForumTopics: 0,
              totalRevenue: 0,
            },
            breakdowns: {
              quotes: [],
              payments: [],
              tickets: [],
            },
            recentActivity: {
              users: [],
              quotes: [],
              payments: [],
              tickets: [],
              posts: [],
            },
          },
        })
      }
    }

    // === PARTNER DASHBOARD ===
    if (effectiveRole === 'partner') {
      try {
        // Fetch all affiliate data for this user (no complex queries that need indexes)
        const allClicks = await safeGetDocs('affiliate_clicks')
        const userClicks = allClicks.filter((c: any) => c.userId === userId)
        const totalClicks = userClicks.length

        const allCommissions = await safeGetDocs('affiliate_commissions')
        const userCommissions = allCommissions.filter((c: any) => c.userId === userId)
        const totalCommissions = userCommissions.length
        const pendingCommissions = userCommissions.filter((c: any) => c.status === 'pending').length
        const approvedCommissions = userCommissions.filter((c: any) => c.status === 'approved').length
        const paidCommissions = userCommissions.filter((c: any) => c.status === 'paid').length
        const totalCommissionAmount = userCommissions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

        // Sort by createdAt desc
        const recentClicks = sortByDateDesc(userClicks).slice(0, 10)

        const recentCommissions = sortByDateDesc(userCommissions).slice(0, 10)

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
      } catch (partnerError) {
        console.error('[Dashboard] Partner section error:', partnerError)
        // Return a minimal partner response instead of 500
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
              totalClicks: 0,
              totalCommissions: 0,
              pendingCommissions: 0,
              approvedCommissions: 0,
              paidCommissions: 0,
              totalCommissionAmount: 0,
            },
            recentActivity: {
              clicks: [],
              commissions: [],
            },
          },
        })
      }
    }

    // === USER DASHBOARD ===
    try {
      // Use safeGetDocs + client-side filtering for queries that need composite indexes
      // (userId == X + orderBy createdAt desc) and (userId == X + isRead == false + orderBy createdAt desc)

      // User quotes — fetch all and filter client-side
      const allQuotes = await safeGetDocs('quotes')
      const userQuotesRaw = sortByDateDesc(allQuotes.filter((q: any) => q.userId === userId)).slice(0, 5)

      const userQuotes = await Promise.all(
        userQuotesRaw.map(async (q: any) => {
          try {
            const allProposals = await safeGetDocs('proposals')
            const proposals = allProposals.filter((p: any) => p.quoteId === q.id)
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

      // User payments — fetch all and filter client-side
      const allPayments = await safeGetDocs('payments')
      const userPaymentsRaw = sortByDateDesc(allPayments.filter((p: any) => p.userId === userId)).slice(0, 5)

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

      // User tickets — fetch all and filter client-side
      const allTickets = await safeGetDocs('support_tickets')
      const userTicketsRaw = sortByDateDesc(allTickets.filter((t: any) => t.userId === userId)).slice(0, 5)

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

      // User notifications — fetch all and filter client-side
      // (userId == X + isRead == false + orderBy createdAt desc needs triple composite index)
      const allNotifications = await safeGetDocs('notifications')
      const userNotifications = sortByDateDesc(
        allNotifications.filter((n: any) => n.userId === userId && n.isRead === false)
      ).slice(0, 10)

      // Stats — use safeGetDocs + client-side filter for composite queries
      const quoteCount = allQuotes.filter((q: any) => q.userId === userId).length
      const paymentCount = allPayments.filter((p: any) => p.userId === userId).length
      const ticketCount = allTickets.filter((t: any) => t.userId === userId).length
      const unreadNotifications = allNotifications.filter((n: any) => n.userId === userId && n.isRead === false).length

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
    } catch (userError) {
      console.error('[Dashboard] User section error:', userError)
      // Return a minimal user response instead of 500
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
            totalQuotes: 0,
            totalPayments: 0,
            totalTickets: 0,
            unreadNotifications: 0,
          },
          recentActivity: {
            quotes: [],
            payments: [],
            tickets: [],
            notifications: [],
          },
        },
      })
    }
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
