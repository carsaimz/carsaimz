import { NextRequest, NextResponse } from 'next/server'
import { getDocByField, createDoc, updateDoc, getDoc, createDocWithId } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

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
    const existingSubscriber = await getDocByField('subscribers', 'email', email)

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
      await updateDoc('subscribers', existingSubscriber.id, { isActive: true })

      return NextResponse.json({
        success: true,
        data: { email, isActive: true },
        message: 'Email subscription reactivated successfully',
      })
    }

    // Add new subscriber
    const subscriberId = await createDoc('subscribers', {
      email,
      isActive: true,
    })

    return NextResponse.json({
      success: true,
      data: { email, isActive: true },
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
