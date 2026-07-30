# Task: Fix Partner Area & Create Missing Admin Management Pages

## Summary

Completed all 8 items successfully:

### 1. Fixed Partner Withdrawal Form - Wired up the button
- **Created API route**: `/src/app/api/partner/withdrawals/route.ts` (GET, POST, PUT)
- **Updated `partner-withdrawals.tsx`**: Added `handleRequestWithdrawal` onClick handler that POSTs to `/api/partner/withdrawals`, shows toast on success/failure, refreshes the list. Added `accountDetails` state, `submitting` state, and proper status badges.
- **Updated `partner-dashboard.tsx`**: Added `handleRequestWithdrawal` onClick handler for the withdrawal form button, added `accountDetails` and `withdrawSubmitting` state, wired up the account details input fields for mpesa/transfer/deposit methods.

### 2. Fixed Partner Affiliate Share/QR
- **Updated `partner-affiliate.tsx`**: Added `showQR` state, `handleShare` function using Web Share API with navigator.clipboard fallback, `handleShowQR` function that toggles QR code display using `api.qrserver.com`, added QR code image display section.

### 3. Created Admin Support Ticket Management Page
- **API route**: `/src/app/api/admin/support/route.ts` (GET all tickets with enrichment, PUT update status, DELETE)
- **Component**: `/src/components/admin/admin-support-manager.tsx` - Table of all tickets, detail dialog with replies, reply form (POST /api/support/replies), status change dialog (open→in_progress→resolved→closed), delete confirmation
- **Page**: `/src/app/(dashboard)/admin/support/page.tsx`

### 4. Created Admin Quotes Management Page
- **API route**: `/src/app/api/admin/quotes/route.ts` (GET all quotes with user enrichment, PUT update status)
- **Component**: `/src/components/admin/admin-quotes-manager.tsx` - Table of all quotes, detail dialog, status change (pending→approved→in_progress→completed→rejected)
- **Page**: `/src/app/(dashboard)/admin/quotes/page.tsx`

### 5. Created Admin Payments Management Page
- **API route**: `/src/app/api/admin/payments/route.ts` (GET all payments with user enrichment, PUT update status)
- **Component**: `/src/components/admin/admin-payments-manager.tsx` - Table of all payments, detail dialog, status change (pending→completed→failed→refunded)
- **Page**: `/src/app/(dashboard)/admin/payments/page.tsx`

### 6. Created Admin Partner Management Page
- **API route**: `/src/app/api/admin/partner/route.ts` (GET all partners with stats, PUT update commission rate/approve withdrawals, POST create coupon codes)
- **Component**: `/src/components/admin/admin-partner-manager.tsx` - Table of all partners, detail dialog with stats/withdrawals/commissions, commission rate dialog, coupon creation dialog, withdrawal approve/reject
- **Page**: `/src/app/(dashboard)/admin/partner/page.tsx`

### 7. Added new admin pages to sidebar
- **Updated `admin-shell.tsx`**: Added 4 new items to ADMIN_MENU_ITEMS:
  - `/admin/support` with Headphones icon
  - `/admin/quotes` with ClipboardList icon
  - `/admin/payments` with CreditCard icon
  - `/admin/partner` with Briefcase icon

### 8. Added i18n keys
- **Updated `pt-pt.ts`**: Added `admin.support: 'Suporte'`, `admin.quotes: 'Orçamentos'`, `admin.payments: 'Pagamentos'`, `admin.partner: 'Parceiros'`
- **Updated `en-us.ts`**: Added `admin.support: 'Support'`, `admin.quotes: 'Quotes'`, `admin.payments: 'Payments'`, `admin.partner: 'Partners'`
