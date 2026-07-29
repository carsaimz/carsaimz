'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { AppUpdateCheck } from '@/components/common/app-update-check';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const isPartner = useAuthStore((s) => s.isPartner);
  const isUser = useAuthStore((s) => s.isUser);

  // ── Only redirect after rehydration is complete ──
  // Zustand persist rehydrates from localStorage asynchronously.
  // We wait for hasHydrated to be true before making any redirect decisions.
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/home');
      return;
    }

    if (hasHydrated && isAuthenticated) {
      const isPrivileged = isAdmin || isSuperAdmin;

      // ── Default dashboard redirect ──
      // If user lands on the bare /dashboard path, redirect to their default dashboard.
      // admin/super_admin → /admin, partner → /partner, user → /user
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        if (isPrivileged) {
          router.replace('/admin');
        } else if (isPartner) {
          router.replace('/partner');
        } else if (isUser) {
          router.replace('/user');
        } else {
          router.replace('/home');
        }
        return;
      }

      // ── Access control ──
      // admin/super_admin can access ALL dashboard areas
      // Non-privileged users cannot access /admin routes
      // Non-partner, non-privileged users cannot access /partner routes
      if (!isPrivileged && pathname.startsWith('/admin')) {
        router.replace('/user');
        return;
      }
      if (!isPartner && !isPrivileged && pathname.startsWith('/partner')) {
        router.replace('/user');
        return;
      }
    }
  }, [hasHydrated, isAuthenticated, isAdmin, isSuperAdmin, isPartner, isUser, pathname, router]);

  // ── Show "Checking authentication..." during rehydration ──
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppUpdateCheck />
      {children}
    </>
  );
}
