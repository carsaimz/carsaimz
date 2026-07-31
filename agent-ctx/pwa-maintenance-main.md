# Task: PWA Manifest + Install Prompt + Maintenance Mode

## Summary
Implemented PWA manifest with install prompt system and maintenance mode page with middleware integration.

## Files Created
1. `/home/z/my-project/public/manifest.webmanifest` - PWA manifest file with CarsaiMz branding
2. `/home/z/my-project/src/components/common/pwa-install-prompt.tsx` - PWA install prompt component
3. `/home/z/my-project/src/app/maintenance/page.tsx` - Maintenance mode page with hidden admin login
4. `/home/z/my-project/src/app/api/maintenance/route.ts` - Maintenance mode API route (GET)

## Files Modified
1. `/home/z/my-project/src/app/layout.tsx` - Added manifest link, Apple meta tags, PwaInstallPrompt component
2. `/home/z/my-project/src/proxy.ts` - Added maintenance mode redirect logic (merged with existing CORS proxy)
3. `/home/z/my-project/src/components/admin/admin-settings.tsx` - Added cookie setting for maintenance mode
4. `/home/z/my-project/src/lib/translations/pt-pt.ts` - Added pwa + maintenance translations
5. `/home/z/my-project/src/lib/translations/en-us.ts` - Added pwa + maintenance translations
6. `/home/z/my-project/src/lib/translations/pt-br.ts` - Added pwa + maintenance translations
7. `/home/z/my-project/src/lib/translations/fr-fr.ts` - Added pwa + maintenance translations
8. `/home/z/my-project/src/lib/translations/es-es.ts` - Added pwa + maintenance translations
9. `/home/z/my-project/src/lib/translations/zh-cn.ts` - Added pwa + maintenance translations
10. `/home/z/my-project/src/lib/translations/de-de.ts` - Added pwa + maintenance translations
11. `/home/z/my-project/src/lib/translations/sw-tz.ts` - Added pwa + maintenance translations

## Key Design Decisions
- Used `proxy.ts` (Next.js 16 convention) instead of `middleware.ts` since the project already had a proxy.ts
- Maintenance mode uses cookies (`carsai-maintenance`, `carsai-role`) for Edge-compatible checks
- PWA install prompt checks `isCapacitorApp()` to avoid showing on native apps
- Hidden admin login form on maintenance page uses a small dot (·) as trigger
- Admin login uses Firebase Auth client SDK via `useAuthStore().loginWithEmailPassword()`
