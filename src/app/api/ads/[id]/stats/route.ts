/**
 * Carsai Mozambique — Ads Stats API Route
 *
 * POST /api/ads/[id]/stats — Track an ad event (click, conversion, close)
 *   Body: event ('click' | 'conversion' | 'close'), sessionId (string), placement (string)
 *   Creates a record in ad_stats collection
 *   Increments the corresponding counter on the ad
 *   Fires pixel URLs for the event type
 *   Checks auto-deactivation
 */

import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, updateDoc, createDoc } from '@/lib/db'
import {
  firePixelUrls,
  checkAutoDeactivate,
  type Ad,
} from '@/lib/ads-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 503 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Ad ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { event, sessionId, placement, userId } = body

    // Validate event type
    const validEvents = ['click', 'conversion', 'close']
    if (!event || !validEvents.includes(event)) {
      return NextResponse.json(
        { success: false, message: `event is required and must be one of: ${validEvents.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'sessionId is required' },
        { status: 400 }
      )
    }

    // Fetch the ad
    const existingAd = await getDoc('ads', id) as Ad | null

    if (!existingAd) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      )
    }

    // Only track events for active ads
    if (existingAd.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Cannot track events for inactive ads' },
        { status: 400 }
      )
    }

    // Get request metadata for the stat record
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Create the stat record
    await createDoc('ad_stats', {
      adId: id,
      event,
      userId: userId || null,
      sessionId,
      ip,
      userAgent,
      placement: placement || null,
      timestamp: FieldValue.serverTimestamp(),
    })

    // Increment the corresponding counter on the ad
    const counterField = event === 'click' ? 'clicks' : event === 'conversion' ? 'conversions' : null
    if (counterField) {
      await updateDoc('ads', id, {
        [counterField]: FieldValue.increment(1),
      })
    }

    // Fire pixel URLs for the event type
    if (event === 'click' && existingAd.clickPixelUrls && existingAd.clickPixelUrls.length > 0) {
      firePixelUrls(existingAd.clickPixelUrls)
    } else if (event === 'conversion' && existingAd.conversionPixelUrls && existingAd.conversionPixelUrls.length > 0) {
      firePixelUrls(existingAd.conversionPixelUrls)
    }

    // Check auto-deactivation (after incrementing counters)
    if (existingAd.autoDeactivate) {
      // Re-fetch the ad to get updated counters
      const updatedAd = await getDoc('ads', id) as Ad | null
      if (updatedAd) {
        const { shouldDeactivate, reason } = checkAutoDeactivate(updatedAd)
        if (shouldDeactivate) {
          const status = reason === 'expired' ? 'expired' : 'completed'
          // Deactivate in the background
          db.collection('ads').doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
          }).catch((err: any) => {
            console.error(`[Ads] Failed to auto-deactivate ad ${id}:`, err.message)
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[Ads] Stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to track ad event' },
      { status: 500 }
    )
  }
}
