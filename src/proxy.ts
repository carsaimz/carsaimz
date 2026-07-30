/**
 * Carsai Mozambique — CORS Proxy
 *
 * Next.js 16 replaces the "middleware" convention with "proxy".
 * This file replaces the former middleware.ts to comply with the new convention.
 *
 * Allows cross-origin API requests from the Capacitor mobile app
 * (running on https://localhost or com.carsaimz://) and other
 * authorized origins.
 *
 * Without this proxy, fetch() calls from the Capacitor WebView
 * to https://carsaimz.vercel.app/api/* would be blocked by CORS,
 * causing "Unexpected token '<'" errors (HTML error pages instead
 * of JSON) and auth failures ("Utilizador não autenticado").
 */

import { NextRequest, NextResponse } from 'next/server'

// Allowed origins — Capacitor app origins + deployment URLs
const ALLOWED_ORIGINS = [
  'https://localhost',            // Capacitor Android (androidScheme: 'https')
  'http://localhost',             // Capacitor Android (legacy http scheme)
  'capacitor://localhost',        // Capacitor iOS default scheme
  'https://carsaimz.vercel.app',  // Vercel deployment
  'https://carsai.mz',            // Production domain
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

export function proxy(request: NextRequest) {
  // Only handle API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const origin = request.headers.get('origin') || ''

  // For preflight (OPTIONS) requests, respond with CORS headers
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })

    // Allow the requesting origin if it's in our list or localhost
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || isLocalhost(origin)
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else {
      // Still set a default — Capacitor sometimes sends without origin
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours

    return response
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next()

  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || isLocalhost(origin)
  if (origin && isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (!origin) {
    // No origin header (e.g., native HTTP from Capacitor plugin) — allow all
    response.headers.set('Access-Control-Allow-Origin', '*')
  } else {
    // Unknown origin — still allow for Capacitor compatibility
    // Capacitor WebView may send unexpected origin values
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control')

  return response
}

export const config = {
  matcher: '/api/:path*',
}
