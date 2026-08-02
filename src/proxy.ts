/**
 * Carsai Mozambique — CORS Proxy + Maintenance Mode
 *
 * Next.js 16 replaces the "middleware" convention with "proxy".
 * This file handles:
 * 1. CORS headers for cross-origin API requests (Capacitor mobile app)
 * 2. Maintenance mode redirect for non-admin users
 *
 * Maintenance mode implementation:
 * - Reads maintenance_mode from Firestore settings collection
 * - Verifies user role via Firebase ID token (from carsai-id-token cookie)
 * - Falls back to carsai-role cookie for faster checks
 * - If maintenance is ON and user is not admin/super_admin → redirect to /maintenance
 * - Always allows: /maintenance, /api/*, /_next/*, static files
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// CORS Configuration
// ============================================================================

// Allowed origins — Capacitor app origins + deployment URLs
const ALLOWED_ORIGINS = [
  'https://localhost',            // Capacitor Android (androidScheme: 'https')
  'http://localhost',             // Capacitor Android (legacy http scheme)
  'capacitor://localhost',        // Capacitor iOS default scheme
  'https://carsaimz.vercel.app',  // Vercel deployment (current)
  'https://carsai.mz',            // Production domain (future)
  'com.carsaimz://',              // Capacitor custom URL scheme
  'com.carsaimz://localhost',     // Capacitor custom scheme variant
]

// Also allow any localhost variant for local development
function isLocalhost(origin: string): boolean {
  try {
    const url = new URL(origin)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0'
  } catch {
    return false
  }
}

// ============================================================================
// CORS Handler
// ============================================================================

function handleCors(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin') || ''

  // For preflight (OPTIONS) requests, respond with CORS headers
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })

    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || isLocalhost(origin)
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')

    return response
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next()

  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || isLocalhost(origin)
  if (origin && isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (!origin) {
    response.headers.set('Access-Control-Allow-Origin', '*')
  } else {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control')

  return response
}

// ============================================================================
// Maintenance Mode Handler (async — reads from Firestore)
// ============================================================================

/**
 * Check if the user is an admin or super_admin.
 * Uses two strategies:
 * 1. Fast: Check carsai-role cookie (set during login)
 * 2. Reliable: Verify Firebase ID token from carsai-id-token cookie
 */
async function isUserAdmin(request: NextRequest): Promise<boolean> {
  // Strategy 1: Fast cookie check
  const roleCookie = request.cookies.get('carsai-role')?.value
  if (roleCookie === 'admin' || roleCookie === 'super_admin') {
    return true
  }

  // Strategy 2: Verify Firebase ID token
  const idTokenCookie = request.cookies.get('carsai-id-token')?.value
  if (!idTokenCookie) return false

  try {
    // Dynamic import to avoid loading Firebase Admin on every request
    const { getAdminAuth } = await import('@/lib/firebase-admin')
    const adminAuth = getAdminAuth()
    if (!adminAuth) return false

    const decodedToken = await adminAuth.verifyIdToken(idTokenCookie, true)
    if (!decodedToken) return false

    // Check custom claims for role
    const role = decodedToken.role
    if (role === 'admin' || role === 'super_admin') {
      // Set the role cookie for faster subsequent checks
      const response = NextResponse.next()
      response.cookies.set('carsai-role', role, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
        httpOnly: false,
      })
      return true
    }

    // Also check Firestore profile for role (custom claims may not be set yet)
    const uid = decodedToken.uid
    const { getDoc } = await import('@/lib/db')
    const userDoc = await getDoc('users', uid)
    if (userDoc) {
      const userRole = userDoc.role
      if (userRole === 'admin' || userRole === 'super_admin') {
        return true
      }
    }

    return false
  } catch (err) {
    // Token may be expired or invalid — not admin
    return false
  }
}

/**
 * Check if maintenance mode is active.
 * Reads from Firestore settings collection.
 * Falls back to the carsai-maintenance cookie for performance.
 */
async function isMaintenanceModeActive(request: NextRequest): Promise<boolean> {
  // Fast check: cookie (set by admin settings page or maintenance page)
  const maintenanceCookie = request.cookies.get('carsai-maintenance')?.value
  if (maintenanceCookie === 'false') {
    // Cookie explicitly says not in maintenance — trust it (recently toggled off)
    return false
  }

  // Read from Firestore for the source of truth
  try {
    const { getDoc } = await import('@/lib/db')
    const setting = await getDoc('settings', 'maintenanceMode')
    const isActive = setting?.value === 'true'

    // Sync the cookie with the Firestore value for faster subsequent checks
    // We'll do this in the main handler by setting the cookie on the response

    return isActive
  } catch (err) {
    // If Firestore read fails, fall back to cookie
    return maintenanceCookie === 'true'
  }
}

async function handleMaintenance(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Always allow the maintenance page itself
  if (pathname === '/maintenance') {
    return null // Continue to page normally
  }

  // Check if maintenance mode is active
  const isMaintenanceOn = await isMaintenanceModeActive(request)

  // If maintenance mode is not active, allow through
  if (!isMaintenanceOn) {
    return null
  }

  // Check if user is admin/super_admin
  const isAdmin = await isUserAdmin(request)

  // Admins and super_admins can bypass maintenance mode
  if (isAdmin) {
    return null
  }

  // Redirect to maintenance page
  const maintenanceUrl = new URL('/maintenance', request.url)
  return NextResponse.redirect(maintenanceUrl)
}

// ============================================================================
// Main Proxy Function (async)
// ============================================================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── API routes: handle CORS only ──
  if (pathname.startsWith('/api/')) {
    return handleCors(request)
  }

  // ── Next.js internal paths: always allow ──
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  // ── Static files: always allow ──
  if (
    pathname === '/logo.png' ||
    pathname === '/logo.svg' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // ── Non-API routes: check maintenance mode ──
  const maintenanceResponse = await handleMaintenance(request)
  if (maintenanceResponse) {
    return maintenanceResponse
  }

  // ── Default: allow through ──
  return NextResponse.next()
}

export const config = {
  // Match all request paths except static assets that Next.js handles internally
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}
