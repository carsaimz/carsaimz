import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDb, getDoc, updateDoc } from '@/lib/db'
import { getProviderByName } from '@/lib/payment-helpers'
import type { PaymentProvider } from '@/lib/payment-helpers'

// POST: Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Get Stripe provider config
    const provider = await getProviderByName('stripe')
    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Stripe provider not configured' },
        { status: 404 }
      )
    }

    const webhookSecret = provider.config?.stripeWebhookSecret
    if (!webhookSecret) {
      console.error('[Stripe Webhook] No webhook secret configured')
      return NextResponse.json(
        { success: false, message: 'Stripe webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: any
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(provider.config?.stripeSecretKey || '')
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message)
      return NextResponse.json(
        { success: false, message: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const paymentId = paymentIntent.metadata?.paymentId

        if (paymentId) {
          try {
            const payment = await getDoc('payments', paymentId)
            if (payment) {
              await updateDoc('payments', paymentId, {
                status: 'completed',
                providerTransactionId: paymentIntent.id,
                metadata: {
                  ...(payment as any).metadata || {},
                  stripePaymentIntentId: paymentIntent.id,
                  stripeChargeId: paymentIntent.latest_charge,
                },
              })
              console.log(`[Stripe Webhook] Payment ${paymentId} completed`)
            }
          } catch (err) {
            console.error('[Stripe Webhook] Failed to update payment:', err)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const paymentId = paymentIntent.metadata?.paymentId

        if (paymentId) {
          try {
            const payment = await getDoc('payments', paymentId)
            if (payment) {
              await updateDoc('payments', paymentId, {
                status: 'failed',
                providerTransactionId: paymentIntent.id,
                metadata: {
                  ...(payment as any).metadata || {},
                  stripePaymentIntentId: paymentIntent.id,
                  failureReason: paymentIntent.last_payment_error?.message || 'Unknown',
                },
              })
              console.log(`[Stripe Webhook] Payment ${paymentId} failed`)
            }
          } catch (err) {
            console.error('[Stripe Webhook] Failed to update payment:', err)
          }
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        const paymentIntentId = charge.payment_intent

        if (paymentIntentId) {
          try {
            const db = getDb()
            const snap = await db
              .collection('payments')
              .where('providerTransactionId', '==', paymentIntentId)
              .limit(1)
              .get()

            if (!snap.empty) {
              const doc = snap.docs[0]
              await updateDoc('payments', doc.id, {
                status: 'refunded',
                refundId: charge.refunds?.data?.[0]?.id || null,
                refundAmount: charge.amount_refunded ? charge.amount_refunded / 100 : null,
                refundReason: charge.refunds?.data?.[0]?.reason || null,
              })
              console.log(`[Stripe Webhook] Payment ${doc.id} refunded`)
            }
          } catch (err) {
            console.error('[Stripe Webhook] Failed to update refund:', err)
          }
        }
        break
      }

      default: {
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      }
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
