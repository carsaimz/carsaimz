/**
 * Carsai Mozambique — Payment Helpers
 *
 * Utility functions for managing payment providers and payment records.
 * Uses Firestore for storage (Firebase Admin SDK on server side).
 */

import { getDb, createDoc, updateDoc, getDoc, getDocs, createDocWithId, now } from '@/lib/db'
import { FieldValue } from 'firebase-admin/firestore'

// ─── Types ───

export type ProviderName = 'stripe' | 'paypal' | 'mpesa' | 'emola' | 'bank_transfer' | 'manual_transfer' | 'pos' | 'merchant_code' | 'qr_payment'

export interface PaymentProviderConfig {
  // Stripe
  stripePublicKey?: string | null
  stripeSecretKey?: string | null
  stripeWebhookSecret?: string | null
  // PayPal
  paypalClientId?: string | null
  paypalClientSecret?: string | null
  paypalWebhookId?: string | null
  // M-Pesa (Vodacom Mozambique)
  mpesaApiKey?: string | null
  mpesaPublicKey?: string | null
  mpesaServiceProviderCode?: string | null
  // e-Mola
  emolaApiKey?: string | null
  emolaMerchantId?: string | null
  // Bank Transfer
  bankName?: string | null
  bankAccountName?: string | null
  bankAccountNumber?: string | null
  bankIban?: string | null
  bankInstructions?: string | null
  bankInstructionsI18n?: string | null
  // Manual Transfer
  transferInstructions?: string | null
  transferInstructionsI18n?: string | null
  // POS Terminal
  posTerminalId?: string | null
  posInstructions?: string | null
  posInstructionsI18n?: string | null
  // Merchant Code
  merchantCode?: string | null
  merchantCodeInstructions?: string | null
  merchantCodeInstructionsI18n?: string | null
  // QR Payment
  qrCodeUrl?: string | null
  qrInstructions?: string | null
  qrInstructionsI18n?: string | null
}

export interface PaymentProvider {
  id: string
  name: ProviderName
  displayName: string
  description: string
  isActive: boolean
  isTestMode: boolean
  config: PaymentProviderConfig
  supportedCurrencies: string[]
  processingFee: number
  processingFeeFixed: number
  minAmount: number
  maxAmount: number
  order: number
  createdAt: any
  updatedAt: any
}

export interface PaymentRecord {
  id?: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: string
  description?: string
  providerId?: string
  providerName?: string
  providerTransactionId?: string | null
  providerFee?: number
  netAmount?: number
  refundId?: string | null
  refundAmount?: number | null
  refundReason?: string | null
  metadata?: Record<string, any>
  createdAt?: any
  updatedAt?: any
}

// ─── Default Providers ───

