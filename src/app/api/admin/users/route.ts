import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const excludeSuperAdmin = searchParams.get('excludeSuperAdmin') === 'true'

    // Build where clause
    const whereClause: Record<string, unknown> = {}

    // Always exclude super_admin from the list unless explicitly requested otherwise
    // super_admin users are hidden from admin UI for security
    if (excludeSuperAdmin || !searchParams.has('excludeSuperAdmin')) {
      whereClause.role = { name: { not: 'super_admin' } }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
      }),
      db.user.count({ where: whereClause }),
    ])

    // Map users to a clean format (exclude passwordHash)
    // Also filter out super_admin users defensively in case the where clause didn't work
    const mappedUsers = users
      .filter((u: any) => u.role?.name !== 'super_admin')
      .map((u: any) => ({
        id: u.id,
        name: u.name || '',
        email: u.email,
        phone: u.phone,
        role: u.role?.name || 'user',
        roleId: u.roleId,
        avatar: u.avatar,
        isActive: u.isActive,
        createdAt: typeof u.createdAt === 'string' ? u.createdAt : u.createdAt?.toISOString?.() || new Date().toISOString(),
      }))

    return NextResponse.json({
      success: true,
      data: mappedUsers,
      meta: {
        total: mappedUsers.length,
        page,
        limit,
        totalPages: Math.ceil(mappedUsers.length / limit),
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
