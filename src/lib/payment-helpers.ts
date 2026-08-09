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
    isActive: true,
    isTestMode: false,
    config: {
      transferInstructions: 'Faça a transferência bancária para a conta indicada e envie o comprovativo de pagamento através do formulário abaixo ou por email para carsaimozambique@gmail.com. O pagamento será confirmado após verificação.',
      transferInstructionsI18n: JSON.stringify({
        'pt-pt': 'Faça a transferência bancária para a conta indicada e envie o comprovativo de pagamento através do formulário abaixo ou por email para carsaimozambique@gmail.com. O pagamento será confirmado após verificação.',
        'en-us': 'Make the bank transfer to the indicated account and send the proof of payment through the form below or by email to carsaimozambique@gmail.com. Payment will be confirmed after verification.',
        'pt-br': 'Faça a transferência bancária para a conta indicada e envie o comprovativo de pagamento através do formulário abaixo ou por email para carsaimozambique@gmail.com. O pagamento será confirmado após verificação.',
        'fr-fr': 'Effectuez le virement bancaire sur le compte indiqué et envoyez la preuve de paiement via le formulaire ci-dessous ou par email à carsaimozambique@gmail.com. Le paiement sera confirmé après vérification.',
        'es-es': 'Realice la transferencia bancaria a la cuenta indicada y envíe el comprobante de pago a través del formulario a continuación o por correo electrónico a carsaimozambique@gmail.com. El pago será confirmado tras la verificación.',
        'zh-cn': '请向指定账户进行银行转账，并通过下方表格或发送电子邮件至 carsaimozambique@gmail.com 提交付款凭证。付款将在核实后确认。',
        'de-de': 'Überweisen Sie den Betrag auf das angegebene Konto und senden Sie den Zahlungsbeleg über das untenstehende Formular oder per E-Mail an carsaimozambique@gmail.com. Die Zahlung wird nach Prüfung bestätigt.',
        'sw-tz': 'Fanya uhamisho wa benki kwa akaunti iliyotajwa na utume uthibati wa malipo kupitia fomu hapa chini au kwa barua pepe kwa carsaimozambique@gmail.com. Malipo yatathibitishwa baada ya uhakiki.',
      }),
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
    isActive: true,
    isTestMode: false,
    config: {
      posTerminalId: null,
      posInstructions: 'Dirija-se ao nosso escritório em Montepuez, Cabo Delgado, para efectuar o pagamento via terminal POS (máquina de cartão). Apresente o seu código de referência ao operador.',
      posInstructionsI18n: JSON.stringify({
        'pt-pt': 'Dirija-se ao nosso escritório em Montepuez, Cabo Delgado, para efectuar o pagamento via terminal POS (máquina de cartão). Apresente o seu código de referência ao operador.',
        'en-us': 'Visit our office in Montepuez, Cabo Delgado, to make the payment via POS terminal (card machine). Present your reference code to the operator.',
        'pt-br': 'Dirija-se ao nosso escritório em Montepuez, Cabo Delgado, para realizar o pagamento via terminal POS (máquina de cartão). Apresente seu código de referência ao operador.',
        'fr-fr': 'Rendez-vous à notre bureau à Montepuez, Cabo Delgado, pour effectuer le paiement via terminal POS (machine à carte). Présentez votre code de référence à l\'opérateur.',
        'es-es': 'Diríjase a nuestra oficina en Montepuez, Cabo Delgado, para realizar el pago a través de terminal POS (máquina de tarjeta). Presente su código de referencia al operador.',
        'zh-cn': '请前往我们在蒙特普兹（Cabo Delgado）的办公室，通过POS终端（刷卡机）进行付款。向操作员出示您的参考代码。',
        'de-de': 'Besuchen Sie unser Büro in Montepuez, Cabo Delgado, um die Zahlung über ein POS-Terminal (Kartenmaschine) vorzunehmen. Zeigen Sie dem Bediener Ihren Referenzcode.',
        'sw-tz': 'Nenda ofisi yetu Montepuez, Cabo Delgado, kulipia kupitia kituo cha POS (mashine ya kadi). Wasilisha nambari yako ya marejeleo kwa muendeshaji.',
      }),
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
    isActive: true,
    isTestMode: false,
    config: {
      merchantCode: null,
      merchantCodeInstructions: 'Utilize o código de comerciante fornecido para efectuar o pagamento em qualquer agente autorizado (banco, multibanco, ou agente M-Pesa). O pagamento será confirmado automaticamente.',
      merchantCodeInstructionsI18n: JSON.stringify({
        'pt-pt': 'Utilize o código de comerciante fornecido para efectuar o pagamento em qualquer agente autorizado (banco, multibanco, ou agente M-Pesa). O pagamento será confirmado automaticamente.',
        'en-us': 'Use the provided merchant code to make the payment at any authorized agent (bank, ATM, or M-Pesa agent). Payment will be confirmed automatically.',
        'pt-br': 'Utilize o código de comerciante fornecido para realizar o pagamento em qualquer agente autorizado (banco, caixa eletrônico, ou agente M-Pesa). O pagamento será confirmado automaticamente.',
        'fr-fr': 'Utilisez le code marchand fourni pour effectuer le paiement auprès de tout agent autorisé (banque, distributeur, ou agent M-Pesa). Le paiement sera confirmé automatiquement.',
        'es-es': 'Utilice el código de comerciante proporcionado para realizar el pago en cualquier agente autorizado (banco, cajero automático, o agente M-Pesa). El pago se confirmará automáticamente.',
        'zh-cn': '使用提供的商户代码在任何授权代理（银行、ATM或M-Pesa代理）处进行付款。付款将自动确认。',
        'de-de': 'Verwenden Sie den angegebenen Händlercode, um die Zahlung bei einem autorisierten Vertreter (Bank, Geldautomat oder M-Pesa-Agent) vorzunehmen. Die Zahlung wird automatisch bestätigt.',
        'sw-tz': 'Tumia nambari ya mfanyabiashara iliyotolewa kulipia kupitia wakala yeyote aliyeidhinishwa (benki, ATM, au wakala wa M-Pesa). Malipo yatathibitishwa kiotomatiki.',
      }),
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
    isActive: true,
    isTestMode: false,
    config: {
      qrCodeUrl: null,
      qrInstructions: 'Escaneie o código QR com a sua aplicação de pagamento móvel (M-Pesa, e-Mola, ou app bancária) para completar o pagamento. O pagamento será confirmado automaticamente.',
      qrInstructionsI18n: JSON.stringify({
        'pt-pt': 'Escaneie o código QR com a sua aplicação de pagamento móvel (M-Pesa, e-Mola, ou app bancária) para completar o pagamento. O pagamento será confirmado automaticamente.',
        'en-us': 'Scan the QR code with your mobile payment app (M-Pesa, e-Mola, or banking app) to complete the payment. Payment will be confirmed automatically.',
        'pt-br': 'Escaneie o código QR com seu aplicativo de pagamento móvel (M-Pesa, e-Mola, ou app bancário) para completar o pagamento. O pagamento será confirmado automaticamente.',
        'fr-fr': 'Scannez le code QR avec votre application de paiement mobile (M-Pesa, e-Mola, ou application bancaire) pour effectuer le paiement. Le paiement sera confirmé automatiquement.',
        'es-es': 'Escanee el código QR con su aplicación de pago móvil (M-Pesa, e-Mola, o app bancaria) para completar el pago. El pago se confirmará automáticamente.',
        'zh-cn': '使用您的移动支付应用（M-Pesa、e-Mola或银行应用）扫描二维码完成付款。付款将自动确认。',
        'de-de': 'Scannen Sie den QR-Code mit Ihrer mobilen Zahlungs-App (M-Pesa, e-Mola oder Banking-App), um die Zahlung abzuschließen. Die Zahlung wird automatisch bestätigt.',
        'sw-tz': 'Soma kodi ya QR kwa programu yako ya malipo ya simu (M-Pesa, e-Mola, au programu ya benki) kukamilisha malipo. Malipo yatathibitishwa kiotomatiki.',
      }),
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
