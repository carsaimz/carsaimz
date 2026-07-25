import { NextRequest, NextResponse } from 'next/server'

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

    // Simulate successful contact form submission
    // Note: A ContactMessage model does not exist in the current schema.
    // In production, you would store this in a database table or send via email service.
    console.log('Contact form submission received:', {
      name,
      email,
      subject,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })

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
