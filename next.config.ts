import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
