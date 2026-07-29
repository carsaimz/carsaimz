# Task: Fix role-based access, loading overlay, and affiliate links

## Task ID: task-1-2-3-combined

## Summary

Three issues were fixed in the Carsai Mozambique Next.js project:

### 1. Role-based access for super_admin/admin

**Files changed:**
- `src/app/(dashboard)/layout.tsx` — Added role-based redirect logic:
  - If not authenticated → redirect to /home
  - If authenticated and on bare `/dashboard` route → redirect to default dashboard based on role (admin→/admin, partner→/partner, user→/user)
  - Added access control: non-privileged users blocked from `/admin`, non-partner non-privileged users blocked from `/partner`
  - Admin/super_admin can freely navigate to all dashboard areas

- `src/components/layout/admin-shell.tsx` — Added USER_MENU_ITEMS and PARTNER_MENU_ITEMS to sidebar, shown conditionally for admin/super_admin via `isPrivileged` flag

- `src/components/layout/partner-shell.tsx` — Added ADMIN_MENU_ITEMS and USER_MENU_ITEMS to sidebar, shown conditionally for admin/super_admin

- `src/components/layout/user-shell.tsx` — Added ADMIN_MENU_ITEMS and PARTNER_MENU_ITEMS to sidebar, shown conditionally for admin/super_admin

All shell components now use `useAuthStore` to get `isAdmin` and `isSuperAdmin` flags and compute `isPrivileged = isAdmin || isSuperAdmin`.

### 2. Loading overlay behavior

**Files changed:**
- `src/components/common/client-layout-wrapper.tsx` — Replaced fixed 2.5s timer with:
  - Double `requestAnimationFrame` to detect when content is actually rendered
  - Safety timeout of 3 seconds maximum
  - Both mechanisms trigger `setIsLoading(false)` independently

- `src/components/common/loading-overlay.tsx` — Updated fade-out transition to 0.6s duration with `easeInOut` for smoother exit, and added `pointer-events-auto` to ensure overlay is interactive while visible

### 3. Affiliate link URL fix

**Files changed:**
- `src/components/partner/partner-affiliate.tsx` — Imported `API_BASE_URL` from `@/lib/client-config` and replaced `https://carsai.mz` with `API_BASE_URL`
- `src/components/partner/partner-dashboard.tsx` — Same change: imported `API_BASE_URL` and replaced hardcoded URL

Format: `${API_BASE_URL}/ref/${user?.id || 'demo-partner-001'}`

## Lint result
- `bun run lint` passed cleanly with no errors
