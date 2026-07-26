import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // Build where clause: exclude super_admin from the list
    const whereClause: Record<string, unknown> = {
      role: { name: { not: 'super_admin' } },
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
    const mappedUsers = users.map((u) => ({
      id: u.id,
      name: u.name || '',
      email: u.email,
      phone: u.phone,
      role: u.role?.name || 'user',
      roleId: u.roleId,
      avatar: u.avatar,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    }))

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
