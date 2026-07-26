import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingSubscriber = await db.subscriber.findUnique({
      where: { email },
    })

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          {
            success: false,
            message: 'This email is already subscribed to the newsletter',
            data: { email: existingSubscriber.email, isActive: existingSubscriber.isActive },
          },
          { status: 409 }
        )
      }

      // Reactivate previously unsubscribed email
      const reactivated = await db.subscriber.update({
        where: { email },
        data: { isActive: true },
      })

      return NextResponse.json({
        success: true,
        data: { email: reactivated.email, isActive: reactivated.isActive },
        message: 'Email subscription reactivated successfully',
      })
    }

    // Add new subscriber
    const subscriber = await db.subscriber.create({
      data: {
        email,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { email: subscriber.email, isActive: subscriber.isActive },
      message: 'Successfully subscribed to the newsletter',
    }, { status: 201 })
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to subscribe to newsletter',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
