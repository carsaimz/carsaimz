import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, contactFormTemplate, isEmailConfigured } from '@/lib/email'
import { createDoc } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required: name, email, subject, message' },
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

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: 'Message must be at least 10 characters long' },
        { status: 400 }
      )
    }

    // Store in Firestore
    try {
      await createDoc('contact_messages', {
        name,
        email,
        subject,
        message: message.trim(),
        read: false,
        createdAt: new Date().toISOString(),
      })
    } catch {
      console.warn('[Contact] Failed to store in Firestore, continuing with email')
    }

    // Send email notification if SMTP is configured
    if (await isEmailConfigured()) {
      const emailResult = await sendEmail(contactFormTemplate({
        name,
        email,
        subject,
        message: message.trim(),
      }))

      if (!emailResult.success) {
        console.warn('[Contact] Email failed:', emailResult.error)
        // Still return success since the message was stored
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        name,
        email,
        subject,
        message: message.trim(),
        submittedAt: new Date().toISOString(),
      },
      message: 'Contact form submitted successfully. We will get back to you soon.',
    }, { status: 201 })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit contact form',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
