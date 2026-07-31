# Ads System API Routes - Task Summary

## Task: Create Ads System API Routes

### Files Created

1. **`/src/lib/ads-helpers.ts`** — Shared helper functions
   - `checkAutoDeactivate(ad)` — Checks if ad should be auto-deactivated based on limits and dates
   - `firePixelUrls(urls)` — Fires tracking pixel URLs using fetch (non-blocking)
   - `getActiveAdsForPlacement(db, placement, limit)` — Gets active ads for a placement with auto-deactivation check
   - `initializeAdPlans(db)` — Creates default ad plans if none exist
   - `verifyAuthToken(authHeader)` — Verifies Bearer token and returns uid + role
   - `isAdmin(role)` / `isPartner(role)` — Role checking helpers
   - TypeScript interfaces: `Ad`, `AdPlan`

2. **`/src/app/api/ads/route.ts`** — Main ads endpoint
   - `GET` — Fetch active ads for display (public), auto-deactivates expired/over-limit ads, fires impression pixels, increments impression count
   - `POST` — Create a new ad (partner only), sets status to 'pending'

3. **`/src/app/api/ads/[id]/route.ts`** — Single ad operations
   - `GET` — Get a single ad by ID
   - `PUT` — Update an ad (partner can update own pending ads, admin can update any)
   - `DELETE` — Delete an ad (partner can delete own pending ads, admin can delete any)

4. **`/src/app/api/ads/[id]/approve/route.ts`** — Approve ad (admin only)
   - Sets status to 'approved', sets approvedBy/approvedAt
   - If startDate is in the past, sets to 'active'

5. **`/src/app/api/ads/[id]/reject/route.ts`** — Reject ad (admin only)
   - Sets status to 'rejected', sets rejectedReason
   - Requires reason in body

6. **`/src/app/api/ads/[id]/stats/route.ts`** — Track ad events
   - Creates record in ad_stats collection
   - Increments corresponding counter (clicks/conversions)
   - Fires pixel URLs for the event type
   - Checks auto-deactivation after incrementing

7. **`/src/app/api/admin/ads/route.ts`** — Admin ads management
   - `GET` — Fetch all ads with filtering (status, partnerId, type) and pagination

8. **`/src/app/api/admin/ads/plans/route.ts`** — Ad plans management
   - `GET` — Fetch all ad plans (initializes defaults if none exist)
   - `POST` — Create a new ad plan (admin only)
   - `PUT` — Update an ad plan (admin only, body includes id field)

9. **`/src/app/api/partner/ads/route.ts`** — Partner's own ads
   - `GET` — Fetch partner's own ads (partnerId from query param or auth token)

### Default Ad Plans
1. **Gratuito** (Free) — 1 ad, 1000 impressions/month, basic placements, no analytics
2. **Básico** (500 MZN/month) — 3 ads, 10000 impressions/month, all placements, basic analytics
3. **Profissional** (1500 MZN/month) — 10 ads, 50000 impressions/month, all placements, full analytics, priority
4. **Premium** (3000 MZN/month) — Unlimited ads, unlimited impressions, all placements, full analytics, high priority, custom branding, dedicated support

### Patterns Used
- `getAdminFirestore()` from `@/lib/firebase-admin` for server-side Firestore operations
- `getAdminAuth()` from `@/lib/firebase-admin` for verifying admin role
- `checkFirebaseAdmin()` from `@/lib/db-helpers` for checking Firebase availability
- `serializeFirestore()` from `@/lib/serialize` for converting Firestore Timestamps to ISO strings
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500, 503)
- Non-blocking operations for pixel firing and auto-deactivation
- Lint passes with 0 errors
