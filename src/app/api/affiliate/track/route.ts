import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * POST /api/affiliate/track
 * Track a referral click and create a record
 * Body: { referralCode (partner's user ID), sessionId (string) }
 * Creates an affiliate_clicks record
 * Returns: { success: true }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referralCode, sessionId } = body

    if (!referralCode) {
      return NextResponse.json(
        { success: false, message: 'referralCode is required' },
        { status: 400 }
      )
    }

    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get user agent and IP from request headers
    const userAgent = request.headers.get('user-agent') || null
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || null)

    // Create affiliate_clicks record
    await db.collection('affiliate_clicks').add({
      referrerId: referralCode,
      sessionId: sessionId || null,
      userAgent,
      ip,
      createdAt: FieldValue.serverTimestamp(),
    })

    // Create the response with a 30-day cookie
    const response = NextResponse.json({
      success: true,
    })

    // Set a cookie for 30 days for conversion tracking
    response.cookies.set('ref', referralCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    })

    // Also store the session ID for tracking
    if (sessionId) {
      response.cookies.set('ref_session', sessionId, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      })
    }

    return response
  } catch (error) {
    console.error('[Affiliate Track] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to track referral click',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
