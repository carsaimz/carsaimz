/**
 * Carsai Mozambique — CORS Proxy + Maintenance Mode
 *
 * Next.js 16 replaces the "middleware" convention with "proxy".
 * This file handles:
 * 1. CORS headers for cross-origin API requests (Capacitor mobile app)
 * 2. Maintenance mode redirect for non-admin users
 *
 * Maintenance mode implementation:
 * - Reads the `carsai-maintenance` cookie (set by admin settings page)
 * - Reads the `carsai-role` cookie (set during login)
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
// Maintenance Mode Handler
// ============================================================================

function handleMaintenance(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  // Always allow the maintenance page itself
  if (pathname === '/maintenance') {
    return null // Continue to page normally
  }

  // Check maintenance mode cookie
  const maintenanceCookie = request.cookies.get('carsai-maintenance')?.value
  const isMaintenanceOn = maintenanceCookie === 'true'

  // If maintenance mode is not active, allow through
  if (!isMaintenanceOn) {
    return null
  }

  // Check user role cookie
  const roleCookie = request.cookies.get('carsai-role')?.value
  const isAdmin = roleCookie === 'admin' || roleCookie === 'super_admin'

  // Admins and super_admins can bypass maintenance mode
  if (isAdmin) {
    return null
  }

  // Redirect to maintenance page
  const maintenanceUrl = new URL('/maintenance', request.url)
  return NextResponse.redirect(maintenanceUrl)
}

// ============================================================================
// Main Proxy Function
// ============================================================================

export function proxy(request: NextRequest) {
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
  const maintenanceResponse = handleMaintenance(request)
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