const DEFAULT_PROVIDERS: Omit<PaymentProvider, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'stripe',
    displayName: 'Stripe',
    description: 'International card payments (Visa, Mastercard, etc.)',
    isActive: true,
    isTestMode: true,
    config: {
      stripePublicKey: null,
      stripeSecretKey: null,
      stripeWebhookSecret: null,
    },
    supportedCurrencies: ['MZN', 'USD'],
    processingFee: 2.9,
    processingFeeFixed: 0.30,
    minAmount: 10,
    maxAmount: 0,
    order: 1,
  },
  {
    name: 'paypal',
    displayName: 'PayPal',
    description: 'International PayPal payments',
    isActive: false,
    isTestMode: true,
    config: {
      paypalClientId: null,
      paypalClientSecret: null,
      paypalWebhookId: null,
    },
    supportedCurrencies: ['USD'],
    processingFee: 3.49,
    processingFeeFixed: 0.49,
    minAmount: 10,
    maxAmount: 0,
    order: 2,
  },
  {
    name: 'mpesa',
    displayName: 'M-Pesa',
    description: 'Vodacom M-Pesa mobile payments (Mozambique)',
    isActive: true,
    isTestMode: true,
    config: {
      mpesaApiKey: null,
      mpesaPublicKey: null,
      mpesaServiceProviderCode: null,
    },
    supportedCurrencies: ['MZN'],
    processingFee: 1.0,
    processingFeeFixed: 0,
    minAmount: 5,
    maxAmount: 50000,
    order: 3,
  },
  {
    name: 'emola',
    displayName: 'e-Mola',
    description: 'Mozambique mobile money payments',
    isActive: false,
    isTestMode: true,
    config: {
      emolaApiKey: null,
      emolaMerchantId: null,
    },
    supportedCurrencies: ['MZN'],
    processingFee: 1.5,
    processingFeeFixed: 0,
    minAmount: 5,
    maxAmount: 30000,
    order: 4,
  },
  {
    name: 'bank_transfer',
    displayName: 'Transferência Bancária',
    description: 'Direct bank transfer (manual verification)',
    isActive: true,
    isTestMode: false,
    config: {
      bankName: null,
      bankAccountName: null,
      bankAccountNumber: null,
      bankIban: null,
      bankInstructions: null,
      bankInstructionsI18n: null,
    },
    supportedCurrencies: ['MZN', 'USD'],
    processingFee: 0,
    processingFeeFixed: 0,
    minAmount: 0,
    maxAmount: 0,
    order: 5,
  },
  {
    name: 'manual_transfer',
    displayName: 'Transferência Manual',
    description: 'Pagamento via transferência bancária manual com instruções',
    isActive: false,
    isTestMode: false,
    config: {
      transferInstructions: null,
      transferInstructionsI18n: null,
    },
    supportedCurrencies: ['MZN', 'USD'],
    processingFee: 0,
    processingFeeFixed: 0,
    minAmount: 0,
    maxAmount: 0,
    order: 6,
  },
  {
    name: 'pos',
    displayName: 'Pagamento via POS',
    description: 'Pagamento através de terminal POS (máquina de cartão)',
    isActive: false,
    isTestMode: false,
    config: {
      posTerminalId: null,
      posInstructions: null,
      posInstructionsI18n: null,
    },
    supportedCurrencies: ['MZN', 'USD'],
    processingFee: 2.5,
    processingFeeFixed: 0,
    minAmount: 10,
    maxAmount: 0,
    order: 7,
  },
  {
    name: 'merchant_code',
    displayName: 'Código de Comerciante',
    description: 'Pagamento usando código de comerciante (referência)',
    isActive: false,
    isTestMode: false,
    config: {
      merchantCode: null,
      merchantCodeInstructions: null,
      merchantCodeInstructionsI18n: null,
    },
    supportedCurrencies: ['MZN'],
    processingFee: 0,
    processingFeeFixed: 0,
    minAmount: 0,
    maxAmount: 0,
    order: 8,
  },
  {
    name: 'qr_payment',
    displayName: 'Pagamento via QR Code',
    description: 'Pagamento escaneando QR Code (EMV/M-Pesa)',
    isActive: false,
    isTestMode: false,
    config: {
      qrCodeUrl: null,
      qrInstructions: null,
      qrInstructionsI18n: null,
    },
    supportedCurrencies: ['MZN'],
    processingFee: 1.0,
    processingFeeFixed: 0,
    minAmount: 5,
    maxAmount: 0,
    order: 9,
  },
]

// ─── Helper Functions ───

/**
 * Initialize default payment providers if none exist.
 */
export async function initializePaymentProviders(): Promise<void> {
  try {
    const existing = await getDocs<PaymentProvider>('payment_providers')
    if (existing.length > 0) return

    for (const provider of DEFAULT_PROVIDERS) {
      await createDoc('payment_providers', {
        ...provider,
        config: provider.config || {},
      })
    }
    console.log('[PaymentHelpers] Initialized default payment providers')
  } catch (err) {
    console.error('[PaymentHelpers] Failed to initialize providers:', err)
  }
}

/**
 * Get all active payment providers.
 */
export async function getActiveProviders(): Promise<PaymentProvider[]> {
  try {
    const db = getDb()
    const snap = await db
      .collection('payment_providers')
      .where('isActive', '==', true)
      .orderBy('order', 'asc')
      .get()

    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentProvider))
  } catch (err) {
    console.error('[PaymentHelpers] Failed to get active providers:', err)
    return []
  }
}

/**
 * Get all payment providers (including inactive).
 */
export async function getAllProviders(): Promise<PaymentProvider[]> {
  try {
    const db = getDb()
    const snap = await db
      .collection('payment_providers')
      .orderBy('order', 'asc')
      .get()

    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentProvider))
  } catch (err) {
    console.error('[PaymentHelpers] Failed to get all providers:', err)
    return []
  }
}

/**
 * Calculate processing fee for a payment.
 */
export function calculateProcessingFee(
  provider: PaymentProvider,
  amount: number
): { fee: number; netAmount: number } {
  const percentageFee = (amount * provider.processingFee) / 100
  const fixedFee = provider.processingFeeFixed || 0
  const fee = Math.round((percentageFee + fixedFee) * 100) / 100
  const netAmount = Math.round((amount - fee) * 100) / 100
  return { fee, netAmount }
}

/**
 * Create a payment record in Firestore.
 */
export async function createPaymentRecord(
  data: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = await createDoc('payments', {
    ...data,
    status: data.status || 'pending',
    providerTransactionId: data.providerTransactionId || null,
    providerFee: data.providerFee || 0,
    netAmount: data.netAmount || data.amount,
    refundId: null,
    refundAmount: null,
    refundReason: null,
    metadata: data.metadata || {},
  })
  return id
}

