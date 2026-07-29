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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure jose is resolved as a regular CJS module on the server
      config.resolve.alias = config.resolve.alias || {};
      // The jose v4 we installed is CJS-compatible, no alias needed
    }
    return config;
  },
};

export default nextConfig;
