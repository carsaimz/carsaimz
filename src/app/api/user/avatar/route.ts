import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, dataUri } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!dataUri) {
      return NextResponse.json(
        { error: 'dataUri (base64 image) is required' },
        { status: 400 }
      )
    }

    // Validate dataUri format (should be a base64 data URI)
    if (!dataUri.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'dataUri must be a valid base64 image data URI (data:image/...)' },
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

    // Update avatar
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { avatar: dataUri },
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
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}