/**
 * Update payment status in Firestore.
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  providerData?: {
    providerTransactionId?: string
    providerFee?: number
    netAmount?: number
    refundId?: string
    refundAmount?: number
    refundReason?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  const updateData: Record<string, any> = { status }
  if (providerData) {
    if (providerData.providerTransactionId !== undefined) updateData.providerTransactionId = providerData.providerTransactionId
    if (providerData.providerFee !== undefined) updateData.providerFee = providerData.providerFee
    if (providerData.netAmount !== undefined) updateData.netAmount = providerData.netAmount
    if (providerData.refundId !== undefined) updateData.refundId = providerData.refundId
    if (providerData.refundAmount !== undefined) updateData.refundAmount = providerData.refundAmount
    if (providerData.refundReason !== undefined) updateData.refundReason = providerData.refundReason
    if (providerData.metadata !== undefined) updateData.metadata = providerData.metadata
  }
  await updateDoc('payments', paymentId, updateData)
}

/**
 * Verify Stripe webhook signature.
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string
): any {
  // Dynamic import handled at the route level
  // This is a placeholder — actual verification uses the stripe library
  throw new Error('Use stripe.webhooks.constructEvent directly in the webhook route')
}

/**
 * Verify PayPal webhook signature.
 * In production, this should call PayPal's API to verify the webhook.
 */
export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  body: string,
  webhookId: string
): Promise<boolean> {
  // Simplified verification — in production, use PayPal's verification API
  // For now, we check that the required headers exist
  return !!(headers['paypal-transmission-id'] && headers['paypal-cert-url'])
}

/**
 * Get a provider by ID.
 */
export async function getProviderById(
  providerId: string
): Promise<PaymentProvider | null> {
  return await getDoc<PaymentProvider>('payment_providers', providerId)
}

/**
 * Get a provider by name.
 */
export async function getProviderByName(
  name: ProviderName
): Promise<PaymentProvider | null> {
  try {
    const db = getDb()
    const snap = await db
      .collection('payment_providers')
      .where('name', '==', name)
      .limit(1)
      .get()

    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as PaymentProvider
  } catch {
    return null
  }
}

/**
 * Mask a secret key for display (show only last 4 chars).
 */
export function maskSecret(key: string | null | undefined): string {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return '••••••••' + key.slice(-4)
}

/**
 * Get public config for a provider (safe to send to client).
 * Strips all secret keys.
 */
export function getPublicProviderConfig(
  provider: PaymentProvider
): Record<string, any> {
  const config: Record<string, any> = {}
  // Only include public keys
  if (provider.config.stripePublicKey) {
    config.stripePublicKey = provider.config.stripePublicKey
  }
  // Bank transfer details are safe to show
  if (provider.config.bankName) config.bankName = provider.config.bankName
  if (provider.config.bankAccountName) config.bankAccountName = provider.config.bankAccountName
  if (provider.config.bankAccountNumber) config.bankAccountNumber = provider.config.bankAccountNumber
  if (provider.config.bankIban) config.bankIban = provider.config.bankIban
  if (provider.config.bankInstructions) config.bankInstructions = provider.config.bankInstructions
  if (provider.config.bankInstructionsI18n) config.bankInstructionsI18n = provider.config.bankInstructionsI18n
  // Manual transfer instructions
  if (provider.config.transferInstructions) config.transferInstructions = provider.config.transferInstructions
  if (provider.config.transferInstructionsI18n) config.transferInstructionsI18n = provider.config.transferInstructionsI18n
  // POS instructions
  if (provider.config.posTerminalId) config.posTerminalId = provider.config.posTerminalId
  if (provider.config.posInstructions) config.posInstructions = provider.config.posInstructions
  if (provider.config.posInstructionsI18n) config.posInstructionsI18n = provider.config.posInstructionsI18n
  // Merchant code instructions
  if (provider.config.merchantCode) config.merchantCode = provider.config.merchantCode
  if (provider.config.merchantCodeInstructions) config.merchantCodeInstructions = provider.config.merchantCodeInstructions
  if (provider.config.merchantCodeInstructionsI18n) config.merchantCodeInstructionsI18n = provider.config.merchantCodeInstructionsI18n
  // QR payment instructions
  if (provider.config.qrCodeUrl) config.qrCodeUrl = provider.config.qrCodeUrl
  if (provider.config.qrInstructions) config.qrInstructions = provider.config.qrInstructions
  if (provider.config.qrInstructionsI18n) config.qrInstructionsI18n = provider.config.qrInstructionsI18n
  return config
}
