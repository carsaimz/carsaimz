# Task: Improve Auto-Update System & Firebase Push Notification Web Setup

## Summary

Completed all tasks for improving the auto-update system and adding Firebase push notification web support.

## Files Modified

### 1. `/home/z/my-project/src/components/common/app-update-check.tsx`
- **Removed** `if (!isNative) return null` check — now works on web too
- **Changed** cooldown from 24 hours to 30 minutes (`CHECK_COOLDOWN_MS = 30 * 60 * 1000`)
- **Added** 30-minute background interval check (`setInterval` with `FOREGROUND_CHECK_INTERVAL_MS`)
- **Added** `Progress` component (shadcn/ui) for download progress bar with percentage
- **Added** Windows/Electron `.exe` detection (`findExeAsset()`)
- **Added** `react-markdown` for changelog rendering with prose styling
- **Added** platform detection (`detectPlatform()`) — 'android', 'windows', 'web'
- **Added** "Visit download page" button for web users without direct download
- **Added** download with progress tracking using `ReadableStream` API
- **Added** persistent notification bar when update is available

### 2. `/home/z/my-project/src/components/common/push-notification-setup.tsx` (NEW)
- Client component for FCM push notification registration
- Checks browser notification support on mount
- Shows prompt to enable notifications if not registered
- Uses `requestFCMToken()` from `@/lib/firebase-client`
- Sends token to `/api/notifications/register-token` API
- Handles permission request gracefully
- Compact and full card display modes
- i18n support: `notifications.enablePush`, `notifications.pushEnabled`, `notifications.pushDisabled`, `notifications.pushBlocked`

### 3. `/home/z/my-project/src/app/api/notifications/register-token/route.ts` (NEW)
- POST endpoint to register FCM token
- Body: `token` (string), `platform` ('web' | 'android' | 'ios' | 'windows')
- Requires authentication (Bearer token in Authorization header)
- Verifies Firebase ID token via `getAdminAuth().verifyIdToken()`
- Stores token in user's Firestore document (`users/{uid}/fcmTokens` array)
- Supports both legacy string tokens and new object tokens with platform info
- Deduplicates tokens

### 4. `/home/z/my-project/src/lib/firebase-messaging-sw.ts` (NEW)
- Helper module for registering the Firebase Messaging service worker
- Exports `registerMessagingServiceWorker()` — registers `/firebase-messaging-sw.js`
- Exports `requestNotificationPermission()` — requests browser notification permission
- Exports `getFCMToken()` — gets FCM token with service worker registration
- Exports `unregisterMessagingServiceWorker()` — cleanup
- Handles service worker lifecycle (install, activate, waiting states)

### 5. `/home/z/my-project/public/firebase-messaging-sw.js` (NEW)
- Firebase Cloud Messaging service worker for web push notifications
- Uses Firebase 12.x compat SDK from CDN (`importScripts`)
- Handles `onBackgroundMessage` for background notification display
- Handles `notificationclick` event — opens app to relevant page
- Handles data-only push messages (fallback)
- Service worker lifecycle: `install` (skipWaiting), `activate` (claim clients)

## Lint Results
- All new/modified files pass ESLint with 0 errors
- Existing project has 3 warnings (unrelated scripts)
