import type { NextConfig } from "next";

// When building for Capacitor (native app), use static export.
// For web development and deployment, use standard server mode (API routes work).
// Set BUILD_TARGET=capacitor for native builds, or leave unset for web.
const isCapacitorBuild = process.env.BUILD_TARGET === "capacitor";

const nextConfig: NextConfig = {
  // Only use static export for Capacitor builds.
  // For web, API routes need a server — they won't work with static export.
  output: isCapacitorBuild ? "export" : undefined,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
