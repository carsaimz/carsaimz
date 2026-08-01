import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, isEmailConfigured, verifySmtpConnection, contactFormTemplate, ticketNotificationTemplate, welcomeEmailTemplate, ticketReplyTemplate } from '@/lib/email'

/**
 * POST /api/email — Send an email
 *
 * Body:
 *   type: 'contact' | 'ticket' | 'welcome' | 'ticket-reply' | 'custom'
 *   data: object (depends on type)
 *
 * For 'custom' type:
 *   data: { to, subject, html, text?, replyTo? }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if SMTP is configured
    if (!(await isEmailConfigured())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { success: false, message: 'type and data are required' },
        { status: 400 }
      )
    }

    let emailOptions

    switch (type) {
      case 'contact':
        emailOptions = contactFormTemplate(data)
        break
      case 'ticket':
        emailOptions = ticketNotificationTemplate(data)
        break
      case 'welcome':
        emailOptions = welcomeEmailTemplate(data)
        break
      case 'ticket-reply':
        emailOptions = ticketReplyTemplate(data)
        break
      case 'custom':
        if (!data.to || !data.subject || !data.html) {
          return NextResponse.json(
            { success: false, message: 'to, subject, and html are required for custom emails' },
            { status: 400 }
          )
        }
        emailOptions = data
        break
      default:
        return NextResponse.json(
          { success: false, message: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    const result = await sendEmail(emailOptions)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/email — Check email service status
 */
export async function GET() {
  const configured = await isEmailConfigured()

  if (!configured) {
    return NextResponse.json({
      success: true,
      configured: false,
      message: 'SMTP not configured. Set SMTP_USER and SMTP_PASS environment variables.',
    })
  }

  const verification = await verifySmtpConnection()

  return NextResponse.json({
    success: true,
    configured: true,
    connected: verification.success,
    error: verification.error,
  })
}
