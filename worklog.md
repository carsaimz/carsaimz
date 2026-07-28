---
Task ID: 1
Agent: Main Agent
Task: Firebase migration — fill credentials, add Phone Auth, fix auth context, update UI

Work Log:
- Explored full codebase — Firebase structure already exists (firebase-client.ts, firebase-admin.ts, db.ts, fcm.ts, serialize.ts)
- Updated .env with actual Firebase client SDK credentials from user (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId)
- Created android/app/google-services.json with user-provided Android config (package_name: com.carsaimz)
- Updated firebase-client.ts — added Analytics, Firestore client, Firebase Storage, FCM token request, foreground message listener, RecaptchaVerifier for phone auth, PhoneAuthProvider
- Updated client-config.ts — added phoneSignIn=true, emailSignIn=true, cloudStorage=true, remoteConfig=true, appCheck=true, crashlytics=true, performanceMonitoring=true
- Fixed auth-context.tsx — added onAuthStateChanged listener for session persistence, exposed all auth methods (loginWithEmailPassword, loginWithGoogle, loginAnonymously, loginWithPhone, verifyPhoneCode), added backward-compat login method
- Updated store.ts — added loginWithPhone (SMS OTP step 1), verifyPhoneCode (SMS OTP step 2), phoneVerificationId state, fixed register to not send password to server (Firebase Auth handles passwords)
- Rewrote scripts/seed.js — replaced Prisma/MySQL with a pointer to firebase-seed.js (which already exists and works)
- Installed @capacitor-firebase/authentication@8.3.0 and @capacitor-firebase/messaging@8.3.0
- Fixed login-modal.tsx — updated to use loginWithEmailPassword instead of nonexistent login(), added Google Sign-In button, Anonymous Sign-In button, Phone Auth (SMS OTP) with reCAPTCHA container
- Fixed auth page.tsx — updated to use store.loginWithEmailPassword, store.register, store.loginWithGoogle, store.loginAnonymously; added social login buttons (Google + Anonymous) with separator
- Fixed fr-fr.ts translation file — escaped apostrophe in l'authentification that was breaking build
- Build successful: 34 HTML pages, 406 files in output directory

Stage Summary:
- Firebase client SDK credentials fully configured with real values
- google-services.json created in android/app/
- All 4 free auth methods implemented: Email/Password, Google, Phone (SMS OTP), Anonymous
- Auth context and store properly expose all login methods
- Login modal and auth page updated with social login buttons
- FCM (push notifications) infrastructure ready (client token request + server messaging)
- Firebase Analytics, Cloud Storage, Firestore client all initialized
- Build compiles successfully (34 pages, 406 files)
- Still needs: FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY (service account key) for server-side API routes to work
- Still needs: NEXT_PUBLIC_FIREBASE_VAPID_KEY for FCM web push notifications

---
Task ID: 1
Agent: main
Task: Fix Android build Java 21 error, missing language flags, and hardcoded Portuguese strings in auth UI

Work Log:
- Diagnosed Android build failure: `invalid source release: 21` caused by Java 17 in CI vs JavaVersion.VERSION_21 in capacitor.build.gradle
- Updated android-build.yml: Java 17→21, SDK platforms;android-34→36, build-tools;34.0.0→36.0.0
- Updated release.yml: Java 17→21
- Added flags for fr-fr (🇫🇷), es-es (🇪🇸), zh-cn (🇨🇳), de-de (🇩🇪) in LANGUAGE_FLAGS mapping in public-header.tsx
- Replaced hardcoded Portuguese strings in auth page with t() translation calls (ou→t('auth.or'), Falha no login→t('auth.loginFailed'), etc.)
- Replaced hardcoded Portuguese fallback strings in login-modal.tsx with pure t() calls
- Added common.networkError translation key to all 7 translation files (pt-pt, en-us, pt-br, fr-fr, es-es, zh-cn, de-de)
- Exported AuthResult interface from store.ts (was causing TS2459 error in auth-context.tsx)
- Verified all changed files pass ESLint

Stage Summary:
- Android CI build now uses Java 21 + SDK 36 matching capacitor.build.gradle
- All 7 languages now have proper flag emojis in the language switcher
- Auth UI no longer has hardcoded Portuguese strings — all text uses t() for i18n
- common.networkError key added to all translation files
- AuthResult properly exported from store.ts
