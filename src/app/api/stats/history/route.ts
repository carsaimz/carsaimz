import { NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDocs, safeCountDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
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

    // Get all confirmed payments ordered by date for revenue history
    const payments = await safeQueryDocs('payments', [
      { field: 'status', op: '==', value: 'confirmed' },
    ], 'createdAt', 'asc')

    // Get ALL payments (not just confirmed) for booking counts
    const allPayments = await safeGetDocs('payments')

    // Get all users ordered by date for growth history
    const users = await safeQueryDocs('users', [], 'createdAt', 'asc')

    // Get all quotes and proposals for service usage
    const quotes = await safeGetDocs('quotes')
    const proposals = await safeGetDocs('proposals')
    const services = await safeGetDocs('services')

    // Build a map of quoteId -> proposals for quick lookup
    const proposalsByQuoteId = new Map<string, any[]>()
    for (const proposal of proposals) {
      const quoteId = (proposal as any).quoteId
      if (quoteId) {
        const existing = proposalsByQuoteId.get(quoteId) || []
        existing.push(proposal)
        proposalsByQuoteId.set(quoteId, existing)
      }
    }

    // Build monthly revenue data (last 12 months)
    const now = new Date()
    const revenueByMonth: Record<string, number> = {}
    const bookingsByMonth: Record<string, number> = {}

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[key] = 0
      bookingsByMonth[key] = 0
    }

    // Populate revenue data from confirmed payments
    payments.forEach((payment: any) => {
      const createdAt = serializeFirestore(payment.createdAt)
      if (createdAt) {
        const date = new Date(createdAt)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (key in revenueByMonth) {
          revenueByMonth[key] += payment.amount || 0
        }
      }
    })

    // Populate booking counts from ALL payments (not just confirmed)
    allPayments.forEach((payment: any) => {
      const createdAt = serializeFirestore(payment.createdAt)
      if (createdAt) {
        const date = new Date(createdAt)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (key in bookingsByMonth) {
          bookingsByMonth[key] += 1
        }
      }
    })

    // Build revenue chart data — use actual bookings count, not fake target
    const revenueData = Object.entries(revenueByMonth).map(([key, revenue]) => {
      const date = new Date(key + '-01')
      const monthName = date.toLocaleDateString('en', { month: 'short' })
      const bookings = bookingsByMonth[key] || 0
      return { month: monthName, revenue, bookings }
    })

    // Build users growth data
    const usersByMonth: Record<string, number> = {}
    const newUsersByMonth: Record<string, number> = {}
    const monthKeys = Object.keys(revenueByMonth)

    // Initialize
    monthKeys.forEach((key) => {
      usersByMonth[key] = 0
      newUsersByMonth[key] = 0
    })

    // Count total users before each month and new users in each month
    let cumulativeUsers = 0
    monthKeys.forEach((key) => {
      const monthStart = new Date(key + '-01')
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59)

      const newInMonth = users.filter((u: any) => {
        const createdAt = serializeFirestore(u.createdAt)
        if (!createdAt) return false
        const d = new Date(createdAt)
        return d >= monthStart && d <= monthEnd
      }).length

      cumulativeUsers += newInMonth
      newUsersByMonth[key] = newInMonth
      usersByMonth[key] = cumulativeUsers
    })

    const usersGrowthData = monthKeys.map((key) => {
      const date = new Date(key + '-01')
      const monthName = date.toLocaleDateString('en', { month: 'short' })
      return {
        month: monthName,
        newUsers: newUsersByMonth[key],
        totalUsers: usersByMonth[key],
      }
    })

    // Build service usage data from actual quote records
    // Group quotes by their title (which typically matches the service name)
    // and calculate revenue from associated proposals
    const serviceUsageMap = new Map<string, { count: number; revenue: number }>()

    // Initialize with all published services so they show up even with 0 quotes
    for (const service of services) {
      const s = service as any
      const name = s.title || s.slug || 'Unknown'
      if (!serviceUsageMap.has(name)) {
        serviceUsageMap.set(name, { count: 0, revenue: 0 })
      }
    }

    // Process quotes — group by title and calculate revenue from proposals
    for (const quote of quotes) {
      const q = quote as any
      const serviceName = q.title || 'Other'

      // Find proposals for this quote
      const quoteProposals = proposalsByQuoteId.get(q.id) || []
      const proposalRevenue = quoteProposals.reduce(
        (sum: number, p: any) => sum + (p.totalAmount || 0),
        0
      )

      const existing = serviceUsageMap.get(serviceName) || { count: 0, revenue: 0 }
      existing.count += 1
      existing.revenue += proposalRevenue
      serviceUsageMap.set(serviceName, existing)
    }

    // Also include quotes that don't match any service title
    // by looking at proposals and their associated quotes
    for (const proposal of proposals) {
      const p = proposal as any
      const quoteId = p.quoteId
      if (quoteId) {
        // This proposal's revenue is already counted above via the quote
        continue
      }
      // Orphan proposal (no quote) — group under "Other"
      const existing = serviceUsageMap.get('Other') || { count: 0, revenue: 0 }
      existing.revenue += p.totalAmount || 0
      serviceUsageMap.set('Other', existing)
    }

    const serviceUsageData = Array.from(serviceUsageMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending

    return NextResponse.json({
      success: true,
      data: {
        revenue: revenueData,
        usersGrowth: usersGrowthData,
        serviceUsage: serviceUsageData,
      },
    })
  } catch (error) {
    console.error('Stats history fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch stats history',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
