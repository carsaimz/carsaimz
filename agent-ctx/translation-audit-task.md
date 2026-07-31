# Translation Audit and Fix Task

## Summary

Conducted a comprehensive translation audit across all 8 language files in the CarsaiMz project. Found and fixed missing keys, added new sections, and standardized interpolation patterns.

## Findings

### Step 1: Keys Used in Codebase
- Extracted 400+ unique translation keys from `t('...')` patterns across the `src/` directory
- Keys span 20+ sections: nav, auth, common, home, services, projects, blog, forum, support, dashboard, admin, partner, financial, footer, contact, faq, legal, notifications, search, chat, newsletter, contactForm, social, testimonials, update, loading, pwa, maintenance, ads, loyalty, coupon, setup, accessibility

### Step 2: Keys Defined in Each File
- **Before fixes**: pt-pt and en-us had 1303 keys, pt-br/es-es/zh-cn/de-de had 1238 keys, fr-fr and sw-tz had 1234 keys
- **After fixes**: All 8 files now have exactly **1382 keys** each

### Step 3: Missing Keys Found

**Across pt-br, es-es, zh-cn, de-de (65 keys each)**:
- Entire `loyalty` section (55 keys) - missing
- Entire `coupon` section (12 keys) - missing
- 2 common keys missing from fr-fr and sw-tz only

**Across fr-fr and sw-tz (69 keys each)**:
- Same as above plus: `common.change`, `common.remove`, `common.dragDropImage`, `common.useInitials`

**Task-required keys NOT in pt-pt (79 keys)**:
- 37 new `ads` keys
- 15 new `loyalty` keys
- 15 new `coupon` keys
- 2 new `pwa` keys
- 5 new `maintenance` keys
- 5 new `notifications` keys

### Step 4: Keys Added

**ads section additions** (37 new keys):
- content, format, targetUrl, startDate, endDate, maxImpressions, maxClicks, autoDeactivate, pixelUrls, partner, plan, myAds
- createAdDesc, adCreated, adUpdated, adDeleted, adApproved, adRejected, adPaused, adResumed
- free, basic, professional, premium, unlimited, perMonth, adsCount, impressionsPerMonth
- availablePlacements, availableFormats, customBranding, analytics, priority, supportLevel, dedicated, full, none

**loyalty section additions** (15 new keys):
- progressToNext, nextTier, bonusMultiplier, couponCode, redeemDesc, discountPercent
- earn, redeem, tier, earnPoints, redeemForDiscount
- bronze, silver, gold, platinum, diamond

**coupon section additions** (15 new keys):
- title, code, description, expiresAt, usageCount, maxUsage, noCoupons
- couponCreated, couponApplied, couponExpired, couponInvalid, couponUsed
- minPurchase, maxDiscount

**pwa section additions** (2 new keys):
- installed, notSupported

**maintenance section additions** (5 new keys):
- email, password, login, loginFailed, loginSuccess

**notifications section additions** (5 new keys):
- enablePush, pushEnabled, pushDisabled, pushBlocked, pushPermission

**common section additions** (4 keys in fr-fr and sw-tz only):
- change, remove, dragDropImage, useInitials

### Step 5: Interpolation Fix

**Problem**: The i18n.ts supports both `{{param}}` and `{param}` patterns, but the standard across the codebase is `{{param}}` (double braces). Some files used single-brace patterns in the loyalty and coupon sections.

**Fixed in pt-pt.ts and en-us.ts**:
- `{value}` → `{{value}}` (in pointsWorth, redeemValue, couponValue, discountPercent, discountFixed)
- `{tier}` → `{{tier}}` (in progressTo)
- `{count}` → `{{count}}` (in pointsNeeded)
- `{balance}` → `{{balance}}` (in redeemDescription)

**All new sections added to all files use the correct `{{param}}` pattern.**

## Verification

- All 8 files now have exactly 1382 keys each
- All files have identical key sets (verified programmatically)
- Lint passes with 0 errors (3 pre-existing warnings unrelated to translations)
- All interpolation patterns use `{{param}}` consistently
