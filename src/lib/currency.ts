/**
 * Carsai Mozambique — Currency Conversion Utility
 *
 * Handles conversion between MZN (Metical moçambicano) and foreign currencies
 * for external payment providers (Stripe, PayPal, etc.) that don't support MZN.
 *
 * Exchange rates are approximate and can be updated via admin settings.
 * The primary use case: converting MZN prices to USD for Stripe/PayPal checkout.
 *
 * IMPORTANT: All internal prices are stored in MZN. Conversion only happens
 * at the checkout layer when sending the amount to an external provider.
 */

// ─── Exchange rates (MZN → target currency) ─────────────────────────────────
// These are approximate rates. In production, these should be fetched from
// an exchange rate API or stored in Firestore admin settings.
// Rate = 1 MZN in target currency

const EXCHANGE_RATES: Record<string, number> = {
  USD: 0.0157,    // ~63.75 MZN per USD
  EUR: 0.0144,    // ~69.44 MZN per EUR
  GBP: 0.0123,    // ~81.30 MZN per GBP
  ZAR: 0.289,     // ~3.46 MZN per ZAR
  BRL: 0.089,     // ~11.24 MZN per BRL
}

// ─── Currency metadata ───────────────────────────────────────────────────────

export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  decimals: number
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  MZN: { code: 'MZN', symbol: 'MT', name: 'Metical moçambicano', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
}

/**
 * Convert an amount from MZN to a target currency.
 *
 * @param amountMZN - Amount in MZN (Metical)
 * @param targetCurrency - Target currency code (e.g., 'USD', 'EUR')
 * @returns Converted amount in the target currency, or the original amount if no conversion needed
 *
 * @example
 * convertFromMZN(1000, 'USD') // → ~15.70 USD
 * convertFromMZN(1000, 'MZN') // → 1000 (no conversion needed)
 */
export function convertFromMZN(amountMZN: number, targetCurrency: string): number {
  if (targetCurrency === 'MZN') return amountMZN

  const rate = EXCHANGE_RATES[targetCurrency]
  if (!rate) {
    console.warn(`[Currency] No exchange rate for ${targetCurrency}, returning original amount`)
    return amountMZN
  }

  const converted = amountMZN * rate
  const decimals = CURRENCIES[targetCurrency]?.decimals ?? 2

  // Round to appropriate decimal places
  return Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Convert an amount from a foreign currency to MZN.
 *
 * @param amountForeign - Amount in the foreign currency
 * @param sourceCurrency - Source currency code (e.g., 'USD', 'EUR')
 * @returns Amount in MZN
 *
 * @example
 * convertToMZN(15.70, 'USD') // → ~1000 MZN
 */
export function convertToMZN(amountForeign: number, sourceCurrency: string): number {
  if (sourceCurrency === 'MZN') return amountForeign

  const rate = EXCHANGE_RATES[sourceCurrency]
  if (!rate) {
    console.warn(`[Currency] No exchange rate for ${sourceCurrency}, returning original amount`)
    return amountForeign
  }

  return Math.round((amountForeign / rate) * 100) / 100
}

/**
 * Get the exchange rate for a target currency.
 *
 * @param targetCurrency - Target currency code
 * @returns Exchange rate (1 MZN = X target currency), or 1 if not found
 */
export function getExchangeRate(targetCurrency: string): number {
  return EXCHANGE_RATES[targetCurrency] ?? 1
}

/**
 * Update an exchange rate (e.g., from admin settings).
 *
 * @param currency - Currency code
 * @param rate - New rate (1 MZN = X currency)
 */
export function setExchangeRate(currency: string, rate: number): void {
  EXCHANGE_RATES[currency] = rate
}

/**
 * Format a converted amount with the target currency symbol.
 *
 * @param amountMZN - Amount in MZN
 * @param targetCurrency - Target currency code
 * @param locale - Locale for number formatting
 * @returns Formatted string with currency symbol
 *
 * @example
 * formatConvertedAmount(1000, 'USD', 'en-US') // → "$15.70"
 * formatConvertedAmount(1000, 'EUR', 'pt-PT') // → "14,40 €"
 */
export function formatConvertedAmount(
  amountMZN: number,
  targetCurrency: string,
  locale: string = 'en-US'
): string {
  if (targetCurrency === 'MZN') {
    return `MT ${amountMZN.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const converted = convertFromMZN(amountMZN, targetCurrency)
  const currencyInfo = CURRENCIES[targetCurrency]

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: currencyInfo?.decimals ?? 2,
      maximumFractionDigits: currencyInfo?.decimals ?? 2,
    }).format(converted)
  } catch {
    // Fallback if Intl.NumberFormat doesn't support the currency
    return `${currencyInfo?.symbol || targetCurrency} ${converted.toFixed(currencyInfo?.decimals ?? 2)}`
  }
}

/**
 * Get the best currency for a payment provider.
 * If the provider supports MZN, use MZN directly.
 * Otherwise, use the first supported currency with a known exchange rate.
 *
 * @param providerSupportedCurrencies - Currencies supported by the provider
 * @returns The best currency code to use for the payment
 */
export function getBestCurrencyForProvider(providerSupportedCurrencies: string[]): string {
  // Prefer MZN if supported
  if (providerSupportedCurrencies.includes('MZN')) return 'MZN'

  // Otherwise, prefer USD, then EUR, then GBP, then ZAR
  const preferenceOrder = ['USD', 'EUR', 'GBP', 'ZAR', 'BRL']

  for (const currency of preferenceOrder) {
    if (providerSupportedCurrencies.includes(currency)) return currency
  }

  // Fallback to first supported currency
  return providerSupportedCurrencies[0] || 'USD'
}

/**
 * Get all available exchange rates (for admin display).
 */
export function getAllExchangeRates(): Record<string, number> {
  return { ...EXCHANGE_RATES }
}
