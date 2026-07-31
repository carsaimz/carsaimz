/**
 * Carsai Mozambique — Loyalty System Helper Functions
 *
 * Shared utilities for the loyalty/fidelity system:
 * - Tier calculation based on total earned points
 * - Points earning with tier multiplier
 * - Points redemption
 * - Default loyalty tier initialization
 * - Auth verification (reused from ads-helpers pattern)
 */

import { Firestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { getDoc, createDoc, updateDoc, queryDocs } from '@/lib/db'

// ─── Types ───

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
export type TransactionType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment'
export type TransactionReason = 'service_purchase' | 'referral_bonus' | 'welcome_bonus' | 'review_testimonial' | 'redemption' | 'points_expired' | 'admin_adjustment'

export interface LoyaltyPoints {
  id: string
  userId: string
  points: number
  totalEarned: number
  totalRedeemed: number
  tier: LoyaltyTier
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface LoyaltyTransaction {
  id: string
  userId: string
  type: TransactionType
  points: number
  reason: TransactionReason
  referenceId: string | null
  description: string
  createdAt: Timestamp
}

export interface TierBenefits {
  discountPercent: number
  prioritySupport: boolean
  freeServices: number
  exclusiveAccess: boolean
  bonusMultiplier: number
  customBadge: boolean
}

export interface LoyaltyTierConfig {
  id: string
  name: LoyaltyTier
  minPoints: number
  maxPoints: number
  benefits: TierBenefits
  color: string
  icon: string
  order: number
}

// ─── Tier Calculation ───

/**
 * Calculate tier based on total earned points.
 * - Bronze: 0-499 points
 * - Silver: 500-1999 points
 * - Gold: 2000-4999 points
 * - Platinum: 5000-14999 points
 * - Diamond: 15000+ points
 */
export function calculateTier(totalEarned: number): LoyaltyTier {
  if (totalEarned >= 15000) return 'diamond'
  if (totalEarned >= 5000) return 'platinum'
  if (totalEarned >= 2000) return 'gold'
  if (totalEarned >= 500) return 'silver'
  return 'bronze'
}

/**
 * Get the tier thresholds for progress calculation.
 */
export function getTierThresholds(): Array<{ tier: LoyaltyTier; minPoints: number; maxPoints: number }> {
  return [
    { tier: 'bronze', minPoints: 0, maxPoints: 499 },
    { tier: 'silver', minPoints: 500, maxPoints: 1999 },
    { tier: 'gold', minPoints: 2000, maxPoints: 4999 },
    { tier: 'platinum', minPoints: 5000, maxPoints: 14999 },
    { tier: 'diamond', minPoints: 15000, maxPoints: Infinity },
  ]
}

/**
 * Get the next tier info for a given tier.
 */
export function getNextTier(currentTier: LoyaltyTier): { tier: LoyaltyTier; minPoints: number } | null {
  const order: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  const idx = order.indexOf(currentTier)
  if (idx >= order.length - 1) return null
  const next = order[idx + 1]
  const thresholds = getTierThresholds()
  const nextThreshold = thresholds.find(t => t.tier === next)
  return nextThreshold ? { tier: next, minPoints: nextThreshold.minPoints } : null
}

/**
 * Get the bonus multiplier for a given tier.
 */
export function getTierMultiplier(tier: LoyaltyTier): number {
  const multipliers: Record<LoyaltyTier, number> = {
    bronze: 1.0,
    silver: 1.1,
    gold: 1.25,
    platinum: 1.5,
    diamond: 2.0,
  }
  return multipliers[tier]
}

// ─── Points Earning Rules ───

/**
 * Calculate points earned for a service purchase.
 * 1 point per 100 MZN spent, with tier multiplier.
 */
export function calculateEarnPoints(amountSpent: number, tier: LoyaltyTier): number {
  const basePoints = Math.floor(amountSpent / 100)
  const multiplier = getTierMultiplier(tier)
  return Math.floor(basePoints * multiplier)
}

/**
 * Points earned for referral bonus.
 */
export const REFERRAL_BONUS_POINTS = 50

/**
 * Points earned for account creation welcome bonus.
 */
export const WELCOME_BONUS_POINTS = 10

/**
 * Points earned for review/testimonial.
 */
export const REVIEW_BONUS_POINTS = 5

// ─── Get or Create Loyalty Account ───

/**
 * Get or create a user's loyalty points account.
 */
export async function getOrCreateLoyaltyAccount(
  db: Firestore,
  userId: string
): Promise<LoyaltyPoints> {
  // Check if account exists
  const existingSnap = await db.collection('loyalty_points')
    .where('userId', '==', userId)
    .limit(1)
    .get()

  if (!existingSnap.empty) {
    const doc = existingSnap.docs[0]
    return { id: doc.id, ...doc.data() } as LoyaltyPoints
  }

  // Create new account
  const newAccount = {
    userId,
    points: 0,
    totalEarned: 0,
    totalRedeemed: 0,
    tier: 'bronze' as LoyaltyTier,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const ref = db.collection('loyalty_points').doc()
  await ref.set(newAccount)

  return { id: ref.id, ...newAccount, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as LoyaltyPoints
}

// ─── Earn Points ───

/**
 * Add points to a user's loyalty account.
 * Creates the account if it doesn't exist.
 * Also creates a transaction record.
 */
export async function earnPoints(
  userId: string,
  points: number,
  reason: TransactionReason,
  referenceId?: string | null
): Promise<{ success: boolean; newBalance: number; tier: LoyaltyTier }> {
  const db = getAdminFirestore()
  if (!db) throw new Error('Firebase Admin Firestore not configured')

  const account = await getOrCreateLoyaltyAccount(db, userId)

  const newPoints = account.points + points
  const newTotalEarned = account.totalEarned + points
  const newTier = calculateTier(newTotalEarned)

  // Update loyalty_points
  await db.collection('loyalty_points').doc(account.id).update({
    points: newPoints,
    totalEarned: newTotalEarned,
    tier: newTier,
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Create transaction record
  const descriptions: Record<TransactionReason, string> = {
    service_purchase: `Earned ${points} points for service purchase`,
    referral_bonus: `Earned ${points} points referral bonus`,
    welcome_bonus: `Earned ${points} points welcome bonus`,
    review_testimonial: `Earned ${points} points for review/testimonial`,
    redemption: `Redeemed ${points} points`,
    points_expired: `${points} points expired`,
    admin_adjustment: `Admin adjusted ${points} points`,
  }

  await db.collection('loyalty_transactions').add({
    userId,
    type: 'earn' as TransactionType,
    points,
    reason,
    referenceId: referenceId || null,
    description: descriptions[reason] || `Earned ${points} points`,
    createdAt: FieldValue.serverTimestamp(),
  })

  return { success: true, newBalance: newPoints, tier: newTier }
}

// ─── Redeem Points ───

/**
 * Deduct points from a user's loyalty account.
 * Creates a transaction record and a coupon.
 * 1 point = 1 MZN value.
 */
export async function redeemPoints(
  userId: string,
  points: number,
  reason: string = 'redemption'
): Promise<{ success: boolean; newBalance: number; couponCode: string; couponValue: number }> {
  const db = getAdminFirestore()
  if (!db) throw new Error('Firebase Admin Firestore not configured')

  const account = await getOrCreateLoyaltyAccount(db, userId)

  if (account.points < points) {
    throw new Error('Insufficient points balance')
  }

  const newPoints = account.points - points
  const newTotalRedeemed = account.totalRedeemed + points

  // Update loyalty_points
  await db.collection('loyalty_points').doc(account.id).update({
    points: newPoints,
    totalRedeemed: newTotalRedeemed,
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Generate coupon code
  const couponCode = generateCouponCode()
  const couponValue = points // 1 point = 1 MZN

  // Create coupon
  await db.collection('coupons').add({
    code: couponCode,
    type: 'fixed',
    value: couponValue,
    description: `Loyalty redemption: ${points} points = ${couponValue} MZN`,
    userId,
    isActive: true,
    usageLimit: 1,
    usageCount: 0,
    minPurchase: 0,
    applicableServices: [],
    applicableProjects: [],
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), // 90 days
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Create transaction record
  await db.collection('loyalty_transactions').add({
    userId,
    type: 'redeem' as TransactionType,
    points: -points,
    reason: 'redemption' as TransactionReason,
    referenceId: couponCode,
    description: `Redeemed ${points} points for ${couponValue} MZN coupon`,
    createdAt: FieldValue.serverTimestamp(),
  })

  return { success: true, newBalance: newPoints, couponCode, couponValue }
}

// ─── Generate Coupon Code ───

function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LOY-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ─── Initialize Default Loyalty Tiers ───

const DEFAULT_TIERS: Array<Omit<LoyaltyTierConfig, 'id'>> = [
  {
    name: 'bronze',
    minPoints: 0,
    maxPoints: 499,
    benefits: {
      discountPercent: 0,
      prioritySupport: false,
      freeServices: 0,
      exclusiveAccess: false,
      bonusMultiplier: 1.0,
      customBadge: false,
    },
    color: '#CD7F32',
    icon: 'Shield',
    order: 1,
  },
  {
    name: 'silver',
    minPoints: 500,
    maxPoints: 1999,
    benefits: {
      discountPercent: 5,
      prioritySupport: false,
      freeServices: 0,
      exclusiveAccess: false,
      bonusMultiplier: 1.1,
      customBadge: true,
    },
    color: '#C0C0C0',
    icon: 'Award',
    order: 2,
  },
  {
    name: 'gold',
    minPoints: 2000,
    maxPoints: 4999,
    benefits: {
      discountPercent: 10,
      prioritySupport: true,
      freeServices: 1,
      exclusiveAccess: false,
      bonusMultiplier: 1.25,
      customBadge: true,
    },
    color: '#FFD700',
    icon: 'Crown',
    order: 3,
  },
  {
    name: 'platinum',
    minPoints: 5000,
    maxPoints: 14999,
    benefits: {
      discountPercent: 15,
      prioritySupport: true,
      freeServices: 2,
      exclusiveAccess: true,
      bonusMultiplier: 1.5,
      customBadge: true,
    },
    color: '#E5E4E2',
    icon: 'Gem',
    order: 4,
  },
  {
    name: 'diamond',
    minPoints: 15000,
    maxPoints: 999999,
    benefits: {
      discountPercent: 20,
      prioritySupport: true,
      freeServices: 5,
      exclusiveAccess: true,
      bonusMultiplier: 2.0,
      customBadge: true,
    },
    color: '#B9F2FF',
    icon: 'Diamond',
    order: 5,
  },
]

/**
 * Initialize default loyalty tiers if none exist.
 */
export async function initializeLoyaltyTiers(db: Firestore): Promise<void> {
  try {
    const existingSnap = await db.collection('loyalty_tiers').limit(1).get()

    if (!existingSnap.empty) {
      return // Tiers already exist
    }

    console.log('[Loyalty] Initializing default loyalty tiers...')

    const batch = db.batch()
    for (const tier of DEFAULT_TIERS) {
      const ref = db.collection('loyalty_tiers').doc()
      batch.set(ref, {
        ...tier,
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
    console.log('[Loyalty] Default loyalty tiers initialized successfully')
  } catch (error: any) {
    console.error('[Loyalty] Failed to initialize default loyalty tiers:', error.message)
  }
}

// ─── Auth Verification ───

/**
 * Verify a Bearer token from the Authorization header.
 * Returns the decoded uid and user role, or null if verification fails.
 */
export async function verifyAuthToken(
  authHeader: string | null
): Promise<{ uid: string; role: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null

  try {
    const { getAdminAuth } = await import('@/lib/firebase-admin')
    const auth = getAdminAuth()
    if (!auth) return null

    const decodedToken = await auth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Get user's role from Firestore
    const userDoc = await getDoc('users', uid)
    if (!userDoc) return null

    let roleName = 'user'
    if ((userDoc as any).roleId) {
      const roleDoc = await getDoc('roles', (userDoc as any).roleId)
      if (roleDoc) roleName = (roleDoc as any).name || 'user'
    }

    // Also check direct role field
    if ((userDoc as any).role) {
      const roleData = (userDoc as any).role
      if (typeof roleData === 'string') roleName = roleData
      else if (roleData && typeof roleData === 'object' && roleData.name) roleName = roleData.name
    }

    return { uid, role: roleName }
  } catch (error: any) {
    console.error('[Loyalty] Token verification failed:', error.message)
    return null
  }
}

/**
 * Check if a user has admin-level privileges.
 */
export function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'super_admin'
}
