import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'

/**
 * POST /api/auth/reset-password
 * Resets a user's password.
 *
 * The client-side Firebase SDK handles oobCode verification.
 * This endpoint receives a verified email and new password,
 * then uses Admin SDK to update the password directly.
 */
export async function POST(request: Request) {
  try {
    const { email, newPassword, uid } = await request.json()

    // Need at least email or uid, plus newPassword
    if (!newPassword || (!email && !uid)) {
      return NextResponse.json(
        { success: false, error: 'Email/UID and new password are required' },
        { status: 400 }
      )
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const auth = getAuth()

    // Get user by uid or email
    let userUid: string
    if (uid) {
      userUid = uid
    } else {
      const userRecord = await auth.getUserByEmail(email)
      userUid = userRecord.uid
    }

    // Update the user's password
    await auth.updateUser(userUid, { password: newPassword })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully.',
    })
  } catch (error: any) {
    console.error('Reset password error:', error)

    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { success: false, error: 'No user found with this email.' },
        { status: 404 }
      )
    }
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { success: false, error: 'The password is too weak. Use at least 6 characters.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset password' },
      { status: 500 }
    )
  }
}
