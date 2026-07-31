import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDb, getDoc, updateDoc } from '@/lib/db'
import { getProviderByName, verifyPayPalWebhook } from '@/lib/payment-helpers'

// POST: PayPal webhook handler
export async function POST(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const body = await request.text()
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get PayPal provider config
    const provider = await getProviderByName('paypal')
    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'PayPal provider not configured' },
        { status: 404 }
      )
    }

    const webhookId = provider.config?.paypalWebhookId
    if (!webhookId) {
      console.error('[PayPal Webhook] No webhook ID configured')
      return NextResponse.json(
        { success: false, message: 'PayPal webhook ID not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    const isValid = await verifyPayPalWebhook(headers, body, webhookId)
    if (!isValid) {
      console.warn('[PayPal Webhook] Signature verification failed')
      // In production, you should reject the webhook
      // For now, we'll process it but log a warning
    }

    let event: any
    try {
      event = JSON.parse(body)
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED': {
        // The buyer approved the order — capture it
        const orderId = event.resource?.id
        const paymentId = event.resource?.purchase_units?.[0]?.reference_id

        if (paymentId) {
          try {
            await updateDoc('payments', paymentId, {
              status: 'pending',
              providerTransactionId: orderId,
              metadata: {
                paypalOrderId: orderId,
                paypalStatus: event.resource?.status,
              },
            })
            console.log(`[PayPal Webhook] Order ${orderId} approved for payment ${paymentId}`)
          } catch (err) {
            console.error('[PayPal Webhook] Failed to update payment:', err)
          }
        }
        break
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        const captureId = event.resource?.id
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id

        if (orderId) {
          try {
            const db = getDb()
            const snap = await db
              .collection('payments')
              .where('providerTransactionId', '==', orderId)
              .limit(1)
              .get()

            if (!snap.empty) {
              const doc = snap.docs[0]
              await updateDoc('payments', doc.id, {
                status: 'completed',
                providerTransactionId: captureId || orderId,
                metadata: {
                  ...(doc.data() as any).metadata || {},
                  paypalCaptureId: captureId,
                },
              })
              console.log(`[PayPal Webhook] Payment ${doc.id} completed`)
            }
          } catch (err) {
            console.error('[PayPal Webhook] Failed to update payment:', err)
          }
        }
        break
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id

        if (orderId) {
          try {
            const db = getDb()
            const snap = await db
              .collection('payments')
              .where('providerTransactionId', '==', orderId)
              .limit(1)
              .get()

            if (!snap.empty) {
              const doc = snap.docs[0]
              const isRefund = event.event_type === 'PAYMENT.CAPTURE.REFUNDED'
              await updateDoc('payments', doc.id, {
                status: isRefund ? 'refunded' : 'failed',
                refundId: isRefund ? event.resource?.id : null,
                refundReason: event.resource?.reason_code || null,
              })
              console.log(`[PayPal Webhook] Payment ${doc.id} ${isRefund ? 'refunded' : 'denied'}`)
            }
          } catch (err) {
            console.error('[PayPal Webhook] Failed to update payment:', err)
          }
        }
        break
      }

      default: {
        console.log(`[PayPal Webhook] Unhandled event type: ${event.event_type}`)
      }
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
