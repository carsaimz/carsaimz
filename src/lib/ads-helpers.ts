/**
 * Carsai Mozambique — Ads System Helper Functions
 *
 * Shared utilities for the ads system:
 * - Auto-deactivation checks
 * - Pixel URL firing
 * - Active ad fetching for placements
 * - Default ad plan initialization
 */

import { Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { getDoc, getDocs, queryDocs, updateDoc, createDoc } from '@/lib/db'

// ─── Types ───

export interface Ad {
  id: string
  title: string
  description: string
  type: 'banner' | 'interstitial' | 'sidebar' | 'native' | 'video' | 'rich_media'
  format: 'html' | 'script' | 'image_base64' | 'video_base64' | 'text_quill' | 'url'
  content: string
  targetUrl: string
  placement: string[]
  planId: string
  partnerId: string
  status: 'pending' | 'approved' | 'active' | 'paused' | 'rejected' | 'expired' | 'completed'
  priority: number
  impressions: number
  clicks: number
  conversions: number
  maxImpressions: number
  maxClicks: number
  maxConversions: number
  startDate: Timestamp
  endDate: Timestamp | null
  autoDeactivate: boolean
  pixelUrls: string[]
  clickPixelUrls: string[]
  conversionPixelUrls: string[]
  approvedBy: string | null
  approvedAt: Timestamp | null
  rejectedReason: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AdPlan {
  id: string
  name: string
  description: string
  price: number
  features: {
    maxAds: number
    maxImpressions: number
    placements: string[]
    formats: string[]
    customBranding: boolean
    analytics: boolean
    priority: number
    supportLevel: string
  }
  isFree: boolean
  isActive: boolean
  order: number
  createdAt: Timestamp
}

// ─── Auto-Deactivation Check ───

/**
 * Check if an ad should be auto-deactivated based on limits and dates.
 * Returns true if the ad should be deactivated.
 */
export function checkAutoDeactivate(ad: Ad): { shouldDeactivate: boolean; reason?: string } {
  const now = new Date()

  // Check if ad has expired (end date passed)
  if (ad.endDate) {
    const endDate = ad.endDate instanceof Timestamp ? ad.endDate.toDate() : new Date(ad.endDate as any)
    if (endDate < now) {
      return { shouldDeactivate: true, reason: 'expired' }
    }
  }

  // Check if ad hasn't started yet (should not deactivate, but shouldn't be active either)
  if (ad.startDate) {
    const startDate = ad.startDate instanceof Timestamp ? ad.startDate.toDate() : new Date(ad.startDate as any)
    if (startDate > now && ad.status === 'active') {
      // This shouldn't happen normally, but if it does, pause it
      return { shouldDeactivate: false }
    }
  }

  // Check impression limit
  if (ad.maxImpressions > 0 && ad.impressions >= ad.maxImpressions) {
    return { shouldDeactivate: true, reason: 'max_impressions' }
  }

  // Check click limit
  if (ad.maxClicks > 0 && ad.clicks >= ad.maxClicks) {
    return { shouldDeactivate: true, reason: 'max_clicks' }
  }

  // Check conversion limit
  if (ad.maxConversions > 0 && ad.conversions >= ad.maxConversions) {
    return { shouldDeactivate: true, reason: 'max_conversions' }
  }

  return { shouldDeactivate: false }
}

// ─── Pixel URL Firing ───

/**
 * Fire tracking pixel URLs using fetch (non-blocking).
 * Errors are silently caught — pixel firing should never block the main operation.
 */
export function firePixelUrls(urls: string[]): void {
  if (!urls || urls.length === 0) return

  for (const url of urls) {
    if (!url || typeof url !== 'string') continue

    // Fire asynchronously — don't await
    fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
    }).catch(() => {
      // Silently ignore pixel firing errors
    })
  }
}

// ─── Get Active Ads for Placement ───

/**
 * Get active ads for a specific placement with auto-deactivation checks.
 * - Fetches ads matching the placement and status='active'
 * - Checks each ad for auto-deactivation
 * - Deactivates expired/over-limit ads
 * - Returns only valid active ads sorted by priority (descending)
 */
