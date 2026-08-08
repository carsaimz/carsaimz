'use client';

/**
 * Client-side layout wrapper.
 *
 * Previously managed a loading overlay, but since Next.js 16 with Turbopack
 * renders pages quickly, the overlay was rarely visible and added unnecessary
 * complexity. Now it's a simple pass-through wrapper.
 */
export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
