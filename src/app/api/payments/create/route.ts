import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import {
  getProviderById,
  calculateProcessingFee,
  createPaymentRecord,
  getPublicProviderConfig,
} from '@/lib/payment-helpers'
import type { PaymentProvider } from '@/lib/payment-helpers'

// POST: Create a payment intent/checkout session
export async function POST(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const body = await request.json()
    const { amount, currency, providerId, description, metadata, userId } = body

    if (!amount || !currency || !providerId) {
      return NextResponse.json(
        { success: false, message: 'amount, currency, and providerId are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const provider = await getProviderById(providerId)
    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Payment provider not found' },
        { status: 404 }
      )
    }

    if (!provider.isActive) {
      return NextResponse.json(
        { success: false, message: 'Payment provider is not active' },
        { status: 400 }
      )
    }

    // Check min/max amounts
    if (provider.minAmount > 0 && amount < provider.minAmount) {
      return NextResponse.json(
        { success: false, message: `Minimum amount is ${provider.minAmount} ${currency}` },
        { status: 400 }
      )
    }
    if (provider.maxAmount > 0 && amount > provider.maxAmount) {
      return NextResponse.json(
        { success: false, message: `Maximum amount is ${provider.maxAmount} ${currency}` },
        { status: 400 }
      )
    }

    // Check supported currencies
    if (!provider.supportedCurrencies.includes(currency)) {
      return NextResponse.json(
        { success: false, message: `Currency ${currency} is not supported by ${provider.displayName}` },
        { status: 400 }
      )
    }

    // Calculate processing fee
    const { fee, netAmount } = calculateProcessingFee(provider, amount)

    // Create payment record first
    const paymentId = await createPaymentRecord({
      userId: userId || 'guest',
      amount,
      currency,
      status: 'pending',
      method: provider.displayName,
      description: description || '',
      providerId: provider.id,
      providerName: provider.name,
      providerTransactionId: null,
      providerFee: fee,
      netAmount,
      metadata: metadata || {},
    })

    // Process based on provider type
    let providerData: Record<string, any> = {}

    switch (provider.name) {
      case 'stripe': {
        providerData = await processStripePayment(provider, amount, currency, paymentId, description)
        break
      }
      case 'paypal': {
        providerData = await processPayPalPayment(provider, amount, currency, paymentId, description)
        break
      }
      case 'mpesa': {
        providerData = await processMpesaPayment(provider, amount, currency, paymentId, metadata)
        break
      }
      case 'emola': {
        providerData = await processEmolaPayment(provider, amount, currency, paymentId, metadata)
        break
      }
      case 'bank_transfer': {
        providerData = processBankTransfer(provider, paymentId)
        break
      }
      default: {
        return NextResponse.json(
          { success: false, message: `Unsupported provider: ${provider.name}` },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId,
        providerData,
        fee,
        netAmount,
      },
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    )
  }
}

// ─── Stripe Payment Processing ───

async function processStripePayment(
  provider: PaymentProvider,
  amount: number,
  currency: string,
  paymentId: string,
  description?: string
): Promise<Record<string, any>> {
  const secretKey = provider.config.stripeSecretKey

  if (!secretKey) {
    return {
      type: 'stripe',
      requiresConfiguration: true,
      message: 'Stripe secret key is not configured',
    }
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey)

    // Convert amount to cents (smallest currency unit)
    const amountInCents = currency === 'MZN' ? Math.round(amount * 100) : Math.round(amount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        paymentId,
        description: description || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      type: 'stripe',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publicKey: provider.config.stripePublicKey,
    }
  } catch (err: any) {
    console.error('Stripe payment intent error:', err.message)
    return {
      type: 'stripe',
      error: err.message,
      requiresConfiguration: err.message.includes('key'),
    }
  }
}

// ─── PayPal Payment Processing ───

async function processPayPalPayment(
  provider: PaymentProvider,
  amount: number,
  currency: string,
  paymentId: string,
  description?: string
): Promise<Record<string, any>> {
  const clientId = provider.config.paypalClientId
  const clientSecret = provider.config.paypalClientSecret

  if (!clientId || !clientSecret) {
    return {
      type: 'paypal',
      requiresConfiguration: true,
      message: 'PayPal credentials are not configured',
    }
  }

  try {
    const baseUrl = provider.isTestMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'

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

    if (!tokenRes.ok) {
      throw new Error('Failed to get PayPal access token')
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Create order
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: paymentId,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: description || `Payment ${paymentId}`,
        }],
      }),
    })

    if (!orderRes.ok) {
      const errData = await orderRes.json().catch(() => ({}))
      throw new Error(errData.message || 'Failed to create PayPal order')
    }

    const orderData = await orderRes.json()
    const approvalLink = orderData.links?.find((l: any) => l.rel === 'approve')?.href

    return {
      type: 'paypal',
      orderId: orderData.id,
      approvalUrl: approvalLink,
      status: orderData.status,
    }
  } catch (err: any) {
    console.error('PayPal order error:', err.message)
    return {
      type: 'paypal',
      error: err.message,
      requiresConfiguration: err.message.includes('token') || err.message.includes('credentials'),
    }
  }
}

