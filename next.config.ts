import type { NextConfig } from "next";

// Build targets controlled by BUILD_TARGET env var:
//   - "capacitor" → output: "export" (static HTML/CSS/JS for Capacitor native apps)
//   - "standalone" → output: "standalone" (self-contained server for Electron/Docker)
//   - (unset) → output: undefined (standard server mode for dev/web deployment)
const buildTarget = process.env.BUILD_TARGET || "";

const nextConfig: NextConfig = {
  output: buildTarget === "capacitor" ? "export" : buildTarget === "standalone" ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: [
    'firebase-admin',
    'jose',
    'jwks-rsa',
    'openid-client',
    'google-auth-library',
    'gaxios',
    'gtoken',
  ],
  // Force jose v4 (CJS-compatible) to be used instead of the ESM-only v5+
  // This resolves the "require() of ES Module jose" error from jwks-rsa
  // that was causing HTTP 500 on all Firebase Admin API routes.
  // jose v4 has both CJS and ESM builds; the CJS build is at
  // dist/node/cjs/index.js.
  //
  // Next.js 16 uses Turbopack by default. We provide both:
  // - webpack config (for --webpack flag or fallback)
  // - turbopack resolve alias (for default Turbopack builds)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = config.resolve.alias || {};
      // Force jose to resolve to the CJS version on the server
      (config.resolve.alias as Record<string, string>)['jose'] = 'jose/dist/node/cjs/index.js';
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      // Force jose to resolve to the CJS version in Turbopack
      // This prevents jwks-rsa's require('jose') from hitting the ESM build
      'jose': 'jose/dist/node/cjs/index.js',
    },
  },
};

export default nextConfig;
