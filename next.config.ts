import type { NextConfig } from 'next'

// Determine output mode from BUILD_TARGET env var (set by CI or build script):
//   - BUILD_TARGET=capacitor  → output: "export"   (static export for Capacitor/mobile)
//   - BUILD_TARGET=standalone → output: "standalone" (standalone server for Docker/Electron)
//   - (default)               → output: undefined   (standard server mode for Vercel)
const buildTarget = process.env.BUILD_TARGET || ''
const output = buildTarget === 'capacitor' ? 'export' as const
  : buildTarget === 'standalone' ? 'standalone' as const
  : undefined

const nextConfig: NextConfig = {
  output,
  reactStrictMode: false,
  serverExternalPackages: [
    'firebase-admin',
    'jwks-rsa',
    'openid-client',
    'google-auth-library',
    'gaxios',
    'gtoken',
  ],
  // jwks-rsa is pinned to v3.2.2 via package.json overrides.
  // v3 uses jose@^4 (CJS-compatible), so no ESM/CJS conflicts.
  // This eliminates the "require() of ES Module jose" error that
  // was causing HTTP 500 on all Firebase Admin API routes.
  //
  // No webpack/turbopack aliases needed — jose v4 has native CJS support.
}

export default nextConfig
