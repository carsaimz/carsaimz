# Task 1: Admin DB Manager Page

## Summary
Created a complete Firestore database management admin page with API route, page component, menu item, and translations.

## Files Created
- `src/app/api/admin/db-manager/route.ts` — API route with GET (list collections, browse documents, view single document) and DELETE (delete document) handlers
- `src/app/(dashboard)/admin/db-manager/page.tsx` — Admin page with collection listing, document browsing, document detail view, delete functionality, and JSON export

## Files Modified
- `src/components/layout/admin-shell.tsx` — Added Database icon import and DB Manager menu item
- All 7 translation files — Added `admin.dbManager`, `admin.collections`, `admin.documents`, `admin.documentCount`, `admin.viewDocument`, `admin.deleteDocument`, `admin.exportCollection`, `admin.confirmDeleteDoc` keys

## Features
1. Lists all Firestore collections with document counts (sorted by count desc)
2. Browses collection documents with pagination (20 per page)
3. Views document details with all fields displayed
4. Deletes individual documents with confirmation dialog
5. Exports collection data as JSON download

# Task 2: App Update Check Component

## Summary
Created a mobile app update check component that checks GitHub releases and shows update dialogs.

## Files Created
- `src/components/common/app-update-check.tsx` — Update check component with semver comparison, 24h cooldown, and APK download

## Files Modified
- `src/components/layout/admin-shell.tsx` — Added AppUpdateCheck import and component render
- All 7 translation files — Added `update.available`, `update.currentVersion`, `update.latestVersion`, `update.download`, `update.changelog`, `update.remindLater`, `update.downloadApk` keys

## Features
1. Checks for updates by comparing APP_VERSION with latest GitHub release tag
2. Only shows on Capacitor native apps (isCapacitorApp())
3. Auto-checks on mount with 24h localStorage cooldown
4. Shows notification bar when update available
5. Shows dialog with current vs latest version, changelog, and download APK button
6. "Remind me later" skips specific version until next check

## Lint Status
Passed with no errors.
