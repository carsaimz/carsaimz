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
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
