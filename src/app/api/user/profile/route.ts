import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, phone, company, bio, address } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (company !== undefined) updateData.company = company
    if (bio !== undefined) updateData.bio = bio
    if (address !== undefined) updateData.address = address

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
      },
    })

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        company: updatedUser.company,
        bio: updatedUser.bio,
        address: updatedUser.address,
        role: updatedUser.role?.name || 'user',
        isActive: updatedUser.isActive,
        emailVerified: updatedUser.emailVerified,
      },
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