// ─── M-Pesa Payment Processing ───

async function processMpesaPayment(
  provider: PaymentProvider,
  amount: number,
  currency: string,
  paymentId: string,
  metadata?: Record<string, any>
): Promise<Record<string, any>> {
  const apiKey = provider.config.mpesaApiKey
  const publicKey = provider.config.mpesaPublicKey
  const serviceProviderCode = provider.config.mpesaServiceProviderCode

  if (!apiKey || !publicKey || !serviceProviderCode) {
    return {
      type: 'mpesa',
      requiresConfiguration: true,
      message: 'M-Pesa credentials are not configured',
    }
  }

  const phoneNumber = metadata?.phoneNumber

  if (!phoneNumber) {
    return {
      type: 'mpesa',
      requiresPhoneNumber: true,
      message: 'Phone number is required for M-Pesa payment',
    }
  }

  try {
    const baseUrl = provider.isTestMode
      ? 'https://api.sandbox.vm.co.mz'
      : 'https://api.vm.co.mz'

    // Generate auth token
    const authStr = Buffer.from(`${publicKey}:${apiKey}`).toString('base64')
    const tokenRes = await fetch(`${baseUrl}/v1/auth/token`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authStr}`,
        'Content-Type': 'application/json',
      },
    })

    if (!tokenRes.ok) {
      throw new Error('Failed to get M-Pesa access token')
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Initiate C2B payment
    const paymentRes = await fetch(`${baseUrl}/v1/c2b/payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input_Amount: amount,
        input_Country: 'MZN',
        input_Currency: currency,
        input_CustomerMSISDN: phoneNumber,
        input_ServiceProviderCode: serviceProviderCode,
        input_TransactionReference: paymentId,
        input_ThirdPartyConversationID: paymentId,
        input_ThirdPartyReference: paymentId.slice(0, 20),
      }),
    })

    const paymentData = await paymentRes.json().catch(() => ({}))

    if (!paymentRes.ok) {
      throw new Error(paymentData.message || 'Failed to initiate M-Pesa payment')
    }

    return {
      type: 'mpesa',
      transactionId: paymentData.output_TransactionID || paymentData.output_ConversationID,
      conversationId: paymentData.output_ConversationID,
      responseCode: paymentData.output_ResponseCode,
      status: 'pending',
      message: 'M-Pesa payment initiated. Check your phone for confirmation.',
    }
  } catch (err: any) {
    console.error('M-Pesa payment error:', err.message)
    return {
      type: 'mpesa',
      error: err.message,
      requiresConfiguration: err.message.includes('token') || err.message.includes('credentials'),
    }
  }
}

// ─── e-Mola Payment Processing ───

async function processEmolaPayment(
  provider: PaymentProvider,
  amount: number,
  currency: string,
  paymentId: string,
  metadata?: Record<string, any>
): Promise<Record<string, any>> {
  const apiKey = provider.config.emolaApiKey
  const merchantId = provider.config.emolaMerchantId

  if (!apiKey || !merchantId) {
    return {
      type: 'emola',
      requiresConfiguration: true,
      message: 'e-Mola credentials are not configured',
    }
  }

  const phoneNumber = metadata?.phoneNumber

  if (!phoneNumber) {
    return {
      type: 'emola',
      requiresPhoneNumber: true,
      message: 'Phone number is required for e-Mola payment',
    }
  }

  try {
    // e-Mola API endpoint (adjust based on actual API documentation)
    const baseUrl = provider.isTestMode
      ? 'https://api.sandbox.emola.co.mz'
      : 'https://api.emola.co.mz'

    const paymentRes = await fetch(`${baseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Merchant-ID': merchantId,
      },
      body: JSON.stringify({
        amount,
        currency,
        phoneNumber,
        reference: paymentId,
        description: `Payment ${paymentId}`,
      }),
    })

    const paymentData = await paymentRes.json().catch(() => ({}))

    if (!paymentRes.ok) {
      throw new Error(paymentData.message || 'Failed to initiate e-Mola payment')
    }

    return {
      type: 'emola',
      transactionId: paymentData.transactionId || paymentData.id,
      status: 'pending',
      message: 'e-Mola payment initiated. Check your phone for confirmation.',
    }
  } catch (err: any) {
    console.error('e-Mola payment error:', err.message)
    return {
      type: 'emola',
      error: err.message,
      requiresConfiguration: err.message.includes('token') || err.message.includes('credentials'),
    }
  }
}

// ─── Bank Transfer Processing ───

function processBankTransfer(
  provider: PaymentProvider,
  paymentId: string
): Record<string, any> {
  return {
    type: 'bank_transfer',
    bankName: provider.config.bankName || 'Not configured',
    accountName: provider.config.bankAccountName || 'Not configured',
    accountNumber: provider.config.bankAccountNumber || 'Not configured',
    iban: provider.config.bankIban || 'Not configured',
    instructions: provider.config.bankInstructions || 'Please make the transfer and send proof of payment.',
    reference: paymentId,
    status: 'pending',
    message: 'Please make the bank transfer using the details above and send proof of payment.',
  }
}