export async function getActiveAdsForPlacement(
  db: Firestore,
  placement: string,
  limit: number = 5
): Promise<Ad[]> {
  // Query active ads that contain the requested placement
  const snap = await db.collection('ads')
    .where('status', '==', 'active')
    .where('placement', 'array-contains', placement)
    .orderBy('priority', 'desc')
    .limit(limit * 2) // Fetch extra in case some get deactivated
    .get()

  const validAds: Ad[] = []

  for (const doc of snap.docs) {
    const ad = { id: doc.id, ...doc.data() } as Ad

    // Check auto-deactivation
    if (ad.autoDeactivate) {
      const { shouldDeactivate, reason } = checkAutoDeactivate(ad)
      if (shouldDeactivate) {
        // Deactivate the ad in the background
        const status = reason === 'expired' ? 'expired' : 'completed'
        db.collection('ads').doc(ad.id).update({
          status,
          updatedAt: FieldValue.serverTimestamp(),
        }).catch((err: any) => {
          console.error(`[Ads] Failed to auto-deactivate ad ${ad.id}:`, err.message)
        })
        continue // Skip this ad
      }
    }

    validAds.push(ad)

    // Stop if we have enough
    if (validAds.length >= limit) break
  }

  return validAds
}

// ─── Default Ad Plans ───

const DEFAULT_AD_PLANS = [
  {
    name: 'Gratuito',
    description: 'Plano gratuito para começar a publicitar o seu negócio. Ideal para testar a plataforma.',
    price: 0,
    features: {
      maxAds: 1,
      maxImpressions: 1000,
      placements: ['home_sidebar', 'services_sidebar'],
      formats: ['image_base64', 'text_quill'],
      customBranding: false,
      analytics: false,
      priority: 10,
      supportLevel: 'community',
    },
    isFree: true,
    isActive: true,
    order: 1,
  },
  {
    name: 'Básico',
    description: 'Plano básico com mais alcance e opções de formatos. Ideal para pequenos negócios.',
    price: 500,
    features: {
      maxAds: 3,
      maxImpressions: 10000,
      placements: ['home_top', 'home_sidebar', 'services_sidebar', 'services_top', 'blog_between', 'blog_sidebar'],
      formats: ['image_base64', 'text_quill', 'html', 'url'],
      customBranding: false,
      analytics: true,
      priority: 30,
      supportLevel: 'email',
    },
    isFree: false,
    isActive: true,
    order: 2,
  },
  {
    name: 'Profissional',
    description: 'Plano profissional com acesso total a placements e analytics avançados. Ideal para empresas em crescimento.',
    price: 1500,
    features: {
      maxAds: 10,
      maxImpressions: 50000,
      placements: [
        'home_top', 'home_sidebar', 'home_bottom',
        'services_top', 'services_sidebar', 'services_bottom',
        'blog_between', 'blog_sidebar', 'blog_top',
        'global_interstitial',
      ],
      formats: ['image_base64', 'text_quill', 'html', 'script', 'url', 'video_base64'],
      customBranding: false,
      analytics: true,
      priority: 60,
      supportLevel: 'priority',
    },
    isFree: false,
    isActive: true,
    order: 3,
  },
  {
    name: 'Premium',
    description: 'Plano premium com recursos ilimitados, branding personalizado e suporte dedicado. Ideal para grandes anunciantes.',
    price: 3000,
    features: {
      maxAds: 0, // unlimited
      maxImpressions: 0, // unlimited
      placements: [
        'home_top', 'home_sidebar', 'home_bottom',
        'services_top', 'services_sidebar', 'services_bottom',
        'blog_between', 'blog_sidebar', 'blog_top',
        'global_interstitial', 'native_feed',
      ],
      formats: ['image_base64', 'text_quill', 'html', 'script', 'url', 'video_base64', 'rich_media'],
      customBranding: true,
      analytics: true,
      priority: 90,
      supportLevel: 'dedicated',
    },
    isFree: false,
    isActive: true,
    order: 4,
  },
]

/**
 * Initialize default ad plans if none exist.
 * This is called when fetching plans to ensure defaults are always available.
 */
export async function initializeAdPlans(db: Firestore): Promise<void> {
  try {
    const existingSnap = await db.collection('ad_plans').limit(1).get()

    if (!existingSnap.empty) {
      return // Plans already exist
    }

    console.log('[Ads] Initializing default ad plans...')

    const batch = db.batch()
    for (const plan of DEFAULT_AD_PLANS) {
      const ref = db.collection('ad_plans').doc()
      batch.set(ref, {
        ...plan,
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
    console.log('[Ads] Default ad plans initialized successfully')
  } catch (error: any) {
    console.error('[Ads] Failed to initialize default ad plans:', error.message)
    // Don't throw — this is a background operation
  }
}

// ─── Auth Helpers ───

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

    return { uid, role: roleName }
  } catch (error: any) {
    console.error('[Ads] Token verification failed:', error.message)
    return null
  }
}

/**
 * Check if a user has admin-level privileges.
 */
export function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Check if a user has partner-level privileges.
 */
export function isPartner(role: string): boolean {
  return role === 'partner' || role === 'admin' || role === 'super_admin'
}
