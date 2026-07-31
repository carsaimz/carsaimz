import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, updateDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import type { PaymentProvider } from '@/lib/payment-helpers'

// POST: Verify a payment status
export async function POST(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const body = await request.json()
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'paymentId is required' },
        { status: 400 }
      )
    }

    // Get payment record
    const payment = await getDoc('payments', paymentId)
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    const paymentData = payment as any
    const providerName = paymentData.providerName
    const providerId = paymentData.providerId

    // If already completed, return current status
    if (paymentData.status === 'completed' || paymentData.status === 'refunded') {
      return NextResponse.json({
        success: true,
        status: paymentData.status,
        data: serializeFirestore(paymentData),
      })
    }

    // Check with provider for current status
    let providerStatus: string | null = null
    let providerTransactionId: string | null = paymentData.providerTransactionId

    if (providerId) {
      const provider = await getDoc<PaymentProvider>('payment_providers', providerId)
      if (provider) {
        switch (providerName) {
          case 'stripe': {
            const result = await verifyStripePayment(provider, paymentData)
            providerStatus = result.status
            providerTransactionId = result.transactionId
            break
          }
          case 'paypal': {
            const result = await verifyPayPalPayment(provider, paymentData)
            providerStatus = result.status
            providerTransactionId = result.transactionId
            break
          }
          case 'mpesa': {
            const result = await verifyMpesaPayment(provider, paymentData)
            providerStatus = result.status
            providerTransactionId = result.transactionId
            break
          }
          case 'emola': {
            const result = await verifyEmolaPayment(provider, paymentData)
            providerStatus = result.status
            providerTransactionId = result.transactionId
            break
          }
          case 'bank_transfer': {
            // Bank transfer is manual — status stays as pending until admin confirms
            providerStatus = paymentData.status
            break
          }
        }
      }
    }

    // Map provider status to our status
    let mappedStatus: 'pending' | 'completed' | 'failed' | 'refunded' = 'pending'
    if (providerStatus === 'succeeded' || providerStatus === 'completed' || providerStatus === 'COMPLETED') {
      mappedStatus = 'completed'
    } else if (providerStatus === 'failed' || providerStatus === 'FAILED' || providerStatus === 'canceled') {
      mappedStatus = 'failed'
    } else if (providerStatus === 'refunded') {
      mappedStatus = 'refunded'
    } else if (providerStatus === 'pending' || providerStatus === 'requires_action' || providerStatus === 'PENDING') {
      mappedStatus = 'pending'
    } else {
      mappedStatus = paymentData.status || 'pending'
    }

    // Update payment status if changed
    if (mappedStatus !== paymentData.status || providerTransactionId !== paymentData.providerTransactionId) {
      await updateDoc('payments', paymentId, {
        status: mappedStatus,
        ...(providerTransactionId ? { providerTransactionId } : {}),
      })
    }

    const updatedPayment = await getDoc('payments', paymentId)

    return NextResponse.json({
      success: true,
      status: mappedStatus,
      data: serializeFirestore(updatedPayment),
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

// ─── Stripe Verification ───

async function verifyStripePayment(
  provider: PaymentProvider,
  payment: any
): Promise<{ status: string | null; transactionId: string | null }> {
  const secretKey = provider.config?.stripeSecretKey
  if (!secretKey) return { status: null, transactionId: null }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey)

    // If we have a payment intent ID in metadata
    const metadata = payment.metadata || {}
    const paymentIntentId = metadata.paymentIntentId || payment.providerTransactionId

    if (!paymentIntentId) {
      return { status: null, transactionId: null }
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      status: paymentIntent.status,
      transactionId: paymentIntent.id,
    }
  } catch (err: any) {
    console.error('Stripe verification error:', err.message)
    return { status: null, transactionId: null }
  }
}

// ─── PayPal Verification ───

async function verifyPayPalPayment(
  provider: PaymentProvider,
  payment: any
): Promise<{ status: string | null; transactionId: string | null }> {
  const clientId = provider.config?.paypalClientId
  const clientSecret = provider.config?.paypalClientSecret
  if (!clientId || !clientSecret) return { status: null, transactionId: null }

  try {
    const baseUrl = provider.isTestMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'

    const metadata = payment.metadata || {}
    const orderId = metadata.paypalOrderId || payment.providerTransactionId

    if (!orderId) return { status: null, transactionId: null }

    // Get access token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenRes.ok) return { status: null, transactionId: null }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Get order details
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!orderRes.ok) return { status: null, transactionId: null }

    const orderData = await orderRes.json()
    return {
      status: orderData.status,
      transactionId: orderId,
    }
  } catch (err: any) {
    console.error('PayPal verification error:', err.message)
    return { status: null, transactionId: null }
  }
}

// ─── M-Pesa Verification ───

async function verifyMpesaPayment(
  provider: PaymentProvider,
  payment: any
): Promise<{ status: string | null; transactionId: string | null }> {
  // M-Pesa doesn't have a direct status check API
  // Status is updated via webhook/callback
  return {
    status: payment.status,
    transactionId: payment.providerTransactionId,
  }
}

// ─── e-Mola Verification ───

async function verifyEmolaPayment(
  provider: PaymentProvider,
  payment: any
): Promise<{ status: string | null; transactionId: string | null }> {
  // e-Mola verification would check their API
  return {
    status: payment.status,
    transactionId: payment.providerTransactionId,
  }
}
