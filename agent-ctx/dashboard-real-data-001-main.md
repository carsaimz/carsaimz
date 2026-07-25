# Task: Rewrite Dashboard Components to Use Real Database Data

## Task ID: dashboard-real-data-001
## Agent: main

## Summary
Rewrote all 4 dashboard components to fetch data from real database API endpoints, completely removing ALL mock/hardcoded data. Created 2 new API endpoints needed for the admin dashboard. All lint checks pass.

## Files Changed

### 1. `/home/z/my-project/src/components/user/user-dashboard.tsx`
**Changes:**
- Removed ALL mock data arrays (mockQuotes, mockPayments, mockTickets)
- Added `useEffect` to fetch from `/api/dashboard?role=user&userId={user.id}`
- Added TypeScript interfaces for API response data (DashboardQuote, DashboardPayment, DashboardTicket, DashboardNotification, DashboardData)
- Added loading skeleton state using `Skeleton` component from shadcn/ui
- Added error state with retry button (no fallback to mock data)
- Replaced hardcoded phone ("+258 84 XXX XXX"), location ("Maputo, Moçambique"), and company ("Empresa XYZ") with real data from API response (`data.user.phone` etc.)
- Uses real user data for profile section from API response
- Added empty state components with Inbox icon when no data available
- Stats are calculated from real API data (totalQuotes, totalPayments, totalTickets, unreadNotifications)

### 2. `/home/z/my-project/src/components/partner/partner-dashboard.tsx`
**Changes:**
- Removed ALL mock data arrays (mockCommissionHistory, mockPortfolioProjects)
- Removed hardcoded stats values (totalClicks=342, conversions=18, commissionsEarned=41500, pendingCommissions=7000)
- Added `useEffect` with `Promise.all` to fetch from `/api/dashboard?role=partner&userId={user.id}` and `/api/projects` in parallel
- Added TypeScript interfaces for API response data (Commission, Click, PortfolioProject, PartnerData)
- Added loading skeleton state
- Added error state with retry (no fallback to mock data)
- Commission table now uses real commission data from API (id, amount, status, createdAt)
- Portfolio section uses real projects from `/api/projects` API
- Stats are calculated from real API data (totalClicks, totalCommissions, etc.)
- Conversion rate calculated dynamically from real data
- Withdrawal history shows paid commissions from real data (no hardcoded "MT 15,000 — M-Pesa")

### 3. `/home/z/my-project/src/components/financial/financial-section.tsx`
**Changes:**
- Removed ALL mock data arrays (mockQuotes, mockProposals, mockPayments, mockInvoices - ~30+ hardcoded entries)
- Added `useAuthStore` import to get user ID
- Added `useEffect` with `Promise.all` to fetch from `/api/quotes?userId={user.id}`, `/api/payments?userId={user.id}`, `/api/invoices?userId={user.id}`
- Proposals are derived from quotes data (each quote includes its proposals)
- Added TypeScript interfaces for all API response shapes (ApiQuote, ApiProposal, ApiPayment, ApiInvoice)
- Added loading skeleton state
- Added error state with retry (no fallback to mock data)
- Quote submission now actually calls `/api/quotes` POST endpoint (previously just closed the dialog)
- Summary stats calculated from real data (totalQuotesValue, totalPaymentsValue, etc.)
- Empty states added for all tabs (quotes, proposals, payments, invoices)

### 4. `/home/z/my-project/src/components/admin/admin-dashboard.tsx`
**Changes:**
- Removed ALL hardcoded chart data arrays (revenueData, usersGrowthData, postsByCategoryData, recentActivity)
- Removed fallback mock data in catch block (previously used hardcoded values like totalUsers=1506, totalRevenue=350000)
- Added `useAuthStore` import for user ID
- Added `useEffect` with `Promise.all` to fetch from `/api/stats`, `/api/stats/history`, `/api/dashboard?role=admin&userId={user.id}`
- Added CreditCard icon import (was missing, caused lint error)
- Added TypeScript interfaces for all data types (StatsData, HistoryData, DashboardData, etc.)
- Added loading skeleton state
- Added error state with retry (no fallback to mock data)
- Revenue chart uses real data from `/api/stats/history` endpoint
- Users growth chart uses real monthly data from `/api/stats/history`
- Posts by category pie chart uses real category data from `/api/stats/history`
- Recent activity section uses real data from `/api/dashboard?role=admin` (users, quotes, payments, tickets, posts)
- Payment method breakdown uses real stats from `/api/stats`
- System health section uses real data (active users count, open tickets from stats.support)
- Overview card changes show real computed data instead of hardcoded "+12%", "+8%"

## New API Endpoints Created

### `/home/z/my-project/src/app/api/invoices/route.ts`
- GET endpoint accepting `userId` query parameter
- Fetches invoices linked to proposals that belong to the user's quotes
- Includes invoice items and proposal details
- Returns: `{ success, data: invoices[], count }`

### `/home/z/my-project/src/app/api/stats/history/route.ts`
- GET endpoint for admin chart data
- Fetches confirmed payments grouped by month for revenue chart
- Fetches user registrations grouped by month for user growth chart
- Fetches categories with post counts for posts-by-category chart
- Builds 12-month historical data from real database records
- Returns: `{ success, data: { revenue, usersGrowth, postsByCategory } }`

## Design Decisions
- Every number shown comes from the database via an API call
- If API fails, shows error state with retry button — NEVER falls back to hardcoded mock data
- Empty states show descriptive icons and messages
- Loading states use shadcn/ui Skeleton components matching the card layout
- All animations (framer-motion) and styling preserved from originals
- TypeScript interfaces match actual API response shapes
- Components handle 0 items gracefully with proper empty state UI
