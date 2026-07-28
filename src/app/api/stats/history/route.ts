import { NextResponse } from 'next/server'
import { queryDocs, getDocs, countDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    // Get all confirmed payments ordered by date for revenue history
    const payments = await queryDocs('payments', [
      { field: 'status', op: '==', value: 'confirmed' },
    ], 'createdAt', 'asc')

    // Get all users ordered by date for growth history
    const users = await queryDocs('users', [], 'createdAt', 'asc')

    // Get all categories
    const categories = await getDocs('categories')

    // Count posts per category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat: any) => {
        const postCount = await countDocs('posts', [
          { field: 'categoryId', op: '==', value: cat.id },
        ])
        return { ...cat, _count: { posts: postCount } }
      })
    )

    // Build monthly revenue data (last 12 months)
    const now = new Date()
    const revenueByMonth: Record<string, number> = {}

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[key] = 0
    }

    // Populate revenue data
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

    // Build revenue chart data
    const revenueData = Object.entries(revenueByMonth).map(([key, revenue]) => {
      const date = new Date(key + '-01')
      const monthName = date.toLocaleDateString('en', { month: 'short' })
      const target = Math.round(revenue * 0.8 + 50000)
      return { month: monthName, revenue, target }
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

    // Build posts by category data
    const postsByCategoryData = categoriesWithCount.map((cat: any) => ({
      name: cat.name,
      value: cat._count.posts,
    }))

    return NextResponse.json({
      success: true,
      data: {
        revenue: revenueData,
        usersGrowth: usersGrowthData,
        postsByCategory: postsByCategoryData,
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
