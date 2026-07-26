'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { DashboardSidebar } from '@/components/layout/sidebar';

/**
 * AppShell - Client-side shell component that wraps the entire application.
 * Separated from layout.tsx to avoid hydration mismatches from client-only
 * state (auth, language, theme).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <DashboardSidebar>
        <main className="flex-1">
          {children}
        </main>
      </DashboardSidebar>
      <Footer className="mt-auto" />
    </div>
  );
}
