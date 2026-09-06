# Carsai Mozambique — Platform Update Work Record

## Task: Massive Platform Update (Supabase, UI, Auth, FAQ, super_admin)

### Changes Implemented

### 1. Supabase Integration (Infrastructure)
- **Created `.env`** with Supabase keys (URL, anon key, service role key)
- **Created `src/lib/supabase.ts`** — Supabase client module with both `supabaseClient` (anon key) and `supabaseAdmin` (service role key) exports
- **Rewrote `src/lib/db.ts`** — Simplified to use Prisma/SQLite as primary database (reliable for local dev), with Supabase available for future migration. The Supabase wrapper approach was tried but caused issues with advanced Prisma features (groupBy, aggregate, _count), so we reverted to Prisma as primary while keeping Supabase client ready for future use.
- **Created `supabase/migrations/001_initial.sql`** — Complete PostgreSQL migration file matching all Prisma schema tables, ready to be executed in Supabase SQL Editor

### 2. Fixed Toast/Notification Loop Bug
- **Updated `src/components/features/real-time-notifications.tsx`**
- Added `shownToastIds` ref (Set) to track notification IDs that have already been shown as toast
- Only calls `toast()` if the notification ID hasn't been shown before
- Prevents duplicate toasts on subsequent 30-second poll cycles

### 3. Updated Name "Carsai Mozambique" (not "Moçambique")
- Replaced ALL occurrences of "Moçambique" with "Mozambique" across 20+ source files using sed
- Updated translation files, seed data, layout components, hero section, footer, auth page

### 4. Updated All Topbars (Logo Only, No Search, Limited Flags)
- **Public Header** (`public-header.tsx`):
  - Removed "Carsai" + "Mozambique" text next to logo → just logo image
  - Removed GlobalSearch button and import
  - Language flags limited to pt-pt 🇲🇿, en-us 🇺🇸, pt-br 🇧🇷; others use 🌐
  - Mobile sheet also updated (logo only, no text)

- **Admin Shell** (`admin-shell.tsx`):
  - Sidebar: logo only, removed "Carsai" text, just admin label
  - Topbar: removed search button, removed GlobalSearch import
  - Language flags limited to 3; footer updated to "Carsai Mozambique"

- **Partner Shell** (`partner-shell.tsx`):
  - Same changes as admin shell
  - Removed GlobalSearch

- **User Shell** (`user-shell.tsx`):
  - Same changes as admin/partner shells
  - Removed Search icon/button from topbar
  - Removed GlobalSearch import

- **Footer** (`footer.tsx`, `public-footer.tsx`, `src/components/public/footer.tsx`):
  - Logo only, no "Carsai" + "Mozambique" text next to logo
  - Updated to show just the logo image

- **Auth Page**: Logo only, removed text below it

- **Header** (`header.tsx`): Same logo-only + no-search changes

### 5. Installed react-quill + sweetalert2
- **Installed packages**: `bun add react-quill sweetalert2`
- **Created `src/components/common/rich-text-editor.tsx`**:
  - RichTextEditor with 3 levels: full (admin), basic (partner), minimal (user)
  - Dynamic import (SSR: false) for Next.js compatibility
  - Supports value/onChange for controlled usage, readOnly for display
  - RichTextRenderer for displaying HTML content

- **Created `src/lib/swal.ts`**:
  - `confirmAction()`, `successAlert()`, `errorAlert()`, `infoAlert()`, `confirmDelete()`
  - Consistent Carsai theme styling (emerald colors)

### 6. super_admin Visibility Restrictions
- **Updated `admin-users.tsx`**: Added `excludeSuperAdmin=true` query param, client-side filter to exclude super_admin users
- **Updated `admin/users/route.ts`**: API always excludes super_admin by default; defensive filter in response mapping
- super_admin badge removed from roleBadge function
- Dashboard stats already exclude super_admin from user count

### 7. Auth Page Redirect + Persistent Sessions
- **Updated `src/app/(public)/auth/page.tsx`**:
  - Added `hasHydrated` check from auth store
  - Shows loading spinner while Zustand persist middleware hydrates
  - Only redirects after hydration is complete (prevents flash of login form on page load when session exists in localStorage)
  - Added `hasHydrated` dependency to redirect useEffect

### 8. Added 10 More FAQ Entries (faq32-faq41) + 7 Language Translations
- **Topics**: Data privacy, refund/cancellation policy, project delivery timeline, custom quote request, accessibility, mobile app, account deletion, cookie management, international clients, partnership requirements
- **Languages updated**: pt-pt, en-us, pt-br, fr-fr, es-es, zh-cn, de-de

### 9. Verified All Areas Functional
- Lint check passes ✅
- Seed API works ✅
- Login API works ✅ (super_admin credentials verified)
- Dashboard API works ✅ (stats, recent activity)
- Admin users API excludes super_admin ✅
- Home page loads ✅
- Services API works ✅
- Dev server running on port 3000 ✅

### Files Modified/Created
- `.env` — Updated with Supabase keys
- `src/lib/supabase.ts` — New file
- `src/lib/db.ts` — Simplified to Prisma/SQLite primary
- `src/lib/seed-data.ts` — Updated company_name to "Carsai Mozambique"
- `src/lib/swal.ts` — New file
- `src/components/common/rich-text-editor.tsx` — New file
- `src/components/features/real-time-notifications.tsx` — Fixed toast loop
- `src/components/layout/public-header.tsx` — Logo only, no search, limited flags
- `src/components/layout/admin-shell.tsx` — Logo only, no search, limited flags
- `src/components/layout/partner-shell.tsx` — Logo only, no search, limited flags
- `src/components/layout/user-shell.tsx` — Logo only, no search, limited flags
- `src/components/layout/footer.tsx` — Logo only
- `src/components/layout/header.tsx` — Logo only, no search
- `src/components/layout/public-footer.tsx` — Logo only
- `src/components/public/footer.tsx` — Logo image instead of text
- `src/components/public/home-hero.tsx` — Uses t('home.heroTitle') instead of hardcoded text
- `src/components/admin/admin-users.tsx` — Excludes super_admin
- `src/app/(public)/auth/page.tsx` — HasHydrated check + logo only
- `src/app/api/admin/users/route.ts` — Excludes super_admin
- `supabase/migrations/001_initial.sql` — New SQL migration file
- All 7 translation files — Added faq32-faq41 entries
- 20+ source files — "Moçambique" → "Mozambique" replacement
