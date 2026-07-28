import { NextRequest, NextResponse } from 'next/server'
import { queryDocs, getDocs, countDocs, getDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // Fetch all users (Firestore doesn't support relation-based filtering)
    const allUsers = await getDocs('users')

    // Fetch all roles so we can join them
    const roles = await getDocs('roles')
    const roleMap = new Map(roles.map(r => [r.id, r]))

    // Filter out super_admin users and apply search
    let filteredUsers = allUsers.filter((u: any) => {
      const userRole = u.roleId ? roleMap.get(u.roleId) : null
      const roleName = userRole?.name || 'user'
      return roleName !== 'super_admin'
    })

    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter((u: any) =>
        (u.name && u.name.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower)) ||
        (u.phone && u.phone.toLowerCase().includes(searchLower))
      )
    }

    // Sort by createdAt descending
    filteredUsers.sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })

    // Paginate
    const total = filteredUsers.length
    const start = (page - 1) * limit
    const paginatedUsers = filteredUsers.slice(start, start + limit)

    // Map users to clean format (Firestore doesn't store passwords — Firebase Auth manages them)
    const mappedUsers = paginatedUsers.map((u: any) => {
      const userRole = u.roleId ? roleMap.get(u.roleId) : null
      const roleName = userRole?.name || 'user'
      const createdAt = u.createdAt
        ? (typeof u.createdAt === 'string' ? u.createdAt : u.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString())
        : new Date().toISOString()

      return {
        id: u.id,
        name: u.name || '',
        email: u.email,
        phone: u.phone,
        role: roleName,
        roleId: u.roleId,
        avatar: u.avatar,
        isActive: u.isActive,
        createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: mappedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
